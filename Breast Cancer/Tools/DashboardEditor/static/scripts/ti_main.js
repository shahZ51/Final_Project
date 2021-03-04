/*========================================================================================================*/
/* DASHBOARD EDIT */

document.addEventListener('DOMContentLoaded', function(event) {
    if(document.getElementById("hdn_dashboard_refid")!=null){
        let refid= document.getElementById("hdn_dashboard_refid").value;
        loadDashboardForEdit(refid);
    }
});


/*-- Dashboard Main --*/
var DASH_CANVAS = d3.select("#dash_canvas");
var DASH_TOOLBAR = d3.select("#dash_toolbar");
var TIE_CONFIG_UI = d3.select("#tie_config_ui"); 
var DASH_CONTAINER = DASH_CANVAS.select("#dash_container");
DASH_CONTAINER.on("click",function(){return onClickDashCanvasSE(event)});

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity","1");

var TIE_ITEM={};

function loadDashboardForEdit(refid){
    console.log("loadDashboardForEdit");
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
                TIE_ITEM.content = {
                    presentation:"",
                    configuration:[],
                    datasets:[]
                }
            }

            //let ui_config_element = TIE_CONFIG_UI.select(".ui_config_element");  
            DASH_CONTAINER.html(TIE_ITEM.content.presentation);
            initUIConfigGeneral();
            initUIConfigSection();
    }).catch(function(error){
        //TODO
    });
}

//SAVE DASHBOARD
d3.select("#btn_dash_save").on("click",function(){
    console.log("ON DASHBOARD SAVE CLICK");

    let presentation_html = DASH_CONTAINER.html();
    let presentation_doc = new DOMParser().parseFromString(presentation_html, "text/html");
    d3.select(presentation_doc).selectAll(".ti_elem[ti_elemtyp='DATABOUND']").html("");
    console.log(presentation_doc);
    TIE_ITEM.content.presentation = d3.select(presentation_doc).select('body').html();
    d3.json("/dashboard/save", {
            method: 'POST',
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify(TIE_ITEM)
        }).then(function(data){
            alert("DASHBOARD IS SAVED SUCCESFULLY")
    }).catch(function(error){
        //TODO
    });
});

//EXIT DASHBOARD EDITOR
d3.select("#btn_dash_close").on("click",function(){
    let url = document.location.origin + "/dashsearch";
    window.location.href = url;
});


/* //On get dashboard for edit
d3.select("#btn_dash_get").on("click",function(){
    console.log("ON DASHBOARD GET CLICK");
    let params = {};
    params.id = 272
    d3.json("/dashboard/getforedit", {
            method: 'POST',
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify(params)
        }).then(function(data){
            //TODO
            console.log("DASHBOARD GET SUCCESSFULLY")
            console.log(data);
    }).catch(function(error){
        //TODO
    });
});
 */



function initUIConfigGeneral(){
    console.log("initUIConfigGeneral");    
    //container
    let ui_config_general = TIE_CONFIG_UI.select(".ui_config_general");
    
    //controls
    let txt_dashboard_name = ui_config_general.select('#txt_dashboard_name');
    let chk_dashboard_ispublished = ui_config_general.select("#chk_dashboard_ispublished");
    let txt_dashboard_url = ui_config_general.select("#txt_dashboard_url");
    let btn_dash_copyurl = ui_config_general.select("#btn_dash_copyurl");

    txt_dashboard_name.node().value = TIE_ITEM.name;
    chk_dashboard_ispublished.property("checked", TIE_ITEM.is_published);
    
    txt_dashboard_url.attr("disabled","disabled");
    txt_dashboard_url.node().value = document.location.origin + "/dashview?refid=" + TIE_ITEM.refid;

    txt_dashboard_name.on("change",function(){
        TIE_ITEM.name = this.value;
    });

    chk_dashboard_ispublished.on("click",function(){
        TIE_ITEM.is_published = this.checked;
    });

    btn_dash_copyurl.on("click",function(){
        
        var copyText = document.getElementById("txt_dashboard_url");

        copyText.removeAttribute("disabled");
        /* Select the text field */
        copyText.select();
        copyText.setSelectionRange(0, 99999); /*For mobile devices*/

        /* Copy the text inside the text field */
        document.execCommand("copy");

        copyText.setAttribute("disabled","disabled");

    });
}


