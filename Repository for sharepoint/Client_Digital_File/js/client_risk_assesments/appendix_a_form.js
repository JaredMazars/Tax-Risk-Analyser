let appendix_a_form = {}

$(document).on("click","ul[data-app-name='Client Acceptance and Continuance'] li[data-link-id='Risk Status']",function(){

    client_risk_assesments.determine_risk_status()
});

appendix_a_form.render_form_value = function(field_results,field_set){
    //renders existing form values     
    //use that cube to display the relavant fields
    sharepoint_utilities.display_saved_list_fields(
        field_results,
        field_set,
        null
    );    
}


/*
appendix_a_form.update_form_values = function(section_name){

     //updates the current form values
     //get the current section
     let item_id = main["selected_client_risk_data"].Id;  

     //if there is already a supporting question id to make the update, we dont need to go and get the id again
     if(main["supporting_questions_id"]){

        appendix_a_form.update_data_source(main["supporting_questions_id"],section_name)

     }else{
        if(item_id){
            //get the current GIAC Form Reference
            $.when(
                sharepoint_utilities.get_list_items_by_title(
                    app_configuration.site_context, 
                    "Id",
                    "QRMACReference eq '"+item_id.toString()+"'",
                    "SupportingQuestions",
                    "Id desc")
                )
            .done(function(supporting_questions_form_properties){

                let supporting_questions_id = supporting_questions_form_properties[0].Id;         
                if(supporting_questions_id){
                    main["supporting_questions_id"] = supporting_questions_id;
                    //get all fields in the current section
                    appendix_a_form.update_data_source(supporting_questions_id,section_name)
                }
            });        
        }else{
            sharepoint_utilities.render_notification("Cannot update form","Cannot find the unique form reference for the current submission to update","Warning");
        }
     }
}

appendix_a_form.update_data_source = function(item_id,section_name,include_notifications){

    let get_meta_package = sharepoint_utilities.create_meta_package($("div[form-navigation-target='"+section_name+"'] > div"));

    console.log(section_name)
    console.log(get_meta_package.meta_package)

    if(save_sections.has_data(get_meta_package.meta_package)){
        //update the current secction
        $.when(sharepoint_utilities.update_item(
            "SupportingQuestions",
            app_configuration.site_context,
            get_meta_package.meta_package,
            item_id
            ))
        .done(function(response){                    
            //auto close the window
            if(response == "success"){
                if(include_notifications){
                    warning_controller.add_new_warning(section_name + "form Updated","Your current working form was updated","Info");  
                }                  
            }else{
                sharepoint_utilities.render_notification("Error","Something went wrong while updating your form","Warning");
            }            
        });   
    }else{
        console.log("Nothing to save")
    }
}
*/
