var Arbol = null;
var threshold = 0;
var calculateUsing = 'gain';
var cantTotalRegistros = 0;


async function generarArbol(D, A, umbral, use) {
    cantTotalRegistros = D.length;
    threshold = umbral;
    calculateUsing = use;

    var result = await decisionTree(D, A, Arbol, "root", '');
    return result;
}


function decisionTree(D, A, T, Branch, subset) {
    // Cargo en C los Cj del dataset.       
    var C = [] // Defino un arreglo vacío
    D.forEach(d => {
        C.push(d.Clase)
    });
    C = [...new Set(C.map(a => a))]
    //Ordeno el arreglo por cantidad de ocurrencias de cada elemento (De Mayor a Menor) 
    var C1 = C[0]
    var Cant1 = 0
    var C2 = C[1]
    var Cant2 = 0
    D.forEach(d => {
        if (d.Clase == C1) {
            Cant1 += 1
        } else {
            Cant2 += 1
        }
    })
    if (Cant2 > Cant1) {
        C = []
        C.push(C2);
        C.push(C1)
    }
    // Cargo en A los Ai del dataset.
    var attributes = Object.keys(D[0])
    attributes.pop() // pop() remueve el último elemento del arreglo que corresponde al campo con la Clase de la entidad.
    var A = attributes

    if (C.length == 1) {
        // Existe una sola Clase cj perteneciente al conjunto de Clases C.
        // Agrego una hoja al árbol.
        var sup = D.length / cantTotalRegistros
        var conf = 1
        var hoja = new Hoja(Branch, C[0], subset, sup, conf)
        if (T) {
            T.add(hoja);
        } else {
            T = hoja
            Arbol = T
        }
        /* CASO BASE 1 */
    } else {
        if (A.length == 0) {
            /* No se utiliza para atributos contínuos */
            // El conjunto de atributos A del dataset es nulo. 
            // Agrega una hoja etiquetada con la Clase cj, que es la Clase más frecuente en D.
            var C1 = 0 // Cantidad de registros con la Clase 1 (Más frecuente debido a que se ordenó previamente)
            D.forEach(d => {
                if (d.Clase == C[0]) {
                    C1 += 1
                }
            });
            var sup = D.length / cantTotalRegistros
            var conf = C1 / D.length
            var hoja = new Hoja(Branch, C[0], subset, sup, conf)
            if (T) {
                T.add(hoja);
            } else {
                T = hoja
                Arbol = T
            }
            /* CASO BASE 2  */
        } else {
            // D contiene ejemplos pertenecientes a una mezcla de Clases. 
            // Seleccionamos un único atributo para particionar D en subconjuntos de modo que cada subconjunto sea puro.

            // Asigno a la variable p0 la entropía del dataset.
            var p0 = impurityEval_1(D)

            // Por cada atributo evalúo su impureza y calculo la ganancia.
            /* La variable Ag es un objeto que está conformado por el nombre del atributo 
                el valor de división, la ganancia y el radio de ganancia
            */
            var Ag = null;
            A.forEach(Ai => {
                /* 
                    La evaluación de ganancia de información de cada atributo se realiza 
                    con la funcion giveMeTheBest() 
                */
                var current = giveMeTheBest(Ai, D, p0)
                if (calculateUsing == 'gainRatio') {
                    if (!Ag || current.gainRatio > Ag.gainRatio) {
                        Ag = current
                    }
                }
                if (calculateUsing == 'gain') {
                    if (!Ag || current.gain > Ag.gain) {
                        Ag = current
                    }
                }
            });
            console.log(`Gain: ${Ag.gain}, GainRatio: ${Ag.gainRatio}, Branch: ${Branch}`)
            // Finalizada la evaluación de cada atributo en A comparo la ganancia con el threshold.
            var best;
            if (calculateUsing == 'gainRatio') {
                best = Ag.gainRatio
            } else {
                best = Ag.gain
            }
            if (best <= threshold) {
                // Si la ganancia del atributo Ag es menor al threshold definido
                // agrega una hoja etiquetada con la Clase cj, que es la Clase más frecuente en D.
                var C1 = 0 // Cantidad de registros con la Clase 1 (Más frecuente debido a que se ordenó previamente)
                D.forEach(d => {
                    if (d.Clase == C[0]) {
                        C1 += 1
                    }
                });
                var sup = D.length / cantTotalRegistros
                var conf = C1 / D.length
                var hoja = new Hoja(Branch, C[0], subset, sup, conf);
                if (T) {
                    T.add(hoja);
                } else {
                    T = hoja
                    Arbol = T
                }
                /* CASO BASE 3 */
            } else {
                // Ag es capaz de reducir la impureza p0.
                // Agrego un Nodo para el atributo Ag.
                var nodo = new Nodo(Branch, Ag.attribute, Ag.valueOfSplit, subset)
                // Si es la primer llamada a la función T = null, por lo tanto nodo será el nodo raíz y no admite el metodo add()
                if (T) {
                    T.add(nodo)
                } else {
                    T = nodo
                    Arbol = T
                }

                // Partir D en m subconjuntos D1, ..., Dm basados ​​en los m valores de Ag.
                // En nuestro caso solo tendremos dos particiones
                // (n <= Ag.valueOfSplit y n > Ag.valueOfSplit, siendo n el valor de X o Y que aporta mayor ganancia)

                /* 
                  DMenoresOIgual es un subset de D que contiene los registros para los cuales el valor de Ai es menor o igual al valor de división  
                  DMayores es un subset de D que contiene los registros para los cuales el valor de Ai es mayor al valor de división  
                */
                var DMenoresOIgual = []
                var DMayor = []
                D.forEach(d => {
                    if (d[Ag.attribute] <= Ag.valueOfSplit) {
                        DMenoresOIgual.push(d)
                    } else {
                        DMayor.push(d)
                    }
                });
                // Si el subset de D no está vacío llamo a la función con los nuevos parámetros 
                if (DMenoresOIgual != []) {
                    decisionTree(DMenoresOIgual, A, nodo, '<= ' + Ag.valueOfSplit, '<=')
                }
                if (DMayor != []) {
                    decisionTree(DMayor, A, nodo, '> ' + Ag.valueOfSplit, '>')
                }
                /* LLAMADA RECURSIVA */
            }
        }

    }

    return Arbol
}