function initUIConfigSection(){
    console.log("initUIConfigSection");
    //container
    let ui_config_section = TIE_CONFIG_UI.select(".ui_config_section");
    let ui_config_element = TIE_CONFIG_UI.select(".ui_config_element");

    //controls
    let ddl_select_section = ui_config_section.select("#ddl_select_section");
    let txt_section_name = ui_config_section.select("#txt_section_name");

    let ddl_select_element = ui_config_element.select("#ddl_select_element");
    let txt_element_name = ui_config_element.select("#txt_element_name");
    let lbl_element_type = ui_config_element.select("#lbl_element_type");

    let tie_sections = TIE_ITEM.content.configuration;

    let refreshElementsConfig = function(sectionId){

        let ti_section = TIE_ITEM.content.configuration.filter(s => s.ti_secid == sectionId)[0];
        console.log("refreshElementsConfig");
        let tie_elements = ti_section.ti_elems;

        ddl_select_element.selectAll("option").remove();

        if(tie_elements.length > 0){

            let ti_elem = tie_elements[0];
            tie_elements.forEach(function(ti_elem){
                //populate ddl_select_element
                ddl_select_element.append("option")
                    .attr("value",ti_elem.ti_elemid)
                    .text(`${ti_elem.ti_elemid} : ${ti_elem.ti_elemnm}`);
            });

            ddl_select_element.on("change",function(){

                let div_config_elements = d3.select("#div_config_elements");   
                div_config_elements.html(""); 
    
                let ti_section = TIE_ITEM.content.configuration.filter(s => s.ti_secid == sectionId)[0];
                let elem = ti_section.ti_elems.filter(e => e.ti_elemid == this.value)[0];
                
                txt_element_name.node().value = elem.ti_elemnm; 
                let strElemType = elem.ti_elemtyp;
         
                if(elem.ti_elemtyp_2 != undefined && elem.ti_elemtyp_2 != ""){
                    strElemType = strElemType + " - " + elem.ti_elemtyp_2;
                }    
    
                lbl_element_type.text(strElemType);    
               
                if(elem.ti_elemtyp.toUpperCase() == "TEXT"){ 
                    div_config_elements.append("label").text("Value");
                    div_config_elements.append("input")
                        .attr("type","text")
                        .attr("ti_for",elem.ti_elemid)
                        .classed("form-control",true)
                        .property("value",elem.ti_elemval)
                        .on("change",function(d,i){
                            let strValue = d3.select(this).node().value;
                            elem.ti_elemval = strValue;
                            DASH_CONTAINER.select(`#${elem.ti_elemid}`).text(strValue);
                        });
                }
        
                //initialize element configuration : TYPE = IMAGE
                if(elem.ti_elemtyp.toUpperCase() == "IMAGE"){ 
                    showImageElementConfig(div_config_elements,elem);
                }

                //initialize element configuration : TYPE=DATABOUND
                else if (elem.ti_elemtyp.toUpperCase() == "DATABOUND"){
                    
                    div_config_elements.append("label").text(elem.ti_elemnm);
                    div_config_elements.append("br");
                    div_config_elements.append("label").text("Dataset Name")
                    div_config_elements.append("br");
        
                    div_config_elements.append("label")
                        .attr("ti_for",elem.ti_elemid)
                        .text(elem.ti_elemval.ti_ev_dsnm)
        
                    div_config_elements.append("button")
                        .attr("type","button")
                        .attr("data-toggle","modal")
                        .attr("data-target","#dlg_common")
                        .classed("btn btn-sm btn-block btn-primary",true)                    
                        .property("value","Select Dataset")
                        .text("Select Dataset")
                        .on("click",function(){
                            loadDlgDataset(div_config_elements,elem);
                        });
                    
                    if(elem.ti_elemval.ti_ev_dsid != ""){
                        if(elem.ti_elemtyp_2.toUpperCase() == "DATATABLE"){
                            showDataTableColumnConfig(div_config_elements, elem);
                        }else if(elem.ti_elemtyp_2.toUpperCase().startsWith("BARCHART")){
                            showChartConfig(div_config_elements, elem);
                        }
                    }
        
                }
    
            });            


            ddl_select_element.node().value = ti_elem.ti_elemid;
            ddl_select_element.dispatch("change");        
        }

        txt_element_name.on("change",function(){
            let selectedElemId = ddl_select_element.node().value;
            let ti_section = TIE_ITEM.content.configuration.filter(s => s.ti_secid == sectionId)[0];
            let ti_elem = ti_section.ti_elems.filter(e => e.ti_elemid == selectedElemId)[0];
            ti_elem.ti_elemnm = this.value;
            ddl_select_element.select(`option[value=${selectedElemId}]`).text(`${selectedElemId} : ${this.value}`);
        });

     
    };

    ddl_select_section.selectAll("option").remove();

    let selectedSecId = '';
    
    tie_sections.forEach(function(ti_section){
        //populate ddl_select_section
        ddl_select_section.append("option")
            .attr("value",ti_section.ti_secid)
            .text(`${ti_section.ti_secid} : ${ti_section.ti_secnm}`); 
        selectedSecId = ti_section.ti_secid
    });

    if(selectedSecId != ''){
        ddl_select_section.node().value = selectedSecId;
        let ti_section = TIE_ITEM.content.configuration.filter(s => s.ti_secid == selectedSecId)[0];
        txt_section_name.node().value = ti_section.ti_secnm; 
        refreshElementsConfig(selectedSecId);
    }

    txt_section_name.on("change",function(){
        selectedSecId = ddl_select_section.node().value;
        let ti_section = TIE_ITEM.content.configuration.filter(s => s.ti_secid == selectedSecId)[0];
        ti_section.ti_secnm = this.value;
        ddl_select_section.select(`option[value=${selectedSecId}]`).text(`${selectedSecId} : ${this.value}`);
    })

    ddl_select_section.on("change",function(){
        console.log("ddl_select_section on change");
        let sectionId = this.value;
        let div_config_elements = d3.select("#div_config_elements");   
        let arrTieContentConfig = TIE_ITEM.content.configuration;
        div_config_elements.html(""); 
    
        if( sectionId=="") return;  
    
        let selectedSection = arrTieContentConfig.filter(d => d.ti_secid == sectionId)[0];   
        
        txt_section_name.node().value = selectedSection.ti_secnm;
       
        //refreshElements
        refreshElementsConfig(selectedSection.ti_secid);
        /*
        selectedSection.ti_elems.forEach(function(elem){  

            //initialize element configuration : TYPE=TEXT          
            if(elem.ti_elemtyp.toUpperCase() == "TEXT"){ 
                div_config_elements.append("label").text(elem.ti_elemnm);
                div_config_elements.append("input")
                    .attr("type","text")
                    .attr("ti_for",elem.ti_elemid)
                    .classed("form-control",true)
                    .property("value",elem.ti_elemval)
                    .on("change",function(d,i){
                        let strValue = d3.select(this).node().value;
                        elem.ti_elemval = strValue;
                        DASH_CONTAINER.select(`#${elem.ti_elemid}`).text(strValue);
                    });
            }
    
            //initialize element configuration : TYPE = IMAGE
            if(elem.ti_elemtyp.toUpperCase() == "IMAGE"){ 
                showImageElementConfig(div_config_elements,elem);
            }
            //initialize element configuration : TYPE=DATABOUND
            else if (elem.ti_elemtyp.toUpperCase() == "DATABOUND"){
                
                div_config_elements.append("label").text(elem.ti_elemnm);
                div_config_elements.append("br");
                div_config_elements.append("label").text("Dataset Name")
                div_config_elements.append("br");
    
                div_config_elements.append("label")
                    .attr("ti_for",elem.ti_elemid)
                    .text(elem.ti_elemval.ti_ev_dsnm)
    
                div_config_elements.append("button")
                    .attr("type","button")
                    .attr("data-toggle","modal")
                    .attr("data-target","#dlg_common")
                    .classed("btn btn-sm btn-block btn-primary",true)                    
                    .property("value","Select Dataset")
                    .text("Select Dataset")
                    .on("click",function(){
                        loadDlgDataset(div_config_elements,elem);
                    });
                
                if(elem.ti_elemval.ti_ev_dsid != ""){
                    if(elem.ti_elemtyp_2.toUpperCase() == "DATATABLE"){
                        showDataTableColumnConfig(div_config_elements, elem);
                    }else if(elem.ti_elemtyp_2.toUpperCase() == "BARCHART"){
                        showChartConfig(div_config_elements, elem);
                    }
                }
    
            }
        });*/ 
    });

}






