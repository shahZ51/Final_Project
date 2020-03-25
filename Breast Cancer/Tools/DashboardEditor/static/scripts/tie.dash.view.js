

document.addEventListener('DOMContentLoaded', function(event) {
    if(document.getElementById("hdn_dashboard_refid")!=null){
        let refid= document.getElementById("hdn_dashboard_refid").value;
        loadDashboard(refid);
    }
});

var DASH_CONTAINER = d3.select("#dash_container");
var TIE_ITEM={};

function loadDashboard(refid){
    console.log("loadDashboard");
    let params = {};
    params.refid = refid;
    d3.json("/api/v1/dashboard/getitem", {
            method: 'POST',
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify(params)
        }).then(function(data){
            console.log("GOT DASHBOARD ITEM SUCCESSFULLY");
            TIE_ITEM = data;
            if(TIE_ITEM.content == null){
                alert("Dashboard is not ready for viewing")
            }else{
                DASH_CONTAINER.html(TIE_ITEM.content.presentation);
                applyDashConfiguration();
            }

    }).catch(function(error){
        //TODO
    });
}


function applyDashConfiguration()
{
    console.log("applyDashConfiguration");
    console.log(TIE_ITEM);
    let ti_sections = TIE_ITEM.content.configuration;
    ti_sections.forEach(function(ti_section){
        console.log(ti_section);
        let ti_elems  = ti_section.ti_elems;
        ti_elems.forEach(function(ti_elem){
            if(ti_elem.ti_elemtyp.toUpperCase() == "TEXT"){ 
                DASH_CONTAINER.select(`#${ti_elem.ti_elemid}`).text(ti_elem.ti_elemval);             
            }else if(ti_elem.ti_elemtyp.toUpperCase() == "IMAGE"){ 
                let dash_elem = DASH_CONTAINER.select(`#${ti_elem.ti_elemid}`);
                let ti_image = ti_elem.ti_elemval;
                dash_elem.attr("src", ti_image.img_src );
                dash_elem.attr("alt", ti_image.img_alt);
            }else if (ti_elem.ti_elemtyp.toUpperCase() == "DATABOUND"){
                if(ti_elem.ti_elemtyp_2.toUpperCase() == "DATATABLE"){
                    renderDataTableElem(ti_elem);
                }else if(ti_elem.ti_elemtyp_2.toUpperCase().startsWith("BARCHART")){
                    console.log("RenderBarChart");
                    let arrTiElemTyp2 = ti_elem.ti_elemtyp_2.split(":");
                    console.log(arrTiElemTyp2[1]);
                    if(arrTiElemTyp2[1].toUpperCase() === "VERTICAL"){
                        renderBarChart_Vertical(ti_elem);
                    }
                }
            }
        });
    });
}


function renderDataTableElem(ti_elem)
{
    console.log(ti_elem)
    let dash_elem = DASH_CONTAINER.select(`#${ti_elem.ti_elemid}`);

    let tableElem = dash_elem.append("table")
        .classed("table table-striped",true);

    let ds_link = TIE_ITEM.content.datasets.filter(d => d.dataset_id == ti_elem.ti_elemval.ti_ev_dsid)[0].dataset_link; 

    d3.csv(ds_link).then(function(data){          
        let selected_columns = ti_elem.ti_elemval.ti_ev_ext_prop.selected_cols;
        table_data = data.map((val) => {
            let row = {};
            selected_columns.forEach(function(column_name){
                row[column_name] = val[column_name];
            });
            return row;
        });
        createTable(tableElem,table_data);
    });
}

function createTable(tableElem, data){
    let table =  tableElem;
    let thead = table.append('thead')
    let tbody = table.append('tbody');
    let columns = d3.keys(data[0]);

    //append header row               
    thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter()
        .append('th')
        .text(d => d);

    // create a row for each object in the data
    var rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr');    

    // create a cell in each row for each column
    var cells = rows.selectAll('td')
        .data(function (row) {
                return columns.map(function (column) {
                    return { column: column, value: row[column] };
                });
             })
        .enter()
        .append('td')
        .text(function (d) { return d.value; });         
}


function renderBarChart_Vertical(ti_elem)
{
    console.log("renderBarChart Vertical");
    
    let dash_elem = DASH_CONTAINER.select(`#${ti_elem.ti_elemid}`);

    console.log(dash_elem);
    let tiDataset = getTieItemDatasetByID(ti_elem.ti_elemval.ti_ev_dsid) ;
    console.log(tiDataset);
    let chartParams = {
        chart_type: ti_elem.ti_elemtyp_2,  
        chart_cols: ti_elem.ti_elemval.ti_ev_ext_prop.chart_cols,  //columns
        chart_rows:  ti_elem.ti_elemval.ti_ev_ext_prop.chart_rows,  //rows
        chart_filters:[],
        chart_orderby:[],
        chart_dataset:{
            dataset_type:tiDataset.dataset_type ,//csv/json
            dataset_path:tiDataset.dataset_link  
        }
    }

    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 30, bottom: 70, left: 60},
    width = dash_elem.node().offsetWidth - margin.left - margin.right,
    height =  dash_elem.node().offsetHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = dash_elem
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    // Parse the Data
  
    d3.json("/dashboard/getchartdata", {
        method: 'POST',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(chartParams)
    }).then(function(data){ 
        // sort data
        //data.sort(function(b, a) {
        //    return a.Value - b.Value;
        //});

        //find min/max
        let arrMinMax = findMinMax(data.map(function(d){return isNaN(d.y_value)?0:d.y_value;}));

        // X axis
        var x = d3.scaleBand()
            .range([ 0, width ])           
            .domain(data.map(function(d) { return d.x_value; }))
            .padding(0.2);
            svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, arrMinMax[1]])
            .range([ height, 0]);
            svg.append("g")
            .call(d3.axisLeft(y));

        // Bars
        svg.selectAll("mybar")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function(d) { return x(d.x_value); })
            .attr("y", function(d) { return y(d.y_value); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d.y_value); })
            .attr("fill", "#69b3a2")

    });

}


//NOTE:  Put this under a common javascript
function getTieItemDatasetByID(datasetID){
    let tiDataset = TIE_ITEM.content.datasets.filter(d => d.dataset_id == datasetID)[0]
    return tiDataset; 
}


function findMinMax(arr) {
    let min = arr[0], max = arr[0];
  
    for (let i = 1, len=arr.length; i < len; i++) {
      let v = arr[i];
      min = (v < min) ? v : min;
      max = (v > max) ? v : max;
    }
  
    return [min, max];
}

//NOTE:  Put this under a common javascript
function formapp_click(){
    let txt_concave_pts_mean = d3.select("#txt_concave_pts_mean");
    let txt_area_mean = d3.select("#txt_area_mean");
    let txt_area_se = d3.select("#txt_area_se");
    let txt_prediction_out = d3.select("#txt_prediction_out");

    params = {
        concave_pts_mean: txt_concave_pts_mean.node().value,
        area_mean: txt_area_mean.node().value,
        area_se: txt_area_se.node().value
    };

    d3.json("/api/v1/breastcancer/predict", {
        method: 'POST',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(params)        
    }).then(function(data){
        
        if(data.result == 'B'){
            txt_prediction_out.node().value = 'Benign';
        }else{
            txt_prediction_out.node().value = 'Malign';
        }
        
    });

}