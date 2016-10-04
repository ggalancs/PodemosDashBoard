// Nombre del fichero del que se van a cargar los datos a mostrar
var NOMBRE_FICHERO_DATOS='data/GP6.csv';

// Número del Mes en que comienza el periodo de fechas a mostrar (ejemplo: para mostrar Agosto se pondra: 8 )
var MES_INICIAL =6;

// Número del Mes en que comienza el periodo de fechas a mostrar (ejemplo: para mostrar dicienbre se pondra: 12 )
// Tener en cuenta que el mes final siempre tiene que ser igual o superior al mes inicial
// si no, se producira un error.
var MES_FINAL=12;

//Nombre de la columna que contiene los valores a representar
var COLUMNA_VALOR = "debe";

function cargaDatos(resolve) {
      d3.tsv(NOMBRE_FICHERO_DATOS)
        .row(function (row) { return ({
        category: row['category'],
        gp: row['gp'],
        date: new Date(row['date']),
        period: new Date(row['period']).getMonth(),
        journal: row['journal'],
        unidadT: row['name'],
        analytic_account: row['analytic_account'],
        group: row['group'],
        subgroup: row['subgroup'],
        partner: row['partner'],
        invoice: row['invoice'],
        ref: row['ref'],
        name: row['name'],
        debe: +row['debe'],
        haber: +row['haber'],
        balance: +row['balance'],
        url: ['url'],
        key: row['category'],
        value: +row[COLUMNA_VALOR],
          }); })
          .get(function (error, rows) {
          podemos_data_gps = [];

          for (var k in rows){
            categories[rows[k].category]=[];
            gps[rows[k].gp] = (gps[rows[k].gp])? gps[rows[k].gp] + rows[k][COLUMNA_VALOR] :rows[k][COLUMNA_VALOR];
            podemos_data_gps.push(rows[k]);

            var dateAux= new Date(rows[k].date);
            getExtremeDates(dateAux);
            var valueAux=rows[k][COLUMNA_VALOR];
            getExtremeValues(valueAux);
          }

          // Resolve this promise to indicate that this dependency has been met.
          resolve();
        });
      }

var columnasTabla= [
    {
        header: { text: "Unidad Territorial" },
        cells: {
          html: function (d) { return '<b>' + d.unidadT + '</b>'; },
        },
        sort: function(d) {return d.unidadT;},
        vis: 'bar',
    },
    {
        // The "Region" column is styled to have a background that matches the color for the
        // region this country is in.
        header: { text: "Grupo Parlamentario" },
        cells: {
            text: function (d) { return d.gp; },
            /*styles: {
                'background-color': function (d) { return region_color(countries[d.key].region_id); },
            },*/
        },
        sort: function(d) {return d.gp;},
        vis: 'bar',
    },
    grupo_column={
        // These columns use custom formatters to set the html content of the cell
        // adding commas, units, rounding, etc.  You can add raw HTML if you like.
        // These column also use the `vis` visualization support to render a bar
        // graph based on the cell value.
        header: { text: "Grupo" },
        cells: { html: function (d) { return d.group; } },
        sort: function (d) { return d.group; },
        vis: 'bar',
    }, {
        header: { text: "Subgrupo" },
        cells: { html: function (d) { return d.subgroup; } },
        //sort: function (d) { return Math.round(d.subgroup); },
        //vis: 'bar',
    },{
        header: { text: "Categorización" },
        cells: { html: function (d) { return d.category; } },
        sort: function (d) { return d.category; },
        vis: 'bar',
    },
    // Assign this column to a variable `gdp_column` so we can refer to it below for setting the default sort.
    podemos_importe_column = {
        header: { text: "Importe" },
        cells: { html: function (d) { return (d3.format(',')(Math.round(d[COLUMNA_VALOR]))) + "€"; } },
        //sort: function (d) { return Math.round(d.value[COLUMNA_VALOR]); },
        //vis: 'bar',
    },
];