/*-- Dashboard Toolbar Events --*/
DASH_TOOLBAR.selectAll("#ctrl_row_1, #ctrl_sec_1, #ctrl_sec_2, #ctrl_sec_1, #ctrl_header_sec_1 \
    , #ctrl_datatable_elem, #ctrl_barchart_ver_elem, #ctrl_barchart_hor_elem, #ctrl_image_elem,#ctrl_formapp")
    .on("dblclick",function(){


    let source_id =  d3.select(this).attr("id");
    
    //select template 
    let tmpl = d3.select("#tmpl_" + source_id);
    
    //get selected element from dashboard canvas
    //let dc_selected = d3.select("#dash_canvas .se_selected");
    let dc_selected = DASH_CANVAS.select(".se_selected");
    
    //append template elements
    dc_selected.html(dc_selected.html() + tmpl.html());
    
    //select all new controls
    let new_ctrls = dc_selected.selectAll(".new_ctrl");
    
    new_ctrls.each(function(){
        new_ctrl = d3.select(this);
        //get prefix
        let prefix = new_ctrl.attr("ti_tag");

        let cid = generateDashCId(prefix);

        //assign element id
        new_ctrl.attr("id",cid);
            
        switch(prefix){
            case "row":
                new_ctrl.attr("ti_rowid", cid)
                    .attr("ti_rownm", "Row " + cid.split("_")[1]);
                break;
            case "section":
            case "header":
                new_ctrl.attr("ti_secid", cid)
                    //.attr("ti_secnm", (new_ctrl.attr("ti_secnm")=== ""?"Section":new_ctrl.attr("ti_secnm")) + " " + cid.split("_")[1]);
                    .attr("ti_secnm", "Untitled Section");
                console.log("ADD HEADER");
                console.log(TIE_ITEM);
                
                //add to section configuration list
                addSectionConfigToTieItem(TIE_ITEM, new_ctrl);
                
                break;
            case "elem":
                new_ctrl.attr("ti_elemid", cid)
                    .attr("ti_elemnm", new_ctrl.attr("ti_elemnm")=== ""?"Element " + cid.split("_")[1] : new_ctrl.attr("ti_elemnm"));
         
                let parentSection = d3.select(new_ctrl.node().parentNode);
           
                let ti_section = getSectionFromTieItem(TIE_ITEM,`${parentSection.attr("id")}` );
            
                addSectionElementsConfig(ti_section,new_ctrl);

                break;
        }        

        /* Arnold: Comment this for now
        new_ctrl.on("click",function(){ 

            tooltip.style("display", "none");

            onClickDashCanvasSE(event);
            let tmpl_tooltip_content = d3.select("#tmpl_tooltip_ctrl_config");

            tooltip.style("display", "block");
            tooltip.html(tmpl_tooltip_content.html())
              .style("left", d3.event.pageX + "px")
              .style("top", d3.event.pageY + "px");
            
            let ctrl_height = tooltip.select(".ctrl_height").property("value",new_ctrl.node().offsetHeight);
            
            //on increase height
            tooltip.select(".incr_height").on("click",function(){
                let new_height = new_ctrl.node().offsetHeight + 5;
                new_ctrl.style("height",new_height + "px");
                ctrl_height.property("value",new_height);
            });

            //on decrease height
            tooltip.select(".decr_height").on("click",function(){
                let new_height = new_ctrl.node().offsetHeight - 5;
                new_ctrl.style("height",new_height + "px");
                ctrl_height.property("value",new_height);
            });

            //on close tool tip
            tooltip.select(".close_tooltip").on("click", function(){
                tooltip.style("display","none");
            });
        });
        */

        new_ctrls.classed("new_ctrl",false);
    });

});

//On select dashboard canvas element
function onClickDashCanvasSE(ev){
    let id = ev.target.id;       
    DASH_CANVAS.selectAll(".se_selected").classed("se_selected", false);
    d3.select(`#${id}`).classed("se_selected",true);
}

//Generate dashboard control id
function generateDashCId(prefix){   
    let newId = "";
    for(i=0; i<1000; i++){        
        newId = prefix + "_" + i;        
        let d = DASH_CANVAS.selectAll(`#${newId}`);        
        if(d.size() == 0 ){           
            break;
        }else{
            continue;
        }
    }   
    return newId;
}

