let action_buttons = {}

$(document).on("click","div[app-name='Business Development'] input[title*='Next']",function(){
    
    if(app_configuration.form_reference_id){
        action_buttons.go_to_next_section($(this));
    }

})

$(document).on("click","div[app-name='Business Development'] input[title*='Back']",function(){
      
    if(app_configuration.form_reference_id){
        action_buttons.go_back_to_section($(this)); 
    }

});


$(document).on("mousedown","ul[data-app-name='Business Development'] li",function(){
       
    if(app_configuration.form_reference_id){
        let section_name =  $("ul[data-app-name='Business Development']").find("li.currently-open").attr("data-link-id");  
        action_buttons.update_existing_submission(section_name); 
    }     
});




$(document).on("click","div[app-name='Business Development'] ul li[navigation-target-container='Supporting-Documents']",function(){

    supporting_documents.display_all_documents(app_configuration.form_reference_id.toString());  

});

$(document).on("click","div[app-name='Business Development'] input[data-sp-element-name='btn-submit']",function(){

    if(app_configuration.form_reference_id){ 
        sharepoint_utilities.hide_fields(["btn-submit"]);  
        action_buttons.update_existing_submission($("div[app-name='Business Development']"));
    } else {
        sharepoint_utilities.render_notification("Error","Could not submit","Warning");
    }        
});

// General and Contact Details
$(document).on("change","div[app-name='Business Development'] select[data-sp-element-name='temp-bd-request-search']",function(){

    let client_filter = "ClientName eq '" + $(this).val() + "'";
    bd_app_main.render_bd_client_dashboard(client_filter);    

});

// Evaluation - Conclusion and Analysis of Results
$(document).on("click","ul[data-app-name='Business Development'] li[data-link-id='Conclusion and Analysis of Results']",function(){
    bd_evaluation_rules.render_bd_conclusion_and_analysis_table();

});


$(document).on("click","div[app-name='Business Development'] input[data-sp-element-name*='sp-button-approve']",function(){

    bd_approval_configuration.approve_application($(this));    
});

$(document).on("click","div[app-name='Business Development'] input[data-sp-element-name*='sp-button-decline']",function(){

    bd_approval_configuration.decline_application($(this));    
});



$(document).on("click","#bd-dashboard-table tbody tr i",function(){

    action_buttons.dashboard_table_icon_actions($(this));    
});


action_buttons.dashboard_table_icon_actions = function(icon_element){

    let action_type = icon_element.attr("data-attr-action");
    let get_reference_id = icon_element.attr("data-attr-bd-id")

    switch(action_type){

        case "remove":

            action_buttons.remove_form(get_reference_id)
        break;

        case "view":

            bd_business_rules.render_existing_form(get_reference_id);

        break;

        case "restart":
            action_buttons.restart_form(get_reference_id);   
             //create notification to remove all approval tasks
            action_buttons.restart_form_notification(get_reference_id);     
        break;

        case "cancel":
            action_buttons.cancel_form(get_reference_id)
        break;
    }

}

action_buttons.remove_form = function(reference_id){

    action_buttons.dashboard_update_submission_status("Removed",reference_id)
}

action_buttons.restart_form = function(reference_id){

    action_buttons.dashboard_update_submission_status("Allocation",reference_id);
   
    
}

action_buttons.cancel_form = function(reference_id){

    action_buttons.dashboard_update_submission_status("Cancelled",reference_id)
}


action_buttons.restart_form_notification = function(reference_id){

    let notification_meta_package = {
        "Title":"Status Change Notification",
        "ApprovalTaskReferenceId":"-",
        "AssignedToId":0,
        "AssignedToDisplayName":"system defined",
        "NotificationDetails":"-",
        "NotificationType":"Reset approvals",
        "NotificationStatus":"Allocation",
        "FormReferenceId":reference_id,
        "ChangeType":"-"
    }
    action_buttons.create_notification(notification_meta_package)
}

action_buttons.dashboard_update_submission_status = function(new_status,reference_id){

    let meta_package = {
        "SubmissionStatus":new_status
    }

    if(new_status == "Cancelled" || new_status == "Removed"){
        meta_package["SystemStatus"] = "Closed";
    }else{
        meta_package["SystemStatus"] = "Open";
    }

    let notification_meta_package = {
        "Title":"Status Change Notification",
        "ApprovalTaskReferenceId":"-",
        "AssignedToId":0,
        "AssignedToDisplayName":"system defined",
        "NotificationDetails":"-",
        "NotificationType":"status change",
        "NotificationStatus":new_status,
        "FormReferenceId":reference_id,
        "ChangeType":"-"
    }

    let update_item = sharepoint_utilities.update_item 
            (
                app_configuration.bd_initiation,
                app_configuration.site_context,
                meta_package,
                parseInt(reference_id)
            )
    $.when(update_item)
        .done(function(){
            //reset the table
            sharepoint_utilities.render_notification
                (
                    "Form Submission Update",
                    "Your form was updated to " + new_status,
                    "Info"
                )
            bd_app_main.render_client_dashboard();
            action_buttons.create_notification(notification_meta_package)
    });    
    
}



action_buttons.create_notification = function(meta_package){

   let create_item = sharepoint_utilities.save_item
        (
            app_configuration.bd_general_notifications,
            app_configuration.site_context,
            meta_package
        );
    $.when(create_item)
        .done(function(item_id){
           
    });   

}





