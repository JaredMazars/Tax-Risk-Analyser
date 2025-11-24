let bd_app_main = {}
main["selected_bd_data"] = [];

$(document).on("click","ul[data-app-name='Business Development'] li[data-link-id='New Client Requests']",function(){
    //reset comments component  
    bd_app_main.toggle_navigation("New");   
});


$(document).on("click","ul[data-app-name='Business Development'] li[data-link-id='Submit a new Client']",function(){

    //reset comments component  
    main["selected_bd_data"] = []
    app_configuration.form_reference_id = null;
    sharepoint_utilities.field_comments_list = [];
    $(".right-help-comment-tabs-container li[data-target-id='3']").click();
    bd_app_main.render_selected_form([]);  
    $("li[data-link-id='Initiation']").click();
    

});

$(document).on("click","#Left-sticky-menu li[title='Business Development']",function(){

    bd_app_main.render_client_dashboard();
});

$(document).on("click", "ul[data-app-name='Business Development'] li", function(){

    let get_section_name = $(this).attr("data-link-id");
    bd_app_main.show_sections(get_section_name)
});


bd_app_main.show_sections = function(section_name){
    //hide all sections
    $(".page-section-form-container").addClass("hide"); 
    //display section based on name
    $("#field_section_container div[form-navigation-target='"+section_name+"']").removeClass("hide");    
}


bd_app_main.render_client_dashboard = function(){

    setTimeout(function(){
        bd_app_main.render_bd_search();
        //this is where we add the the contains clause to lookup user id's
        let client_filter = "substringof(';"+_spPageContextInfo.userId+";',RoleReferenceId) and SystemStatus eq 'Open'";
        bd_app_main.render_bd_client_dashboard(client_filter);
    },500);   
}

