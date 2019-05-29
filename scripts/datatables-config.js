var MyDataTable;
var titulo = document.querySelector("#titulo");

function InitDataTable(tableId) {
    jQuery(function ($) {
        $(document).ready(function () {
            MyDataTable = $(tableId).DataTable({
                "order": [
                    [0, 'asc']
                ],
                "language": {
                    "decimal": ",",
                    "emptyTable": "No hay datos disponibles",
                    "info": "Mostrando <strong>_START_</strong> a <strong>_END_</strong> de <strong>_TOTAL_</strong> entradas",
                    "infoEmpty": "Mostrando <strong>0</strong> a <strong>0</strong> de <strong>0</strong> entradas",
                    "infoFiltered": "(filtrado de <strong>_MAX_</strong> entradas totales)",
                    "infoPostFix": "",
                    "thousands": ".",
                    "lengthMenu": "Mostrar _MENU_ entradas",
                    "loadingRecords": "Cargando...",
                    "processing": "Procesando...",
                    "search": "Buscar:",
                    "zeroRecords": "No hay coincidencias",
                    "paginate": {
                        "first": "Primero",
                        "last": "Último",
                        "next": "Siguiente",
                        "previous": "Anterior"
                    },
                    "aria": {
                        "sortAscending": ": activar para ordenar la columna ascendente",
                        "sortDescending": ": activar para ordenar la columna descendente"
                    }
                },
                buttons: [{
                        extend: 'excel',
                        text: 'Exportar a Excel',
                        className: 'btn btn-dark btn-large',
                        titleAttr: 'Exportar a Excel',
                        title: document.getElementById("titulo").getAttribute("data-value"),
                        exportOptions: {
                            columns: ':not(.not-export-col)',
                            modifier: {
                                page: 'current',

                            }
                        }
                    }


                ]

            });

            MyDataTable.buttons().container().appendTo('#tableButtons');

        });

    })
}