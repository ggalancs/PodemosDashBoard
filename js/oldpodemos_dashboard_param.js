var podemos_data_gps = [];
var gps = {};
var categories ={};
var month = new Array('Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre');
var periodMonth = month.slice(MES_INICIAL-1,MES_FINAL);
var cat_color = d3.scale.category20();
var rangeMinDate = new Date("12/31/9999");
var rangeMaxDate = new Date("01/01/1900");
var minDate = new Date("12/31/9999");
var maxDate = new Date("01/01/1900");
var minValue=Number.MAX_VALUE;
var maxValue=Number.MIN_VALUE;

//Parametrizar la funcion Download Data de tal manera que permitar descargar n ficheros
//dandoles formato automaticamente y realizando los ajustes y verificaciones necesarios
//todo ello desde un fichero de configuracion

var interface_PodemosData ={
  category: 'string',
  gp: 'string',
  date: 'date',
  period: 'date',
  entry: 'string',
  journal: 'string',
  analytic_account: 'string',
  comunidad: 'string',
  municipio: 'string',
  account: 'string',
  account_des: 'string',
  group: 'string',
  subgroup: 'string',
  partner: 'string',
  invoice: 'string',
  ref: 'string',
  name: 'string',
  debe: 'number',
  haber: 'number',
  balance: 'number',
  url: 'string'
}

var interface_GP ={
    gp: 'string'
}

var charts=[];

/*function cargaDatos(resolve) {
      d3.tsv(NOMBRE_FICHERO_DATOS)
        .row(function (row) { return ({
        category: row['category'],
        gp: row['gp'],
        date: new Date(row['date']),
        period: new Date(row['period']).getMonth(),
        journal: row['journal'],
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
          }

          // Resolve this promise to indicate that this dependency has been met.
          resolve();
        });
      }*/


function download_data() {
  "use strict";
  return Promise.all([
    new Promise(cargaDatos),
    ]).then(function () {
        d3.selectAll('#waiting').remove();
        d3.selectAll('main').style('display', '');
    });
}
var cat_array =[]

function getAllValues(file,field){

}

var category_clicked=null;
// ###########################################################################
// ## Create and Render the Charts
// This function will create the various charts and tables for this example.
var xf;
var category_dim;
var month_dim;
var date_dim;
var value_dim;

function calculatePlotData(categories){
  var datos=[];

  for (cat in categories){
    var datosCat = month_dim.group().reduceSum(function(d){
      var resultado =0;
      if (d.category===cat){
        resultado = Math.round(d[COLUMNA_VALOR]);
      } else {
        resultado=0;
      }
      return resultado;
    }).all();

    datos.push(datosCat);
  }

    var datos4=[];
    for(var n=0; n < datos.length;n++)
    {
      var cats=Object.keys(categories);//['Subvenciones', 'Aportaciones de cargos públicos', 'Otros ingresos'];
      for(var r=0; r < datos[n].length;r++)
      {
        datos4.push({
          category: cats[n],
          month: datos[n][r].key,
          value: r>0?datos[n][r].value +datos4[datos4.length-1].value : datos[n][r].value,
        });
      }
    }

    for(var n=0;n < datos4.length;n++)
    {
      datos4[n].month=month[datos4[n].month];
    }

    return datos4;
}

function syncData(dataXf){
  charts[0].data = dataXf;//category_dim.top(xf.size());
  charts[1].layers[0].data = calculatePlotData(categories);
  charts[2].data = d3.nest().key(function(d) { return d.key;}).entries(dataXf);
  charts[0].redraw();
  charts[1].layers[0].redraw();
  charts[2].redraw();
}