bd_app_main.render_selected_form = function(bd_submission_data){

    let canvas =  $(".page-section");   
    canvas.addClass("hide");
    $(".page-loader-header").removeClass("hide");

    //create the sections that hide and show based on the navigation item selected
    let section_names = [
        "Overview",
        "General and Contact Details",
        "Internally Captured Details",
        "Allocation",      
        "Restricted Entity Database",
        "Risk Factors",
        "Needs Analysis and Risk Considerations",
        "Conclusion and Analysis of Results",
        "Independence",
        "Acceptance",
        "Approvals"
    ]

    canvas.html(bd_app_main.create_form_sections(section_names))

    canvas.find("div[form-navigation-target='Overview']").html(sharepoint_utilities.create_container_form(bd_field_set_configuration.overview,"bd-overview-section"));

    //----------------------------Intiation
    canvas.find("div[form-navigation-target='General and Contact Details']").html(
        sharepoint_utilities.create_container_form(bd_intiation_field_set_configuration.initiation_fields_general,"bd-intitation-general-section")
    );
    canvas.find("div[form-navigation-target='Internally Captured Details']").html(
        sharepoint_utilities.create_container_form(bd_intiation_field_set_configuration.initiation_fields_internally_captured,"bd-intitation-internally-captured-section")
    );

    //-----------------------------allocation
    canvas.find("div[form-navigation-target='Allocation']").html(
        sharepoint_utilities.create_container_form(bd_intiation_field_set_configuration.allocation_fields,"bd-allocation-section")
    );

    //------------------------------evaluation
    canvas.find("div[form-navigation-target='Restricted Entity Database']").html(
        sharepoint_utilities.create_container_form(evaluation_field_set_configuration.evaluation_fields_restricted_entity,"bd-evaluation-restricted-section")
    );
    canvas.find("div[form-navigation-target='Risk Factors']").html(
        sharepoint_utilities.create_container_form(evaluation_field_set_configuration.evaluation_fields_risk_factors,"bd-evaluation-risk-factors-section")
    );
    canvas.find("div[form-navigation-target='Needs Analysis and Risk Considerations']").html(
        sharepoint_utilities.create_container_form(evaluation_field_set_configuration.evaluation_fields_needs_analysis,"bd-evaluation-needs-analysis-section")
    );
    canvas.find("div[form-navigation-target='Conclusion and Analysis of Results']").html(
        sharepoint_utilities.create_container_form(evaluation_field_set_configuration.evaluation_fields_conclusion,"bd-evaluation-conclusion-section")
    );

    //-----------------------------independance

    canvas.find("div[form-navigation-target='Independence']").html(
        sharepoint_utilities.create_container_form(bd_independence_field_set_configuration.independence_fields_independence,"bd-independence-section")
    );
    canvas.find("div[form-navigation-target='Acceptance']").html(
        sharepoint_utilities.create_container_form(bd_independence_field_set_configuration.independence_fields_acceptance,"bd-independence-acceptance-section")
    );

    //---------------------------Approvals
    canvas.find("div[form-navigation-target='Approvals']").html(
        sharepoint_utilities.create_container_form(bd_approval_field_set.approvals,"bd-approvals-section")
    );
    

    let general_all_fields = sharepoint_utilities.consolidate_fields(bd_field_set_configuration);
    let evaluation_all_fields = sharepoint_utilities.consolidate_fields(evaluation_field_set_configuration);
    let independence_all_fields = sharepoint_utilities.consolidate_fields(bd_independence_field_set_configuration); 
    //apply any plugins    
    let intiation_all_fields = sharepoint_utilities.consolidate_fields(bd_intiation_field_set_configuration);

    sharepoint_utilities.apply_form_plugins(general_all_fields);  
    sharepoint_utilities.apply_form_plugins(intiation_all_fields); 
    sharepoint_utilities.apply_form_plugins(evaluation_all_fields); 
    sharepoint_utilities.apply_form_plugins(independence_all_fields); 
    
    if(bd_submission_data){
        if(bd_submission_data.length > 0){             


            let reference_id = "<div class='reference-id client-reference-id'>BD-"+bd_submission_data[0].Id + "</div>";
            //set the proposal number
            sharepoint_utilities.set_field_value("ProposalNumber","BD-" + bd_submission_data[0].Id); 
            //set the reference
            $(".header-right-container-container").html(reference_id);

            //add commenting
            comments_controller.get_all_comments(bd_submission_data[0].Id,app_configuration.bd_comments_list_name)
         

            setTimeout(function(){
                //display the data    
                //use that cube to display the relavant fields
                sharepoint_utilities.display_saved_list_fields(
                    bd_submission_data,
                    intiation_all_fields,
                    null                
                );     

                bd_supporting_documents.display_all_documents(bd_submission_data[0].Id);

                //display | calculate primary Assigned engagement partner

                //query each of the separate lists and display the associated data
                let get_evaluation_data = sharepoint_utilities.get_list_items_by_title
                (
                    app_configuration.site_context, 
                    sharepoint_utilities.generate_query_for_expanded_fields(evaluation_all_fields),
                    "ReferenceId eq '"+bd_submission_data[0].Id +"'",
                    app_configuration.bd_evaluation,
                    "Id desc"
                );       
                
                let get_independence_data = sharepoint_utilities.get_list_items_by_title
                (
                    app_configuration.site_context, 
                    sharepoint_utilities.generate_query_for_expanded_fields(independence_all_fields),
                    "ReferenceId eq '"+bd_submission_data[0].Id +"'",
                    app_configuration.bd_independence,
                    "Id desc"
                );  

                $.when(get_evaluation_data,get_independence_data)
                    .done(function(evaluation_data, get_independence_data){

                        //display the evaluation data
                        if(evaluation_data.length > 0){
                            sharepoint_utilities.display_saved_list_fields(
                                evaluation_data,
                                evaluation_all_fields,
                                null                
                            ); 

                            app_configuration["evaluation_ref_id"] = evaluation_data[0].Id
                        }

                        if(get_independence_data.length > 0){
                            //display the independence data
                            sharepoint_utilities.display_saved_list_fields(
                                get_independence_data,
                                independence_all_fields,
                                null                
                            );  
                            
                            app_configuration["independence_ref_id"] = get_independence_data[0].Id
                        }
                    });            
                

                //render each of the other form fields from the various lists
                $("li[data-link-id='New Client Requests']").removeClass("currently-open");
                $("li[data-link-id='General and Contact Details']").addClass("currently-open");                    

            },1500);       
        }   
        
        
    }else{
        //if no data defalt the array to a blank array
        main["selected_bd_data"] = []
        
    }

    setTimeout(function(){       
        //run the bd form load rules
        bd_app_main.form_status_rules();
        canvas.removeClass("hide");
        $(".page-loader-header").addClass("hide");
        //show the first section
        canvas.find("div[form-navigation-target='General and Contact Details']").removeClass("hide");   
        $("ul[data-app-name='Business Development']").removeClass("disable-interaction");       

    },2500);
}

bd_app_main.create_form_sections = function(array_of_sections){

    let section_html = "<div id='field_section_container'>";
    for (let index = 0; index < array_of_sections.length; index++) {
        const section = array_of_sections[index];

        section_html +=
        `
            <div form-navigation-target='${section}' class='page-section-form-container hide'></div>
        `        
    }
    section_html += "</div>"
    return section_html
}