//Add section to tie item content configuration
function addSectionConfigToTieItem(tieItem, section){
 
   console.log("addSectionConfigToTieItem");
   let arrTieContentConfig = tieItem.content.configuration;

   let ti_section = {
        ti_secid :  section.attr("ti_secid"), //section id               
        ti_secnm : section.attr("ti_secnm"),  //section name
        ti_elems:[]                         //section elements
   }

   //add to Tie Item Content Config array
   arrTieContentConfig.push(ti_section);

    //add to UI of Dashboard Configuration - section dropdown list  
   /*
   let ddl_select_section = d3.select("#ddl_select_section");    //sections dropdown
  
   ddl_select_section.append("option")
    .attr("value",ti_section.ti_secid)
    .text(ti_section.ti_secnm);
   */
   initUIConfigSection();   
}

/*
d3.select("#ddl_select_section").on("change",function(){
    onDdlSelectSection_Change(TIE_ITEM,this);
});    
*/

//Add section elements config
function addSectionElementsConfig(ti_section,elements){
    
    console.log("addSectionElementsConfig");
    console.log(elements);
    elements.each(function(d,i){ 
        let element = d3.select(this);       
        let ti_elem = {
            ti_elemid: element.attr("ti_elemid"),   //element id                    
            ti_elemnm: element.attr("ti_elemnm"),   //element name
            ti_elemtyp: element.attr("ti_elemtyp"),  //element type
            ti_elemtyp_2: element.attr("ti_elemtyp_2") //element sub type (i.e. datatable, chart, datalist)
        }

        let elemtype = element.attr("ti_elemtyp");
     
        if (elemtype.toUpperCase() == "TEXT"){
            ti_elem.ti_elemval = "";
        }else if(elemtype.toUpperCase() == "IMAGE"){
            ti_elem.ti_elemval = {
                img_src:"",
                img_alt:""
            };        
        }else if (elemtype.toUpperCase() == "DATABOUND"){                            
            ti_elem.ti_elemval = {
                ti_ev_dsid: "",               //datasetid
                ti_ev_dsnm: "Not Specified",  //datasetname
                //ti_ev_dsot: "",             //dataset object type (i.e. datatable, chart, datalist)
                ti_ev_dscl: [] ,              //data set columns
                ti_ev_ext_prop: {             //extended properties    
                    selected_cols: [],        //applicable for datatable
                    chart_cols:[] ,           //applicable for chart columns
                    chart_rows:[] ,           //applicable for chart rows
                    chart_filters:[],           //aplicable for chart filters
                    chart_orderby:[]
                }
            };
        }        
        ti_section.ti_elems.push(ti_elem); //push section elements
    });

    initUIConfigSection();   
}


//Get section from tie item
function getSectionFromTieItem(tieItem,sectionId){
    let arrTieContentConfig = tieItem.content.configuration;
    let selectedSection = arrTieContentConfig.filter(d => d.ti_secid == sectionId)[0]; 
    return selectedSection;
}

/*
function onDdlSelectSection_Change(tieItem,sectionId){    
     
    console.log("onDdlSelectSection_Change");
    console.log(`sectionid = ${sectionId}`)

    let div_config_elements = d3.select("#div_config_elements");   
    let arrTieContentConfig = tieItem.content.configuration;

    div_config_elements.html(""); 

    if( d3.select(sectionId).node().value=="") return;  

    let selectedSection = arrTieContentConfig.filter(d => d.ti_secid == d3.select(sectionId).node().value)[0];                    
            
    console.log("selected ddl section");
    console.log(selectedSection);
    selectedSection.ti_elems.forEach(function(elem){  
        
        //initialize element configuration : TYPE=TEXT          
        if(elem.ti_elemtyp.toUpperCase() == "TEXT"){ 
            div_config_elements.append("label").text(elem.ti_elemnm);
            div_config_elements.append("input")
                .attr("type","text")
                .attr("ti_for",elem.ti_elemid)
                .classed("form-control",true)
                .property("value",elem.ti_elemval)
                .on("change",function(d,i){
                    let strValue = d3.select(this).node().value;
                    elem.ti_elemval = strValue;
                    DASH_CONTAINER.select(`#${elem.ti_elemid}`).text(strValue);
                });
        }

        //initialize element configuration : TYPE = IMAGE
        if(elem.ti_elemtyp.toUpperCase() == "IMAGE"){ 
            showImageElementConfig(div_config_elements,elem);
        }
        //initialize element configuration : TYPE=DATABOUND
        else if (elem.ti_elemtyp.toUpperCase() == "DATABOUND"){
            
            //div_config_elements.append("label").text(elem.ti_elemnm);
            //div_config_elements.append("br");
            div_config_elements.append("label").text("Dataset")
            div_config_elements.append("br");

            div_config_elements.append("label")
                .attr("ti_for",elem.ti_elemid)
                .text(elem.ti_elemval.ti_ev_dsnm)

            div_config_elements.append("button")
                .attr("type","button")
                .attr("data-toggle","modal")
                .attr("data-target","#dlg_common")
                .classed("btn btn-sm btn-block btn-primary",true)                    
                .property("value","Select Dataset")
                .text("Select Dataset")
                .on("click",function(){
                    loadDlgDataset(div_config_elements,elem);
                });
            
            if(elem.ti_elemval.ti_ev_dsid != ""){
                if(elem.ti_elemtyp_2.toUpperCase() == "DATATABLE"){
                    showDataTableColumnConfig(div_config_elements, elem);
                }else if(elem.ti_elemtyp_2.toUpperCase() == "BARCHART"){
                    showChartConfig(div_config_elements, elem);
                }
            }

        }
    });   
   
}

*/



  //--- Create Table
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

