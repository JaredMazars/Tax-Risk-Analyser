let giac_form = {}

giac_form.render_form_value = function(field_results,field_set){

    main["giac_form_id"] = field_results[0].Id
    //renders existing form values     
    //use that cube to display the relavant fields
    sharepoint_utilities.display_saved_list_fields(
        field_results,
        field_set,
        null
    );    
}


/*
giac_form.update_form_values = function(item_id,section_name){

    //updates the current form values
     //get the current section
     let item_id = main["selected_client_risk_data"].Id;  

     if(item_id){
        //get the current GIAC Form Reference
        $.when(
            sharepoint_utilities.get_list_items_by_title(
                app_configuration.site_context, 
                "Id",
                "QRMACReference eq '"+item_id.toString()+"'",
                "GIAC Form",
                "Id desc")
            )
        .done(function(giac_form_properties){

            let giac_form_id = giac_form_properties[0].Id;
            if(giac_form_id){
                //get all fields in the current section
                let get_meta_package = sharepoint_utilities.create_meta_package($("div[form-navigation-target='GIAC Form'] > div"));
                //update the current secction
                $.when(sharepoint_utilities.update_item(
                        app_configuration.giac_list_name,
                        app_configuration.site_context,
                        get_meta_package.meta_package,
                        giac_form_properties[0].Id
                    ))
                .done(function(response){
                    
                    //auto close the window
                    if(response == "success"){
                        sharepoint_utilities.render_notification("Form Updated","Your current working form was updated","Info");               
                    }else{
                        sharepoint_utilities.render_notification("Error","Something went wrong while updating your form","Warning");
                    }            
                });    
            }
        });        
     }else{
         sharepoint_utilities.render_notification("Cannot update form","Cannot find the unique form reference for the current submission to update","Warning");
     }
}

*/

giac_form.create_new_form = function(qrm_ac_id){

    //creates a new form when the QRM form is created for the first time 
    //this checks all the properties of the configured fields and returns and obj of all the values and validation status etc.
    let record_meta = {
        "QRMACReference":qrm_ac_id.toString()
    }
    $.when(sharepoint_utilities.save_item(
        app_configuration.giac_list_name,
        app_configuration.site_context,
        record_meta
    ))
    .done(function(response){	
        main["giac_form_id"] = response.Id
    });

}