bd_app_main.render_bd_search = function(){

    let bd_lookup_component = 
    {    
        "bd_lookup_fields": 
        [
            {
                "Title":"Search for your Business Development requests via the Client Name",
                "Description":"This will also searched cancelled | stopped and other non in progress submissions",
                "sp_field_name":"temp-bd-request-search",          
                "sp_field_type":"select",
                "field_width":"half-width",
                "field_validate":false,
                "sp_additional_properties":"single-select-typeahead exclude-from-meta",
                "additional_filters":" and substringof(';"+_spPageContextInfo.userId+";',RoleReferenceId)",
                "drop_down_title_field":"ClientName",
                "drop_down_value_field":"ClientName",
                "drop_down_order_by":"ClientName asc",
                "list_name":app_configuration.bd_initiation,
                "site_context":app_configuration.site_context,
                "field_icon":"ContactList" 
            },          
            {
                "Title":"Business development table history",
                "Description":"business development table history",
                "sp_field_name":"temp-bd-table-history",          
                "sp_field_type":"placeholder",
                "field_width":"full-width",
                "field_validate":false,
                "sp_additional_properties":"placehoslder exclude-from-meta hide-details"                
            }
        ]
    }

    $("#additional-component-placeholders").html(sharepoint_utilities.create_container_form(
        bd_lookup_component.bd_lookup_fields,
        "bd-drop-down-container form-basic")
    );    

    sharepoint_utilities.apply_form_plugins(bd_lookup_component.bd_lookup_fields);   
}

bd_app_main.form_status_rules = function(){
   
    if(main["selected_bd_data"].length > 0){

        let form_status = main["selected_bd_data"][0].SubmissionStatus 
        bd_app_main.toggle_navigation(form_status);       

        //always disable this section
        bd_app_main.disable_fields_section("General and Contact Details");

        if(form_status.indexOf("Declined") >= 0 || form_status.indexOf("Approved") >= 0 ){

            //place all the fields as read only
            $("input").prop("disabled",true);
            $("select").prop("disabled",true);
            $("textarea").prop("disabled",true);
            $(".radio-button-group-container").addClass("radio-disabled");
            $("input[title='Back']").addClass("hide");
            $("input[title='Next']").addClass("hide");
            $("input[type='button']").addClass("hide");
        }

    }else{
        //disabled all links
        bd_app_main.toggle_navigation("General Details")    
        

        //open up the new item
        $("ul[data-app-name='Business Development'] li[data-link-id='Initiation']").click();
    }

    if(app_configuration.form_reference_id){
        //show the comments boxes if a form reference exists
        $(".field-component-comment-icon-container").removeClass("hide");
    }else{
        //hide the comments boxes
        $(".field-component-comment-icon-container").addClass("hide");
    }
}

bd_app_main.toggle_navigation = function(section_name){

    $("ul[data-app-name='Business Development'] > ul > li").addClass("nav-item-disabled");
    $("ul[data-app-name='Business Development'] li[data-link-id='Approvals']").removeClass("nav-item-disabled");
     
    let field_set_action_buttons_to_hide = [];
    let field_set_action_buttons_to_show = [];

    switch(section_name){    
        
        case "New":

            $("ul[data-app-name='Business Development'] li[data-link-id='Submit a new Client']").removeClass("nav-item-disabled");  
           
        break;

        case "Restarted":
           
            $("ul[data-app-name='Business Development'] li[data-link-id='Initiation']").removeClass("nav-item-disabled"); 
            $("ul[data-app-name='Business Development'] li[data-link-id='General and Contact Details']").removeClass("nav-item-disabled");   
            $("ul[data-app-name='Business Development'] li[data-link-id='Internally Captured Details']").addClass("nav-item-disabled");     

        break;

        case "General Details":
           
            $("ul[data-app-name='Business Development'] li[data-link-id='Initiation']").removeClass("nav-item-disabled"); 
            $("ul[data-app-name='Business Development'] li[data-link-id='General and Contact Details']").removeClass("nav-item-disabled");   
            $("ul[data-app-name='Business Development'] li[data-link-id='Internally Captured Details']").addClass("nav-item-disabled"); 

        break;

        case "Internally Captured Details":

            $("ul[data-app-name='Business Development'] li[data-link-id='Initiation']").removeClass("nav-item-disabled"); 
            $("ul[data-app-name='Business Development'] li[data-link-id='General and Contact Details']").removeClass("nav-item-disabled");
            $("ul[data-app-name='Business Development'] li[data-link-id='Internally Captured Details']").removeClass("nav-item-disabled");
            field_set_action_buttons_to_hide = ["sp-button-next-to-internally-captured"];  

        break;

        case "Allocation":  
           
            $("ul[data-app-name='Business Development'] li[data-link-id='Initiation']").removeClass("nav-item-disabled"); 
            $("ul[data-app-name='Business Development'] li[data-link-id='Allocation']").removeClass("nav-item-disabled");            

            field_set_action_buttons_to_hide = ["sp-button-approve-and-start-allocation","sp-button-next-to-internally-captured"]; 
        break;

        case "Evaluation":        
         
            $("ul[data-app-name='Business Development'] li[data-link-id='Initiation']").removeClass("nav-item-disabled"); 
            $("ul[data-app-name='Business Development'] li[data-link-id='Allocation']").removeClass("nav-item-disabled");  
            $("ul[data-app-name='Business Development'] li[data-link-id='Evaluation']").removeClass("nav-item-disabled");
            field_set_action_buttons_to_hide = 
                [
                    "sp-button-approve-and-start-allocation",
                    "sp-button-next-to-internally-captured",
                    "sp-button-approve-and-start-evaluation"
                ];   

        break;

        case "Independence":

            $("ul[data-app-name='Business Development'] li[data-link-id='Initiation']").removeClass("nav-item-disabled"); 
            $("ul[data-app-name='Business Development'] li[data-link-id='Allocation']").removeClass("nav-item-disabled");  
            $("ul[data-app-name='Business Development'] li[data-link-id='Evaluation']").removeClass("nav-item-disabled");
            $("ul[data-app-name='Business Development'] li[data-link-id='Independence']").removeClass("nav-item-disabled");
          
        break;

        case "Approved":           

            $("ul[data-app-name='Business Development'] li[data-link-id='Initiation']").removeClass("nav-item-disabled"); 
            $("ul[data-app-name='Business Development'] li[data-link-id='Allocation']").removeClass("nav-item-disabled");  
            $("ul[data-app-name='Business Development'] li[data-link-id='Evaluation']").removeClass("nav-item-disabled");
            $("ul[data-app-name='Business Development'] li[data-link-id='Independence']").removeClass("nav-item-disabled");

          
        break;
    }    


    sharepoint_utilities.hide_fields(field_set_action_buttons_to_hide);
    sharepoint_utilities.show_fields(field_set_action_buttons_to_show);
}