function setup() {
    //Load parameters
    /*var request = new XMLHttpRequest();
    request.open("GET", "../params/file.json", false);
    request.send(null)
    var my_JSON_object = JSON.parse(request.responseText);
    alert (my_JSON_object.result[0]);
  */

    // ### Prepare the data
    // Output the data set to the console if you want to take a look.
    //console.log("Datos:", podemos_data_gps);
    //console.log("Grupos Parlamentarios:", gps);
    xf = crossfilter(podemos_data_gps);

    var total_ingresos = xf.groupAll().reduceSum(function (d) { return d[COLUMNA_VALOR]; });

    //category_dim = xf.dimension(function (d) { return d.category });
    //month_dim = xf.dimension(function (d) { return d.period; });
    //gp_dim = xf.dimension(function (d) { return d.gp; });
    //date_dim = xf.dimension(function (d)  { return d.date; });  //{ return d.date.toLocaleDateString(); });
    //value_dim = xf.dimension(function (d) { return d[COLUMNA_VALOR]; });

    var timeline;

    var gp_data2= date_dim.top(xf.size());

    //var totalIngresos=month_dim.groupAll().reduceSum(function(row){return row[COLUMNA_VALOR];}).value();
    var totalIngresos=category_dim.groupAll().reduceSum(function(row){return row[COLUMNA_VALOR];}).value();
    var ingresosPorCategoria =category_dim.group().reduceSum(function(d){return d[COLUMNA_VALOR];}).all();


    // Create a `c3.Table` to show the top countries
    var podemos_category_column;

    var Tabla =new c3.Table({
        anchor: '#podemos_table_detail',
        width: '100%',
        data: category_dim.top(xf.size()),
        // Enable users to **select** and **sort** countries in this table.
        selectable: true,
        sortable: true,
        // **Limit** this table to only show the top 10 countries and not to display any countries
        // that have a 0 value.
        limit_rows: 10,
        //filter: function (d) { return d[COLUMNA_VALOR] > 0; },
        // Divide the table up into pages and allow user to **search** the table
        pagination: true,
        searchable: true,
        // Setup **columns** for this table
        columns: [
            {
                header: { text: "Fecha" },
                cells: {
                  html: function (d) { return '<b>' + d.date.toLocaleString() + '</b>'; },
                },
                sort: function(d) {return d.date.getTime();},
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
        ],
        // Initial column to **sort** on.
        sort_column: grupo_column,
        // Add some padding to each cell using `cell_options.styles` to assign **styles** to **cells**
        cell_options: {
            styles: {
                padding: "0 0.25em",
            },
        },
        // Use `row_options.classes` to enable **CSS classes** on table **rows**.  The classes can be
        // whatever class you want for your styling.  Here we turn on the `hover` class if this
        // country matches the country the user is hovering over or is in the region the use is
        // hovering over with their mouse.  The stylesheet will then dictate how these rows appear;
        // in this case giving them a wheat-colored background.
        row_options: {
            classes: {
                //hover: function (d) { return hover_category === d.category || hover_group === d.group || hover_subgroup === d.subgroup; },
            },
            // `row_options.events` adds **event handlers** to table **rows**.  These handlers set the global
            // hover country when the user hovers the mouse over a row.  `restyle()` is then called
            // for all charts to update based on this new focus country.
            events: {
                /*mouseenter: function (d) {
                    hover_category = d.category;
                    restyle();
                },
                mouseleave: function (d) {
                    hover_category = null;
                    restyle();
                },*/
            },
        },
        // `handlers` adds **event handlers** to the chart object itself.  Here we tie into the
        // `select` event when the user selects one or more row to **filter** the data on only that country.
        // _Note_: While all the other charts will filter to only display the filtered country the
        // country scatter plot will still display all countries.  This is because when you filter
        // on a particular dimension it affects all _other_ dimensinos, but _not_ the one used to filter.
        // This is actually a very good thing, otherwise when you filtered on a chart or table all
        // of the data outside of that selection would then disappear which would be awkward and hard
        // to change the selection.  If we wanted the country scatter plot to only show the filtered
        // country, the solution would be easy: just make another dimension and use different ones for
        // the scatter plot and this table.
        handlers: {
            'select': function (selections) {
                if (selections.length)
                    date_dim.filter(function (key) { return selections.map(function (d) { return d.date; }).indexOf(key) >= 0; });
                else
                    date_dim.filterAll();
                redraw();
            },
            // The `match` event is triggered for a row that is found with a user search
            'match': function (search, d) {
                //hover_country = d != null ? countries[d.key] : null;
                //restyle();
            },
        },
    });

    charts.push(Tabla);

  var months_group_scale = d3.scale.ordinal().domain(periodMonth);

  var datos4=calculatePlotData(categories);

  var stackedAreas= new c3.Plot({
    anchor: '#podemos_stacked_areas',
    /*width: 500,*/
    width: '100%',
    height: 350,
    filter: function (d) {
      return d.value > 0; },
    // The **vertical scale** is a normal linear scale for the number of deaths.
    // Note that for the **horizontal scale** we are using an **ordinal ** scale!
    h: months_group_scale,
    h_rotate: -90,
    v: d3.scale.linear().domain([0, d3.max(datos4, function (d) {
      return d.value; })]),
    // Accessors describing how to get the **x** and **y** values from the data.
    x: function (d) { return d.month;},
    y: function (d) { return Math.round(d.value); },
    // Create an **area** layer for the plot.
    // Setting `stack_options` will enable the **stacking** functionality.
    // For normalized data use `stack_options.key` to define an accessor which provides
    // a key that uniquely describes the stack that each data element should belong to.
    // Here we stack the data based on cause of death.

    // Setup **margins** and **axes** to polish up the example.
    // Notice how _grid lines_, scale _tick marks_, and _labels_ can be enabled/disabled
    // and custom `tick_label` formatters setup.
    margins: 8,//{ right: 20 },
    axes: [
        new c3.Axis.X({
            label: "Evolución",
            orient: 'top',
            scale: false,
        }),
        new c3.Axis.X({
            label: "Mes",
            scale: months_group_scale, //d3.scale.linear().domain([0, 100]),
            scale_rotate: -90,
            tick_size: 0,
        }),
        new c3.Axis.Y({
            label: "Ingresos €",
            tick_label: function (d) { return d; },
            scale_rotate: -10,
            //tick_label: function (d) { return (d / 1000000) + "m"; },
            grid: true,
        }),
    ],
    layers: [
        new c3.Plot.Layer.Area({
            options: {
              title: "tipos de ingresos",
              //class: "serie1",
            },
            data: calculatePlotData(categories),
            //v: d3.scale.linear().domain([0,d3.max(datos1, function (d) { return d.value; })]),
            //y: function(d){return Math.round(d.value);},
            interpolate: 'cardinal',
          stack_options: {
                key: function (d) { return d.category; },
                name: function (d) { return d; },
                styles: { 'fill': function (stack) { return cat_color(stack.key); } },
                title: function (stack) { return stack.key; },
          },
        }),
    ],
  });

  var legendAreas= new c3.Legend.PlotLegend({
    anchor: ('#podemos_legend_areas'),
    anchor_styles: {
        'display': 'inline-block',
        'vertical-align': 'top',
    },
    width: '100%',
    plot: stackedAreas,
    hoverable: false,
    nested_item_options: {
      events:{
        'click': function(d)
        {
          if(category_clicked && category_clicked === d.key){
              category_clicked=null;
              category_dim.filterAll();
          }else {
            category_clicked=d.key;
            category_dim.filter(d.key);
          }
          syncData(category_dim.top(xf.size()));
        }
      }
    },
  })

  charts.push(stackedAreas);

    // #########################################################################################
    // ### Initial Rendering
    // Perform the initial `render()`
    for (var _i = 0; _i < charts.length; _i++) {
      var chart = charts[_i];
      chart.render();
    }

    legendAreas.render();

    // **Resize** charts if the window is resized.
    window.onresize = function () {
      for (var _i = 0; _i < charts.length; _i++) {
          var chart = charts[_i];
          chart.resize();
      }
    };
  //createTreeMap2();
  var treeData = d3.nest()
        .key(function(d) { return d.key;})
        .entries(category_dim.top(xf.size()));
  charts.push(new canTree({title: "Grupos Parlamentarios", width: '100%' }, {key: "Total Ingresos", values: treeData }));

  configureFilters();
}

function redraw() {
  for (var _i = 0; _i < charts.length; _i++) {
    var chart = charts[_i];
    chart.redraw();
  }
}

function restyle() {
  for (var _i = 0; _i < charts.length; _i++) {
    var chart = charts[_i];
    chart.restyle();
  }
}

function addSelectElements(idControl,obj){
  var c = document.getElementById(idControl);
  var sortable = [];
  for (var k in obj)
        sortable.push(k)
  sortable.sort();
  for(var k in sortable){
    var option = document.createElement("option");
    option.text = sortable[k];
    option.value = sortable[k];
    c.add(option);
  }
}
// #########################################################################################
// # Start Here
// The loading and rendering are initiated here..  It calls the `download_data()` function to
// download the data which returns a Promise.  We setup a _then_ callback function to be
// called when all of the data is loaded and promised.  This callback function calls which ends up
// calling the `render()` function.
// DEBUG CODE

download_data().then(function () { setTimeout(setup, 0); });
// PRODUCTION CODE


function configureFilters(){
   $(function () {
    addSelectElements("fGP_value",gps);
    addSelectElements("fCategory_value",categories);
    var fGP = $("#fGP_value").select2();
    //fGP.on("select2:select", function (e) {
      fGP.on("change", function (e) {
      var values = $(this).val();
        if (values.length === 0){
          gp_dim.filterAll();
        }else{
          gp_dim.filter(function (key) { return values.indexOf(key) >= 0; });
        }
        syncData(gp_dim.top(xf.size()));
    });
    var fCategory = $("#fCategory_value").select2();
    fCategory.on("change", function (e) {
      var values = $(this).val();
        if (values.length === 0){
          category_dim.filterAll();
        }else{
          category_dim.filter(function (key) { return values.indexOf(key) >= 0; });
        }
        syncData(gp_dim.top(xf.size()));
    });
     rangeMinDate= minDate;
     rangeMaxDate= maxDate;
    var fFrom = $('#fDFrom_value').datetimepicker({locale: 'es', format: 'DD/MM/YYYY', minDate: minDate, maxDate: maxDate, defaultDate: minDate})
      .on("dp.change",function(e){
        rangeMinDate=e.date.toDate();
        changeDates();
      });
    var fTo = $('#fDTo_value').datetimepicker({locale: 'es', format: 'DD/MM/YYYY', minDate: minDate, maxDate: maxDate, defaultDate: maxDate})
      .on("dp.change",function(e){
        rangeMaxDate=e.date.toDate();
        changeDates();
      });;
    function changeDates()
    {
      if (rangeMinDate.toString() === minDate.toString() && rangeMaxDate.toString() ===maxDate.toString()){
        date_dim.filterAll();
      } else
      {
        date_dim.filter([rangeMinDate,rangeMaxDate]);
      }
      syncData(gp_dim.top(xf.size()));
    }
    var fValue = $('#fValue_value').slider({min : minValue, max : maxValue, step : 1, value : [minValue,maxValue],handle: 'custom',
      formatter: function(value) {
        return 'Importe: ' + value;
      }
    });
    fValue.on("slideStop",function(e){
      if(e.value[0]===minValue && e.value[1]===maxValue){
        value_dim.filterAll();
      } else {
        value_dim.filter(e.value);
      }
      syncData(gp_dim.top(xf.size()));
    });

  });
}

//Rutina copiada sólo para depuración
function DumpObjectIndented(obj, indent)
{
  var result = "";
  if (indent == null) indent = "";

  for (var property in obj)
  {
    var value = obj[property];
    if (typeof value == 'string')
      value = "'" + value + "'";
    else if (typeof value == 'object')
    {
      if (value instanceof Array)
      {
        // Just let JS convert the Array to a string!
        value = "[ " + value + " ]";
      }
      else
      {
        // Recursive dump
        // (replace "  " by "\t" or something else if you prefer)
        var od = DumpObjectIndented(value, indent + "  ");
        // If you like { on the same line as the key
        //value = "{\n" + od + "\n" + indent + "}";
        // If you prefer { and } to be aligned
        value = "\n" + indent + "{\n" + od + "\n" + indent + "}";
      }
    }
    result += indent + "'" + property + "' : " + value + ",\n";
  }
  return result.replace(/,\n$/, "");
}