action_buttons.go_to_next_section = function(selected_button){

    let get_current_selected_item = $("ul[data-app-name='Business Development']").find("li.currently-open");

    if(get_current_selected_item.length != 0){
        
        if( selected_button.attr("data-sp-element-name") != "sp-button-next-to-internally-captured"){          
           
            let section_name = $("ul[data-app-name='Business Development']").find("li.currently-open").attr("data-link-id");    
            action_buttons.update_existing_submission(section_name); 
        }

        //check for disabled sections and ensure we dont activate them
        let check_for_sub_link_navigation = get_current_selected_item.nextAll("li").not(".nav-item-disabled").first().find("ul");
        //check to see if the next link is a top level link
        if(check_for_sub_link_navigation.length > 0){
            get_current_selected_item.nextAll("li").not(".nav-item-disabled").first().click()
            get_current_selected_item.nextAll("li").not(".nav-item-disabled").first().next().children("li:first-child").click();    
        }else{
            get_current_selected_item.nextAll("li").not(".nav-item-disabled").first().click();
        } 
        //check for the end of the navigation process     
        // Check if it is the last item
        if(get_current_selected_item.is(':last-child')){
            parent_level = get_current_selected_item.parent();
            parent_level.nextAll("li").not(".nav-item-disabled").first().click()
        }      

    }else{
        warning_controller.add_new_warning("Error","Section "+get_current_selected_item+" not saved, Please ensure you have selected a section","Warning")
        sharepoint_utilities.render_notification("Error","Section not saved, Please ensure you have selected a section","Warning")
    }
    
}

action_buttons.go_back_to_section = function(selected_button){
    
    let get_current_selected_item = $("ul[data-app-name='Business Development']").find("li.currently-open");

    if(get_current_selected_item.length != 0){
        
        let section_name = $("ul[data-app-name='Business Development']").find("li.currently-open").attr("data-link-id");    
        action_buttons.update_existing_submission(section_name); 
        //check for disabled sections and ensure we dont activate them
        let check_for_sub_link_navigation = get_current_selected_item.prevAll("li").not(".nav-item-disabled").last().find("ul");

        //check to see if the next link is a top level link
        if(check_for_sub_link_navigation.length > 0){
            get_current_selected_item.prevAll("li").not(".nav-item-disabled").first().click()
            get_current_selected_item.prevAll("li").not(".nav-item-disabled").first().next().children("li:first-child").click();    
        }else{
            get_current_selected_item.prevAll("li").not(".nav-item-disabled").first().click();
        }

         //check for the end of the navigation process     
        // Check if it is the last item
        if(get_current_selected_item.is(':first-child')){
            parent_level = get_current_selected_item.parent();
            parent_level.prevAll("li").not(".nav-item-disabled").first().prev().click();  
        }    

    }else{

        warning_controller.add_new_warning("Error","Section "+get_current_selected_item+" not saved, Please ensure you have selected a section","Warning")
        //sharepoint_utilities.render_notification("Error","Section not saved, Please ensure you have selected a section","Warning")
    }
}



action_buttons.update_existing_submission = function(section_name){    

    //only update the form when not declined or approved
    if(main["selected_bd_data"][0].SystemStatus == "Open"){
  
        let listName = app_configuration.bd_initiation; 
        let form_section = $("div[form-navigation-target='"+section_name +"']")

        let list_reference_id = app_configuration.form_reference_id
        // Switch case depending on current section to assign the relative list name
        switch(section_name){
            case "General and Contact Details":
                listName = app_configuration.bd_initiation;
            break;

            case "Internally Captured Details":
                listName = app_configuration.bd_initiation;
            break;

            case "Initiation":
                listName = app_configuration.bd_initiation;           
            break;

            case "Allocation":
                listName = app_configuration.bd_initiation;
            break;

            case "Restricted Entity Database":
                listName = app_configuration.bd_evaluation;
                list_reference_id = app_configuration["evaluation_ref_id"]
            break;

            case "Risk Factors":
                listName = app_configuration.bd_evaluation;
                list_reference_id = app_configuration["evaluation_ref_id"]
            break;

            case "Needs Analysis and Risk Considerations":
                listName = app_configuration.bd_evaluation;
                list_reference_id = app_configuration["evaluation_ref_id"]
            break;

            case "Conclusion and Analysis of Results":
                listName = app_configuration.bd_evaluation;
                list_reference_id = app_configuration["evaluation_ref_id"] 
            break;

            case "Independence":
                listName = app_configuration.bd_independence;
                list_reference_id = app_configuration["independence_ref_id"]
            break;

            case "Acceptance":
                listName = app_configuration.bd_independence;
                list_reference_id = app_configuration["independence_ref_id"]
            break;
        }   

        if(app_configuration.form_reference_id){ 

            let get_meta_package = sharepoint_utilities.create_meta_package(form_section);  
            
            if(get_meta_package.IsValid){

                
                let update_item = sharepoint_utilities.update_item 
                        (
                            listName,
                            app_configuration.site_context,
                            get_meta_package.meta_package,
                            list_reference_id
                        )
                $.when(update_item)
                    .done(function(results){
                    
                });
                
            }else{

                sharepoint_utilities.navigation_sections("Back");             
                sharepoint_utilities.render_notification
                (
                    "Cannot Continue",
                    "Please complete the following sections before proceeding: <br/>" +
                    get_meta_package.validation_message,
                    "Warning"
                )
            }       
        }   
    }       
}

