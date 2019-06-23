const dialog = require('electron').remote.dialog;
const path = require('path')
const csv = require('csv');
var fs = require('fs');
var A = ['X', 'Y'];
var threshold; // = parseFloat(document.querySelector("#threshold").value);
var calculateUsing; // = document.querySelector("#calculateUsing").value;
var porcForTest; // = parseFloat(document.querySelector("#porcForTest").value/100);
var porcForTrain; // = parseFloat(document.querySelector("#porcForTrain").value/100);
var cantPruebas; // = parseInt(document.querySelector("#cantPruebas").value);
var DatasetLength = 0;
var D = [];
var DforTest = [];
var cantCasos = 0;
var cantCorrectas = 0;
var exactitud = 0;
var t_ejecucion = 0;
var mem_usage = 0;
var tableBody = document.querySelector("#tbody")
var id = 1
var datasetName;
var results = document.querySelector("#results")


/* Agrego un evento al botón "Seleccionar Archivo" para que despliegue el cuadro de selección de archivos */
document.getElementById('select-file').addEventListener('click', () => {
    dialog.showOpenDialog(fileNames => {
        /* fileNames contiene la ruta del archivo 
            si no se seleccióno ningun archivo se loguea el error
            caso contrario se llama a la función readFile() con la ruta del archivo 
        */
        if (fileNames === undefined) {
            console.log("No file selected");
        } else {
            if (confirm(`Generar Árbol de Decisión para ${fileNames[0]}`)) {

                datasetName = path.basename(fileNames[0]).split('.')[0];

                threshold = parseFloat(document.querySelector("#threshold").value);
                calculateUsing = document.querySelector("#calculateUsing").value;
                porcForTest = parseFloat(document.querySelector("#porcForTest").value/100);
                porcForTrain = parseFloat(document.querySelector("#porcForTrain").value/100);
                cantPruebas = parseInt(document.querySelector("#cantPruebas").value);
                document.getElementById("actual-file").value = fileNames[0];
                document.querySelector("#csv-entrenamiento").classList.add('d-none');
                document.querySelector("#reset").classList.remove('d-none');
                document.querySelector("#navbar").classList.remove('d-none');
                document.querySelector("#evaluation").classList.remove('d-none');
    
                readFile(fileNames[0]);
            }
        }
    });
}, false);


function readFile(filepath) {
    fs.readFile(filepath, 'utf-8', function (err, data) {
        if (err) {
            alert("An error ocurred reading the file :" + err.message);
            return;
        }

        csv.parse(data, async function (err, data) {
            if (err) {
                console.error(err);
                return false;
            }

            var exactitudAcum = 0
            var tiempoAcum = 0

            for (let i = 0; i < cantPruebas; i++) {
                await procesarDataset(data)
                tableBody.innerHTML += `<tr>
                    <td>${id}</td>
                    <td>${DatasetLength}</td>
                    <td>${calculateUsing}</td>
                    <td>${threshold}</td>
                    <td>${D.length}</td>
                    <td>${DforTest.length}</td>
                    <td id='exactitud'>${exactitud}</td>
                    <td id='tiempoEjecucion'>${t_ejecucion}</td>
                    <td>${mem_usage}</td>
                </tr>`

                exactitudAcum += parseFloat(exactitud)
                tiempoAcum += t_ejecucion

                Arbol = null;
                DatasetLength = 0;
                D = [];
                DforTest = [];
                cantCasos = 0;
                cantCorrectas = 0;
                exactitud = 0;
                t_ejecucion = 0;
                mem_usage = 0;
                id += 1

            }

            InitDataTable("#tabla");

            var exactitudes = document.querySelectorAll('#exactitud')
            var tiemposEjecucion = document.querySelectorAll('#tiempoEjecucion')

            var exactitudMedia = exactitudAcum/cantPruebas;
            var tiempoMedio = tiempoAcum/cantPruebas;
            var sdExactitud;
            var sdTiempo;

            var sdExactitudAcum = 0
            exactitudes.forEach(exact => {
                sdExactitudAcum += (parseFloat(exact.innerHTML) - exactitudMedia) ** 2
            })
            sdExactitud = Math.sqrt(sdExactitudAcum/cantPruebas).toFixed(2)

            var sdTiempoAcum = 0
            tiemposEjecucion.forEach(tiempo => {
                sdTiempoAcum += (parseFloat(tiempo.innerHTML) - tiempoMedio) ** 2
            })
            sdTiempo = Math.sqrt(sdTiempoAcum/cantPruebas).toFixed(2)
            
            results.innerHTML = `Exactitud ${exactitudMedia.toFixed(2)} ± ${sdExactitud}. Tiempo: ${tiempoMedio.toFixed(2)} ± ${sdTiempo}`
        })

    });

}


async function procesarDataset(dataRaw) {
    var data = JSON.parse(JSON.stringify(dataRaw))
    data.shift() // remuevo el primer objeto (cabecera) que contiene los nombres de los atributos 
    
    DatasetLength = data.length

    var cantForTest = Math.round(DatasetLength * porcForTest)
    
    for (let i = 0; i < cantForTest; i++) {
        const positionRandom = Math.round(Math.random() * (data.length-1))
        const element = data[positionRandom]
        DforTest.push(new Point(parseFloat(element[0]), parseFloat(element[1]), element[2]))
        data.splice(positionRandom,1)
    }
    
    var cantForTrain = Math.round(DatasetLength * porcForTrain)
    
    for (let i = 0; i < cantForTrain; i++) {
        const positionRandom = Math.round(Math.random() * (data.length-1))
        const element = data[positionRandom]
        D.push(new Point(parseFloat(element[0]), parseFloat(element[1]), element[2]))
        data.splice(positionRandom,1)
    }

    /* data.forEach(row => {
        D.push(new Point(parseFloat(row[0]), parseFloat(row[1]), row[2]))
    }) */

    var t_inicial = Date.now();
    var mem_inicial = process.memoryUsage().heapUsed
    /* Llamada a la función que genera el árbol */
    Arbol = await generarArbol(D, A, threshold, calculateUsing)
    var t_final = Date.now();
    var mem_final = process.memoryUsage().heapUsed

    t_ejecucion = t_final - t_inicial
    mem_usage = (mem_final - mem_inicial) / 1024

    calcularExactitud(DforTest);
    
}

function calcularExactitud(DforTest) {
    cantCasos = DforTest.length
    cantCorrectas = 0
    DforTest.forEach(async point => {
        await clasificarElemento(point, Arbol)
    })
    exactitud = cantCorrectas / cantCasos * 100
    exactitud = parseFloat(exactitud).toFixed(2)
}

async function clasificarElemento(point, Arbol) {
    if (Arbol.childs) {
        if (point[Arbol.name] <= Arbol.valueOfSplit) {
            Arbol.childs.forEach(async child => {
                if (child.subset == '<=') {
                    await clasificarElemento(point, child)
                }
            })
        } else {
            Arbol.childs.forEach(async child => {
                if (child.subset == '>') {
                    await clasificarElemento(point, child)
                }
            })
        }
    } else {
        if (Arbol.name == point.Clase) {
            cantCorrectas += 1
        } 
    }
}



/* Reset */
function reset() {
    window.location.reload()
}