//Create Dataset Column Configuration table
function createConfigTableDCols(dbc_secelems, elem){

    let dscl = elem.ti_elemval.ti_ev_dscl;
    let dt_div = dbc_secelems.append("div")
    .style("max-height","300px")
    .style("overflow","auto");

    let table = dt_div.append("table")
    .classed("table",true)
    .classed("table-striped",true);
    
    //let table =  tableElem;
    let thead = table.append('thead')
    let tbody = table.append('tbody');
    let columns = d3.keys(dscl[0]);

    //append header row               
    thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter()
        .append('th')
        .text(d => d);

    // create a row for each object in the data
    var rows = tbody.selectAll('tr')
        .data(dscl)
        .enter()
        .append('tr')
        .attr("for_dscl_id",d => d.dscl_id);    

    // create a cell in each row for each column
    var cells = rows.selectAll('td')
        .data(function (row) {
                return columns.map(function (column) {
                    return { column: column, value: row[column] };
                });
             })
        .enter()
        .append('td')
        .html(function(d,i){
            if(i == 2){                     
                 if(d.value == true){
                    return `<input type="checkbox"  class="chk_dscl_is" checked>`
                 } else{
                    return `<input type="checkbox"  class="chk_dscl_is" >`
                 } 
            }else if(i == 3){
                return `<input type="text"  class="form-control txt_dscl_an"  >`
            }else{
                return d.value;
            }                
        });
        //.text(function (d) { return d.value; });         
    table.selectAll(".chk_dscl_is").on("change",function(){                           
        let tr = d3.select(this.parentNode.parentNode); 
        let chk = d3.select(this);
        let for_dscl_id = tr.attr("for_dscl_id");
        let iDscl = dscl.filter(d => d.dscl_id == for_dscl_id)[0];
        iDscl.dscl_is = chk.property("checked");
    });

    let btn_apply = dbc_secelems.append("input")
        .attr("type","button")
        .classed("btn btn-sm btn-block btn-primary",true)
        .property("value","Apply Dataset");

    btn_apply.on("click",function(){
        let ti_elem = d3.select(".ti_tmpl").select(`div[ti_elemid=${elem.ti_elemid}]`);
        //console.log(elem);
        let tableElem = ti_elem.append("table")
            .classed("table table-striped",true);

        d3.csv("./data/MemberListSummary.csv").then(function(data){     
            dsdata = data;
            createTable(tableElem,dsdata);
        });
    });

}

function showImageElementConfig(div_config_elements,ti_elem){

    let ti_image = ti_elem.ti_elemval;
    let tmpl_image_config = d3.select("#tmpl_image_config");

    let image_config = div_config_elements.append("div").attr("id","image_config").html(tmpl_image_config.html());

   // let txt_elem_name = image_config.select("#txt_elem_name");
    let txt_image_source = image_config.select("#txt_image_source");
    let txt_image_alt = image_config.select("#txt_image_alt");
    let btn_image_apply = image_config.select("#btn_image_apply");
    
  //txt_elem_name.text(ti_elem.ti_elemnm);
    txt_image_source.node().value =  ti_image.img_src;
    txt_image_alt.node().value = ti_image.img_alt;
/*
    txt_elem_name.on("change", function(){
        ti_image.img_src = d3.select(this).node().value;        
    });
*/
    txt_image_source.on("change",function(){
        ti_image.img_src = d3.select(this).node().value;        
    });

    txt_image_alt.on("change",function(){
        ti_image.img_alt = d3.select(this).node().value;
    });

    btn_image_apply.on("click", function(){
        dash_elem = DASH_CONTAINER.select(`#${ti_elem.ti_elemid}`);
        dash_elem.attr("src", ti_image.img_src );
        dash_elem.attr("alt", ti_image.img_alt);
    });

} 

function showDataTableColumnConfig(div_config_elements,ti_elem){
    console.log("showDataTableColumnConfig");

    let ti_available_cols = ti_elem.ti_elemval.ti_ev_dscl.filter(d => d.dscl_is == false); 
    let ti_selected_cols = ti_elem.ti_elemval.ti_ev_dscl.filter(d => d.dscl_is == true);


    let tmpl_datatable_col_config = d3.select("#tmpl_datatable_col_config");

    let datatable_col_config = div_config_elements.append("div").attr("id","datatable_col_config").html(tmpl_datatable_col_config.html());
   
    let ul_available_cols = d3.select("#datatable_col_config .available_columns ul");
    let ul_selected_cols = d3.select("#datatable_col_config .selected_columns ul");

    let btn_datatable_preview = d3.select("#datatable_col_config #btn_datatable_preview");
    
    let li_available_cols = ul_available_cols.selectAll("li")
        .data(ti_available_cols)
        .enter()
        .append("li")
        .attr("dscl_id", d => d.dscl_id)
        .text(d => d.dscl_nm);

    let li_selected_cols = ul_selected_cols.selectAll("li")
        //.data(ti_selected_cols)
        .data(ti_elem.ti_elemval.ti_ev_ext_prop.selected_cols)
        .enter()
        .append("li")
        .attr("dscl_id", column_name => ti_selected_cols.filter(d => d.dscl_nm === column_name)[0].dscl_id)
        .text(column_name => column_name)
        //.text(d => d.dscl_nm);    

    li_available_cols.on("dblclick",function(){
        let selectedDsclId = d3.select(this).attr("dscl_id");

        //update tie_item element
        let selectedTiAvailCols = ti_available_cols.filter(d => d.dscl_id == selectedDsclId )[0];
        selectedTiAvailCols.dscl_is = true;
        ti_elem.ti_elemval.ti_ev_ext_prop.selected_cols.push(selectedTiAvailCols.dscl_nm);

        refreshThis();
    });

    li_selected_cols.on("dblclick",function(){
        let selectedDsclId = d3.select(this).attr("dscl_id");

        //update tie_item element
        let selectedTiAvailCols = ti_selected_cols.filter(d => d.dscl_id == selectedDsclId )[0];
        selectedTiAvailCols.dscl_is = false;

        ti_elem.ti_elemval.ti_ev_ext_prop.selected_cols = ti_elem.ti_elemval.ti_ev_ext_prop.selected_cols.filter( d => d !== selectedTiAvailCols.dscl_nm) ;
        
        refreshThis();
         
    });

    btn_datatable_preview.on("click", function(){
        let dash_elem = DASH_CONTAINER.select(`#${ti_elem.ti_elemid}`);
        
        //console.log(elem);
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

            //show only selected columns
            createTable(tableElem,table_data);
        });
    });

    let refreshThis = function(){
        datatable_col_config.remove();
        showDataTableColumnConfig(div_config_elements,ti_elem);
    }

    //console.log(ti_elem);
    
}