bd_app_main.disable_fields_section = function(section_link_id){

    $("div[form-navigation-target='"+section_link_id+"']").find("input").prop("disabled",true);
    $("div[form-navigation-target='"+section_link_id+"']").find("select").prop("disabled",true);
    $("div[form-navigation-target='"+section_link_id+"']").find("textarea").prop("disabled",true);
    $("div[form-navigation-target='"+section_link_id+"']").find(".radio-button-group-container").addClass("radio-disabled");

    switch(section_link_id){

        case "General and Contact Details":
            $("input[data-sp-element-name='BudgetedFee']").prop("disabled",false);
            $("input[data-sp-element-name='sp-button-preview-approvers']").prop("disabled",false);
            
        break;
    }
}

// Dashboard Table
bd_app_main.render_bd_client_dashboard = function(client_filter){

    //get all client requests based on the client name
    let get_list_items = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "*,Author/Title&$expand=Author/Title",
            client_filter,
            app_configuration.bd_initiation,
            "ClientName desc"
        )
    $.when(get_list_items).
        done(function(item_results){

            let table_html =
            `
                <table id='bd-dashboard-table' class=''>
                    <thead>
                        <tr>
                            <th>Ref No</th>
                            <th>Submitted By</th>
                            <th>Client Name</th>
                            <th>Last update</th>  
                            <th>Status</th>                                                      
                            <th>Action</th>                            
                        </tr>
                    </thead>
                <tbody>
            `
    
             //render the results in a table containing - Requested by; Client Name ; last updated date; Reference number ; status;  action column to view the submission
            for (let index = 0; index < item_results.length; index++) {
                const item_row = item_results[index];

                table_html +=
                `
                    <tr>
                        <td>BD-${item_row.Id}</td>
                        <td>${item_row.Author.Title}</td>
                        <td>${item_row.ClientName}</td>
                        <td data-sort='${moment(item_row.Modified).format("x")}'>${moment(item_row.Modified).format(app_configuration.display_date_format)}</td>
                        <td>${item_row.SubmissionStatus}</td>
                        <td>
                            <i class='menu-icon ms-Icon ms-Icon--View' data-attr-bd-id='${item_row.Id}' data-attr-action='view' title='view this submission'></i>
                            <i class='menu-icon ms-Icon ms-Icon--DocumentReply' data-attr-bd-id='${item_row.Id}' data-attr-action='restart' title='restart this submission'></i>
                            <i class='menu-icon ms-Icon ms-Icon--ErrorBadge' data-attr-bd-id='${item_row.Id}' data-attr-action='cancel' title='cancel this submission'></i>
                            <i class='menu-icon ms-Icon ms-Icon--Delete' data-attr-bd-id='${item_row.Id}' data-attr-action='remove' title='remove this submission'></i>
                        </td>
                    </tr>
                `                
            }

            table_html +=
            `
                </tbody>
                </table>
            `

            $("div[sp-field-name='temp-bd-table-history']").html(table_html)
            $("#bd-dashboard-table").dataTable();            
        
        });
}