function Hoja(branch, name, subset, sup, conf) {
    this.subset = subset // Valores posibles '<=' o '>'
    this.branch = branch // Valor que lleva la arista Ej: '<= 78'
    this.name = name; // Nombre de la clase
    this.support = sup; // Soporte
    this.confidence = conf // Confianza
}


function Nodo(branch, name, valueOfSplit, subset) {
    this.subset = subset // Valores posibles '<=' o '>'
    this.branch = branch // Valor que lleva la arista Ej: '<= 78'  
    this.name = name; // Nombre del atributo por el cual se realiza el corte
    this.valueOfSplit = valueOfSplit // Valor por el cual se dividen las ramas del nodo
    this.childs = [];
}

Nodo.prototype.add = function (element) {
    this.childs.push(element);
}

function Point(x,y,clase){
    this.X = x;
    this.Y = y;
    this.Clase = clase;
}