function showChartConfig(div_config_elements,ti_elem){
    console.log("showChartConfig");
    console.log(TIE_ITEM);

    let ti_ev_dscl = ti_elem.ti_elemval.ti_ev_dscl; 
    //let ti_selected_cols = ti_elem.ti_elemval.ti_ev_dscl.filter(d => d.dscl_is == true);

    let tmpl_chart_config = d3.select("#tmpl_chart_config");

    let chart_config = div_config_elements.append("div").attr("id","chart_config").html(tmpl_chart_config.html());
   
    let ul_dataset_cols = d3.select("#chart_config .dataset_columns ul");
    let ul_chart_columns = d3.select("#chart_config .chart_columns ul");
    let ul_chart_rows = d3.select("#chart_config .chart_rows ul");
    let btn_chart_preview = d3.select("#chart_config #btn_chart_preview");

    let arrTiElemTyp2 = ti_elem.ti_elemtyp_2.split(":");
    
    ul_chart_columns.attr("ondrop","drop(event)")
        .attr("ondragover","allowDrop(event)");
    
    ul_chart_rows.attr("ondrop","drop(event)")
        .attr("ondragover","allowDrop(event)");

    
    //populate dataset columns
    let li_dataset_cols = ul_dataset_cols.selectAll("li")
         .data(ti_ev_dscl)
         .enter()
         .append("li")
         .attr("ondragstart","drag(event)")
         .attr("draggable","true")
         .attr("id", d => `dscl_id_${d.dscl_id}`)
         .attr("dscl_id", d => d.dscl_id)
         .html((d,i) => {  
            if(d.dscl_is == true){
                return `<input type="checkbox"  id="chk_dscl_is_${d.dscl_id}" name="${d.dscl_id}" value="${d.dscl_nm}" checked disabled><label for="chk_dscl_is_${d.dscl_id}">${d.dscl_nm}</label>`
            } else{
                return `<input type="checkbox"  id="chk_dscl_is_${d.dscl_id}" name="${d.dscl_id}" value="${d.dscl_nm}" disabled><label for="chk_dscl_is_${d.dscl_id}">${d.dscl_nm}</label>`
            } 
        });


    //populate chart columns
    ti_elem.ti_elemval.ti_ev_ext_prop.chart_cols.forEach(function(colValue){
        let arrValue = colValue.split(":"); 
        let colName = "";
        let colFunc = "";
        if(arrValue.length == 1){
            colName=arrValue[0];
        }else if(arrValue.length == 2){
            colName=arrValue[0];
            colFunc=arrValue[1];
        }             
        let dscl_id=  ul_dataset_cols.select(`li input[value=${colName}]`).attr("name");       
        let cln = ul_dataset_cols.select(`#dscl_id_${dscl_id}`).node().cloneNode(true);
        ul_chart_columns.node().appendChild(cln); 
    });
       
     //populate chart rows
     ti_elem.ti_elemval.ti_ev_ext_prop.chart_rows.forEach(function(rowValue){
        let arrValue = rowValue.split(":"); 
        let rowName = "";
        let rowFunc = "";
        if(arrValue.length == 1){
            rowName=arrValue[0];
        }else if(arrValue.length == 2){
            rowName=arrValue[0];
            rowFunc=arrValue[1];
        }             
        let dscl_id=  ul_dataset_cols.select(`li input[value=${rowName}]`).attr("name");       
        let cln = ul_dataset_cols.select(`#dscl_id_${dscl_id}`).node().cloneNode(true);
        ul_chart_rows.node().appendChild(cln); 
    });
       

    ul_chart_columns.on("DOMNodeInserted",function(){
        switch(arrTiElemTyp2[0].toUpperCase()){
            case "BARCHART":
                if(arrTiElemTyp2[1].toUpperCase() === "VERTICAL"){
                    li_chart_columns =  d3.select(this).selectAll("li");
                    ti_elem.ti_elemval.ti_ev_ext_prop.chart_cols = [];
                    li_chart_columns.each(function(){
                         ti_elem.ti_elemval.ti_ev_ext_prop.chart_cols.push(d3.select(this).select("input[type=checkbox]").attr("value"));
                    });                    
                }
                else if(arrTiElemTyp2[1].toUpperCase() === "HORIZONTAL"){
                    li_chart_columns =  d3.select(this).selectAll("li");
                    ti_elem.ti_elemval.ti_ev_ext_prop.chart_cols = [];
                    li_chart_columns.each(function(){
                         ti_elem.ti_elemval.ti_ev_ext_prop.chart_cols.push(d3.select(this).select("input[type=checkbox]").attr("value") + ":SUM");
                    });                    
                }
                break;
            default:
                break;   
        }
    });  

    ul_chart_rows.on("DOMNodeInserted",function(){
        switch(arrTiElemTyp2[0].toUpperCase()){
            case "BARCHART":
                if(arrTiElemTyp2[1].toUpperCase() === "VERTICAL"){
                    li_chart_rows =  d3.select(this).selectAll("li");
                    ti_elem.ti_elemval.ti_ev_ext_prop.chart_rows = [];
                    li_chart_rows.each(function(){
                         ti_elem.ti_elemval.ti_ev_ext_prop.chart_rows.push(d3.select(this).select("input[type=checkbox]").attr("value") + ":SUM");
                    });
                    console.log(ti_elem);
                }
                else if(arrTiElemTyp2[1].toUpperCase() === "HORIZONTAL"){
                    li_chart_rows =  d3.select(this).selectAll("li");
                    ti_elem.ti_elemval.ti_ev_ext_prop.chart_rows = [];
                    li_chart_rows.each(function(){
                         ti_elem.ti_elemval.ti_ev_ext_prop.chart_rows.push(d3.select(this).select("input[type=checkbox]").attr("value"));
                    });
                    console.log(ti_elem);
                }
                
                break;
            default:
                break;
        };
    });  

    // let li_selected_cols = ul_selected_cols.selectAll("li")
    //     .data(ti_elem.ti_elemval.ti_ev_ext_prop.selected_cols)
    //     .enter()
    //     .append("li")
    //     .attr("dscl_id", column_name => ti_selected_cols.filter(d => d.dscl_nm === column_name)[0].dscl_id)
    //     .text(column_name => column_name)

 /*
    li_available_cols.on("dblclick",function(){
        let selectedDsclId = d3.select(this).attr("dscl_id");

        //update tie_item element
        let selectedTiAvailCols = ti_available_cols.filter(d => d.dscl_id == selectedDsclId )[0];
        selectedTiAvailCols.dscl_is = true;
        ti_elem.ti_elemval.ti_ev_ext_prop.selected_cols.push(selectedTiAvailCols.dscl_nm);

        refreshThis();
    });

    li_selected_cols.on("dblclick",function(){
        let selectedDsclId = d3.select(this).attr("dscl_id");

        //update tie_item element
        let selectedTiAvailCols = ti_selected_cols.filter(d => d.dscl_id == selectedDsclId )[0];
        selectedTiAvailCols.dscl_is = false;

        ti_elem.ti_elemval.ti_ev_ext_prop.selected_cols = ti_elem.ti_elemval.ti_ev_ext_prop.selected_cols.filter( d => d !== selectedTiAvailCols.dscl_nm) ;
        
        refreshThis();
         
    });

   

    let refreshThis = function(){
        datatable_col_config.remove();
        showDataTableColumnConfig(div_config_elements,ti_elem);
    }
    */
   
    btn_chart_preview.on("click", function(){
        switch(arrTiElemTyp2[0].toUpperCase()){
            case "BARCHART":
                if(arrTiElemTyp2[1].toUpperCase() === "VERTICAL"){

                    let tiDataset = getTieItemDatasetByID(ti_elem.ti_elemval.ti_ev_dsid) 
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

                    generateBarChart_Vertical(ti_elem.ti_elemid, chartParams);  
                }
                else if(arrTiElemTyp2[1].toUpperCase() === "HORIZONTAL"){

                    let tiDataset = getTieItemDatasetByID(ti_elem.ti_elemval.ti_ev_dsid) 
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

                    generateBarChart_Horizontal(ti_elem.ti_elemid, chartParams);  
                }
                break;
            default:
                break;
        }
             
    });
}