function impurityEval_1(D) {
    var CantRegistros = D.length // Cantidad de registros en el dataset
    var C = [] // Defino un arreglo vacío
    D.forEach(d => {
        C.push(d.Clase)
    });
    C = [...new Set(C.map(a => a))]
    var C1 = 0 // Cantidad de registros con la Clase 1
    var C2 = 0 // Cantidad de registros con la Clase 2
    var entropia_D = 0;

    D.forEach(d => {
        if (d.Clase == C[0]) {
            C1 += 1
        }

        if (d.Clase == C[1]) {
            C2 += 1
        }
    });

    if (C1 > 0) {
        entropia_D += -(C1 / CantRegistros) * (Math.log2(C1 / CantRegistros))
    }
    if (C2 > 0) {
        entropia_D += -(C2 / CantRegistros) * (Math.log2(C2 / CantRegistros))
    }

    return entropia_D
}



function giveMeTheBest(Ai, D, p0) {
    var best;

    // Cargo en un arreglo todos los valores posibles del atributo Ai presentes en el dataset D
    var valuesOfAi = [];
    D.forEach(d => {
        valuesOfAi.push(d[Ai])
    });

    valuesOfAi = [...new Set(valuesOfAi.map(a => a))] // Elimino los valores repetidos

    /* Como para cada valor n voy a dividir al dataset en dos subconjuntos 
    D1 (para los valores menores o iguales n) y 
    D2 (para los valores mayores a n)
    no me interesa evaluar el máximo valor presente en el dataset ya que todos los elementos 
    formarían parte del mismo subconjunto (D1) que sería igual al subconjunto original,
    por lo tanto lo elimino del arreglo valuesOfAi  */

    //valuesOfAi = valuesOfAi.sort() // Ordeno los valores de menor a mayor
    //valuesOfAi.pop() // Remuevo el último elemento

    var max = Math.max(...valuesOfAi) // Obtengo el máximo valor

    for (var i = 0; i < valuesOfAi.length; i++) {
        if (valuesOfAi[i] == max) { // Remuevo el valor Máximo
            valuesOfAi.splice(i, 1);
        }
    }
    if (valuesOfAi.length == 0) {
        best = {
            gain: 0,
            splitInfo: 1,
            gainRatio: 0,
            attribute: Ai,
            valueOfSplit: max
        }
        return best
    }
    valuesOfAi.forEach(ai => {
        // D1 es la partición del dataset con los valores menores o iguales a ai
        var D1 = []
        // D2 es la partición del dataset con los valores mayores a ai
        var D2 = []

        var CantMenOIgual = 0
        var CantMayores = 0
        D.forEach(d => {
            if (d[Ai] <= ai) {
                CantMenOIgual += 1
                D1.push(d)
            } else {
                CantMayores += 1
                D2.push(d)
            }
        });

        var gain = p0
        gain = gain - (CantMenOIgual / D.length) * impurityEval_1(D1)
        gain = gain - (CantMayores / D.length) * impurityEval_1(D2)

        var splitInfo = -(D1.length / D.length) * Math.log2(D1.length / D.length) - (D2.length / D.length) * Math.log2(D2.length / D.length)
        var gainRatio = gain / splitInfo

        var aux = {
            gain,
            gainRatio,
            splitInfo,
            attribute: Ai,
            valueOfSplit: ai
        }
        if (!best) {
            best = aux
        } else {
            if (calculateUsing == 'gain') {
                if (aux.gainRatio > best.gainRatio) {
                    best = aux
                }
            } else {
                if (aux.gain > best.gain) {
                    best = aux
                }
            }
        }
    });

    return best
}