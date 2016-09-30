var podemos_data_gps = [];
var gps = {};
var month = new Array('Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre');
var periodMonth = new Array('Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre');
var cause_color = d3.scale.category20();

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

function download_data() {
  "use strict";
  return Promise.all([
    new Promise(function (resolve) {
      d3.tsv('GP7.csv')
        .row(function (row) { return ({
        category: row['category'],
        gp: row['gp'],
        date: new Date(row['date']),
        //period: month[new Date(row['period']).getMonth()],
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
        value: +row['haber'],
          }); })
          .get(function (error, rows) {
          podemos_data_gps = [];

          for (var k in rows)

            podemos_data_gps.push(rows[k]);

          // Resolve this promise to indicate that this dependency has been met.
          resolve();
        });
      }),
      // ### Load the country data **CSV**
      new Promise(function (resolve) {
          d3.tsv('gps_name.csv')
              .row(function (row) { return ({
              gp: row['gp'],
              id: row['id'],
          }); })
              .get(function (error, rows) {
              rows.filter(function (row) { return !!row['gp']; }).forEach(function (row) {
                  gps[row['gp']] = row['gp'];
              });
              resolve();
          });
      }),
    ]).then(function () {
        d3.selectAll('#waiting').remove();
        d3.selectAll('main').style('display', '');
    });
}

var category_clicked=null;
// ###########################################################################
// ## Create and Render the Charts
// This function will create the various charts and tables for this example.
var xf;
var category_dim;
var month_dim;
var date_dim;
var haber_dim;

function calculatePlotData(){
    var datos1 =month_dim.group().reduceSum(function(d){
      var resultado =0;
      if (d.category==='Subvenciones'){
        resultado = Math.round(d.haber);
      } else {
        resultado=0;
      }
      return resultado;
    }).all();

    var datos2 =month_dim.group().reduceSum(function(d){
      var resultado =0;
      if (d.category==='Aportaciones de cargos públicos'){
        resultado = Math.round(d.haber);
      } else {
        resultado=0;
      }
      return resultado;
    }).all();

    var datos3 =month_dim.group().reduceSum(function(d){
      var resultado =0;
      if (d.category==='Otros ingresos'){
        resultado = Math.round(d.haber);
      } else {
        resultado=0;
      }
      return resultado;
    }).all();

    var datos=[];
    datos.push(datos1);
    datos.push(datos2);
    datos.push(datos3);

    var datos4=[];
    for(var n=0; n < datos.length;n++)
    {
      var categories=['Subvenciones', 'Aportaciones de cargos públicos', 'Otros ingresos'];
      for(var r=0; r < datos[n].length;r++)
      {
        datos4.push({
          category: categories[n],
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

  function syncData(){
    charts[0].data=category_dim.top(xf.size());
    charts[1].layers[0].data=calculatePlotData();
    charts[2].data= d3.nest().key(function(d) { return d.key;}).entries(category_dim.top(xf.size()));
    charts[0].redraw();
    charts[1].layers[0].redraw();
    charts[2].redraw();
  }

function setup() {
    // ### Prepare the data
    // Output the data set to the console if you want to take a look.
    console.log("Datos:", podemos_data_gps);
    console.log("Grupos Parlamentarios:", gps);

    xf = crossfilter(podemos_data_gps);

    var total_ingresos = xf.groupAll().reduceSum(function (d) { return d.haber; });

    category_dim = xf.dimension(function (d) { return d.category });
    month_dim = xf.dimension(function (d) { return d.period; });
    gp_dim = xf.dimension(function (d) { return d.gp; });
    date_dim = xf.dimension(function (d)  { return d.date; });  //{ return d.date.toLocaleDateString(); });
    haber_dim = xf.dimension(function (d) { return d.haber; });

    var timeline;

    var gp_data2= date_dim.top(xf.size());

    var totalIngresos=month_dim.groupAll().reduceSum(function(row){return row.haber;}).value();
    var ingresosPorCategoria =category_dim.group().reduceSum(function(d){return d.haber;}).all();


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
        //filter: function (d) { return d.haber > 0; },
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
                cells: { html: function (d) { return (d3.format(',')(Math.round(d.haber))) + "€"; } },
                //sort: function (d) { return Math.round(d.value.haber); },
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

  var datos4=calculatePlotData();

  var stackedAreas= new c3.Plot({
    anchor: '#podemos_stacked_areas',
    //width: 500,
    //height: 350,
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
            data: calculatePlotData(),
            //v: d3.scale.linear().domain([0,d3.max(datos1, function (d) { return d.value; })]),
            //y: function(d){return Math.round(d.value);},
            interpolate: 'cardinal',
          stack_options: {
                key: function (d) { return d.category; },
                name: function (d) { return d; },
                styles: { 'fill': function (stack) { return cause_color(stack.key); } },
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
    width: '20%',
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
          syncData();
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
  charts.push(new canTree({title: "Grupos Parlamentarios"}, {key: "Total Ingresos", values: treeData }));
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
// #########################################################################################
// # Start Here
// The loading and rendering are initiated here..  It calls the `download_data()` function to
// download the data which returns a Promise.  We setup a _then_ callback function to be
// called when all of the data is loaded and promised.  This callback function calls which ends up
// calling the `render()` function.
// DEBUG CODE
download_data().then(function () { setTimeout(setup, 0); });
// PRODUCTION CODE

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