function allowDrop(ev) {
    ev.preventDefault();
    
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);  
    console.log(ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    let data = ev.dataTransfer.getData("text");
    //console.log(ev.target.id);
    let cln = document.getElementById(data).cloneNode(true);
    ev.target.appendChild(cln);    
}


//Get Dataset Column Objects
function getDSColObjs(columns){
    let colObjs = columns.map(function(column,i){
            return {
                dscl_id    : i + 1 ,//column id
                dscl_nm    : column, //column name
                dscl_is    : false,   //is selected
                dscl_an    : ""     //alternate names
            };
        });

    return colObjs;
} 


/** Dataset Dialog <start> */
function loadDlgDataset(div_config_elements,elem){
    let dlg_common = d3.select("#dlg_common");
    let tmpl_ds = d3.select("#tmpl_dataset");

    dlg_common.select(".modal-title").text("Select Dataset");
    dlg_common.select(".modal-body").html(tmpl_ds.html());
    
    let form_ti_ds = dlg_common.select("#form_ti_ds");
    let tbl_ti_prvw_ds = form_ti_ds.select(".tbl_ti_prvw_ds");
    let dsdata = [];

    let form_select_dataset = form_ti_ds.select("#form_select_dataset");
    let form_crud_dataset = form_ti_ds.select("#form_crud_dataset");
    let form_preview_dataset = form_ti_ds.select("#form_preview_dataset");  

    let ddl_select_dataset = form_ti_ds.select("#ddl_select_dataset");

    let txt_dataset_name = form_ti_ds.select("#txt_dataset_name");
    let txt_dataset_link = form_ti_ds.select("#txt_dataset_link");
    let lbl_dataset_link = form_ti_ds.select("#lbl_dataset_link");
   
    let btn_addnew_dataset = form_ti_ds.select("#btn_addnew_dataset");
    let btn_edit_dataset = form_ti_ds.select("#btn_edit_dataset");
    let btn_save_dataset = form_ti_ds.select("#btn_save_dataset");
    let btn_preview_dataset = form_ti_ds.select("#btn_preview_dataset");
    let btn_assign_dataset = form_ti_ds.select("#btn_assign_dataset");

    let refreshDdlSelectDataset = function() {
        ddl_select_dataset.selectAll("option").remove();
        
        ddl_select_dataset.selectAll('option')
        .data(TIE_ITEM.content.datasets)
        .enter()
        .append('option')
        .attr("value",d => d.dataset_id)    
        .text(d => d.dataset_name);
    };


    let previewDataset = function(source_link){
        d3.csv(source_link).then(function(data){     
            dsdata = data;
            createTable(tbl_ti_prvw_ds,data);
            form_preview_dataset.style("display","block");
        });
    };

    refreshDdlSelectDataset();

    ddl_select_dataset.on("change",function(){
        let selectedDataset = TIE_ITEM.content.datasets.filter(d => d.dataset_id == this.value)[0];
        previewDataset(selectedDataset.dataset_link);
    });

    btn_addnew_dataset.on("click", function(){
        form_select_dataset.style("display","none");
        form_crud_dataset.style("display","block");

        txt_dataset_name.node().value = "";
        txt_dataset_link.node().value = "";

        txt_dataset_link.node().value = ""; //REMOVE after testing
    });

    
    btn_preview_dataset.on("click", function(){
        let source_link = txt_dataset_link.node().value;
        previewDataset(source_link);
    });

    btn_save_dataset.on("click", function(){
        console.log("btn_save_dataset");
        let arrTieDataset = TIE_ITEM.content.datasets;
        let newDatasetId = 1;
        if(arrTieDataset.length > 0){
            newDatasetId = arrTieDataset[arrTieDataset.length-1].dataset_id + 1;
        }
        var newDataset = {
            dataset_id :  newDatasetId,   
            dataset_type: "CSV" ,  //may include different type in the future         
            dataset_name : txt_dataset_name.node().value,
            dataset_link  : txt_dataset_link.node().value
        }
        
        arrTieDataset.push(newDataset);
        console.log(TIE_ITEM);
        refreshDdlSelectDataset();
        form_select_dataset.style("display","block");
        form_crud_dataset.style("display","none");
        ddl_select_dataset.node().value = newDatasetId; 
    });

    btn_assign_dataset.on("click", function(){           
        console.log("btn_assign_dataset");
        let selectedDataset = TIE_ITEM.content.datasets.filter(d => d.dataset_id == ddl_select_dataset.node().value)[0];
        console.log(selectedDataset);
        elem.ti_elemval.ti_ev_dsnm = selectedDataset.dataset_name;  
        elem.ti_elemval.ti_ev_dsid = selectedDataset.dataset_id;            
        div_config_elements.select(`label[ti_for=${elem.ti_elemid}]`).text(elem.ti_elemval.ti_ev_dsnm);
        $("#dlg_common").modal('hide'); //TODO: replace with d3 
    
        d3.csv(selectedDataset.dataset_link).then(function(data){     
            dsdata = data;
            elem.ti_elemval.ti_ev_dscl = getDSColObjs(d3.keys(dsdata[0]));
            arrTiElemTyp2 = elem.ti_elemtyp_2.split(":");
    
            if(arrTiElemTyp2.length > 0){
                if(arrTiElemTyp2[0].toUpperCase() == "DATATABLE"){
                    showDataTableColumnConfig(div_config_elements, elem);
                }else if(arrTiElemTyp2[0].toUpperCase() == "BARCHART"){
                    showChartConfig(div_config_elements, elem);
                }
            }    
        });

    });
}



