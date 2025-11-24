let bd_business_rules = {};


bd_business_rules.render_existing_form = function(get_reference_id){

    let consolidated_intiation_fields = sharepoint_utilities.consolidate_fields(bd_intiation_field_set_configuration);
    //get the select bd data set
    let get_list_items = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            sharepoint_utilities.generate_query_for_expanded_fields(consolidated_intiation_fields),
            "Id eq '"+get_reference_id +"'",
            app_configuration.bd_initiation,
            "Id desc"
        )
    $.when(get_list_items).
    done(function(item_results){             
            
            app_configuration.form_reference_id = get_reference_id        
            main["selected_bd_data"] = item_results

            sharepoint_utilities.field_comments_list = [];
            bd_app_main.render_selected_form(main["selected_bd_data"]);  

            //to initiate the form form
            $("li[data-link-id='New Client Requests']").click();
            $("li[data-link-id='Initiation']").click();
            //open up the section link            

            //get approval tasks
            bd_approval_configuration.render_approval_tasks();
    });
    
}