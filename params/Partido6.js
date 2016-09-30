// Nombre del fichero del que se van a cargar los datos a mostrar
var NOMBRE_FICHERO_DATOS='data/Partido6.csv';

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
        //gp: row['gp'],
        date: new Date(row['date']),
        period: new Date(row['period']).getMonth(),
        journal: row['journal'],
        //analytic_account: row['analytic_account'],
        group: row['group'],
        subgroup: row['subgroup'],
        partner: row['partner'],
        invoice: row['invoice'],
        //ref: row['ref'],
        //name: row['name'],
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
            //gps[rows[k].gp] = (gps[rows[k].gp])? gps[rows[k].gp] + rows[k][COLUMNA_VALOR] :rows[k][COLUMNA_VALOR];
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