function getTieItemDatasetByID(datasetID){
    let tiDataset = TIE_ITEM.content.datasets.filter(d => d.dataset_id == datasetID)[0]
    return tiDataset; 
}


/** Dataset Dialog <end> */ 
 

function generateBarChart_Vertical(targetDivId, chartParams)
{
    console.log("generateBarChart" + targetDivId)
    targetDiv = d3.select(`#${targetDivId}`);
    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 30, bottom: 70, left: 60},
    width = targetDiv.node().offsetWidth - margin.left - margin.right,
    height =  targetDiv.node().offsetHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = targetDiv
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

    })

}

function generateBarChart_Horizontal(targetDivId, chartParams)
{
    console.log("generateBarChart" + targetDivId)
    targetDiv = d3.select(`#${targetDivId}`);
    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 30, bottom: 70, left: 60},
    width = targetDiv.node().offsetWidth - margin.left - margin.right,
    height =  targetDiv.node().offsetHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = targetDiv
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
        let arrMinMax = findMinMax(data.map(function(d){return isNaN(d.x_value)?0:d.x_value;}));

        // X axis
        var x = d3.scaleLinear()
            .domain([0, arrMinMax[1]])
            .range([ 0, width]);
          svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
              .attr("transform", "translate(-10,0)rotate(-45)")
              .style("text-anchor", "end");            

        // Add Y axis
        var y = d3.scaleBand()
            .range([ 0, height ])
            .domain(data.map(function(d) { return d.y_value; }))
            .padding(.1);
          svg.append("g")
            .call(d3.axisLeft(y))

        // Bars
        svg.selectAll("myRect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", x(0) )
            .attr("y", function(d) { return y(d.y_value); })
            .attr("width", function(d) { return x(d.x_value); })
            .attr("height", y.bandwidth() )
            .attr("fill", "#69b3a2")

    })

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
/*========================================================================================================*/


/*========================================================================================================*/
/* DASHBOARD SEARCH */
var DASH_MAIN_SEARCH = d3.select(".dash_main_search");
DASH_MAIN_SEARCH.select("#txt_search_key").on("change",function(){    
    let url = document.location.origin + "/dashsearch?searchkey=" + this.value;
    window.location.href = url;
});

DASH_MAIN_SEARCH.select("#btn_dash_addnew").on("click",function(){    
    d3.json("/api/v1/dashboard/addnew").then(function(data) {
        console.log("DASHBOARD ADD NEW - SUCCESS");
        let refid = data.refid;
        let url = document.location.origin + "/dashedit?refid=" + refid;
        window.location.href = url;
    }).catch(function(error){
        console.log(error);
    });
});
/*========================================================================================================*/