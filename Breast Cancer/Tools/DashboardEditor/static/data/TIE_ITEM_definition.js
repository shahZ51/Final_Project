var TIE_ITEM = {
    id:"",
    refid:"",
    type:"",
    name:"",
    content:{
        presentation:"",  //HTML part 
        configuration:[            
            {
                //section
                ti_secid:"",
                ti_secnm:"",
                ti_elems:[
                    {
                        //elements
                        ti_elemid:"",
                        ti_elemnm:"",   //element name
                        ti_elemtyp:"",  //i.e. DataBound, Text
                        ti_elemtyp2:"", //i.e. Barchart or DataTable
                        ti_elemval:{    //if Text then string else(databound) json object
                            ti_ev_dsid: "", //dataset id
                            ti_ev_dsnm: "", //dataset name
                            ti_ev_dscl: [ //dataseet columns
                                {                                    
                                    dscl_id:"",     //column id
                                    dscl_nm:"",     //column name
                                    dscl_is:true,   //if column is selected
                                    dscl_an:""     //alternative name
                                }
                            ],
                            ti_ev_ext_prop: //extended properties
                            {
                                selected_cols:[],  //applicable only for datatable
                                chart_rows:[],     //selected columns for chart rows
                                chart_cols:[],      //selected columns for chart columns
                                chart_filters:[],    //data filters
                                chart_orderby:[]
                            }
                        },
                        ti_elemval:{  //if element is an image
                            img_src:"",
                            img_alt:""
                        }, 
                    }
                ]
            }
        ],
        datasets:[
            {
                dataset_id:"",
                dataset_type:"",
                dataset_name:"",
                dataset_link:""
            }
        ]
    },
    is_published:"",
    version:"",
    is_deleted:"",
    created_date:"",
    created_by:"",
    updated_date:"",
    updated_by:""

}

//Parameters to get chartData
var chartParams = {
    chart_type:"",  //type:subtype (i.e. BarChart:Vertical)
    chart_cols:[],  //columns
    chart_rows:[],  //rows
    chart_filters:[],
    chart_orderby:[],
    chart_dataset:{
        dataset_type:"" ,//csv/json
        dataset_path:""  
    }
}