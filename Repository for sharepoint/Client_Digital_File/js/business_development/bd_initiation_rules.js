let bd_initiation_rules = {}


// General and Contact Details
$(document).on("click","div[app-name='Business Development'] input[data-sp-element-name='sp-button-next-to-internally-captured']",function(){

    bd_initiation_rules.create_reference_number();

});

bd_initiation_rules.create_reference_number = function(){

    if(!app_configuration.form_reference_id){
        bd_initiation_rules.create_submission();                         
    }else{
        //when the form is reset
        bd_initiation_rules.proceed_to_create_approvers(main["selected_bd_data"][0])
    }     
}

$(document).on("change","input[data-sp-element-name='BudgetedFee']",function(){
    
    bd_initiation_rules.validate_general_detail_changes($(this).attr("data-sp-element-name"),"input");
});

$(document).on("click","input[data-sp-element-name='sp-button-preview-approvers']",function(){
 
    bd_initiation_rules.preview_approvers("BudgetedFee");   
});


bd_initiation_rules.validate_general_detail_changes = function(field_name,field_type){
   
    let existing_record = main["selected_bd_data"];
    if(existing_record){        
        if(existing_record.length > 0){  
            //if there is a submission already - this means the approvers have been allocated and now need to be adjusted to match the new budget parameters
            //display a message to indicate the budget has changed
            bd_initiation_rules.general_details_adjusted(field_name,field_type);  
        }
    }
    
}

bd_initiation_rules.general_details_adjusted = function(field_name,field_type){

    let form_title = "Changes require alternative approver allocations";      
    let existing_record = main["selected_bd_data"];

   
   //add pop up box
   let approval_butons = {
       "Confirm":function(){                

            //disable evaluation | independance | Allocation | internally captured details | Allocation approvals
            $("ul[data-app-name='Business Development'] li[data-link-id='Internally Captured Details']").addClass("nav-item-disabled")
            $("ul[data-app-name='Business Development'] li[data-link-id='Allocation']").addClass("nav-item-disabled")
            $("ul[data-app-name='Business Development'] li[data-link-id='Evaluation']").addClass("nav-item-disabled")
            $("ul[data-app-name='Business Development'] li[data-link-id='Independence']").addClass("nav-item-disabled")
            $("ul[data-app-name='Business Development'] li[data-link-id='Approvals']").addClass("nav-item-disabled")
            //add a notification to wait while the form adjusts
            sharepoint_utilities.render_notification
                (
                    "Adjustment of approvers in progress",
                    "Please wait while we adjust the selected approvers",
                    "Info"
                )
            //remove all existing tasks
            action_buttons.restart_form_notification (existing_record[0].Id.toString())
            //replace with new tasks
            bd_initiation_rules.proceed_to_create_approvers(existing_record[0])
            //save the general details section            
            sharepoint_utilities.close_container_window($(".approver-changes-required-confirmation"));       

            return false;

       },
       "Cancel":function(){

            if(existing_record.length >0){  
                //reset the field value
                switch(field_type){
                    case "input":
                        sharepoint_utilities.set_field_value(field_name,existing_record[0][field_name]); 
                    break;
                }   
            }
            
       }
   }

   let approval_box_message = 
   `
       <div class='content-pop-up-window-content' style='min-height:200px !important;width:100%'>				
           <div class='confirm-box-container'>
                We have detected that you have changed certain details of the form which influence the approver allocations.<br/>
                This will completly reset the form back to allocation, remove all the current tasks and create new approval tasks.
                Please click 'Confirm' to proceed with these adjustments.
           </div>
       </div>
   `

   $.confirm(
       {
           title: form_title,
           content: approval_box_message,
           titleClass: "approver-changes-required-confirmation",
           boxWidth: "50%",
           type:"green",
           useBootstrap: false,
           buttons: approval_butons,
           onContentReady: function () {

                $("ul[data-app-name='Business Development'] li[data-link-id='General and Contact Details']").click();
                bd_initiation_rules.preview_approvers("BudgetedFee"); 
           }
       }
   ); 
}

bd_initiation_rules.create_submission = function(){
   
      
    let field_properties = sharepoint_utilities.create_meta_package($("div.bd-intitation-general-section"))
    //default current submission to submitter    
    field_properties.meta_package["RoleReferenceId"] = ";"+_spPageContextInfo.userId + ";";

   if(field_properties.IsValid){    
    
        sharepoint_utilities.render_notification
        (
            "Sending Submission",
            "Thank you for your submission - please wait while we finalize the process",
            "Info"
        ) 
       
        let create_item = sharepoint_utilities.save_item
            (
                app_configuration.bd_initiation,
                app_configuration.site_context,
                field_properties.meta_package
            );
        $.when(create_item)
            .done(function(item_result){

                app_configuration.form_reference_id = item_result.Id;   
                main["selected_bd_data"].push(item_result)      
                bd_initiation_rules.proceed_to_create_approvers(item_result);
                let create_evaluation_item = sharepoint_utilities.save_item
                (
                    app_configuration.bd_evaluation,
                    app_configuration.site_context,
                    {"ReferenceId":app_configuration.form_reference_id.toString()}
                );
                let create_independence_item = sharepoint_utilities.save_item
                (
                    app_configuration.bd_independence,
                    app_configuration.site_context,
                    {"ReferenceId":app_configuration.form_reference_id.toString()}
                );
               

        }).fail(function(){
            sharepoint_utilities.render_notification
                (
                    "OOPS!",
                    "Something went wrong whilst submitting your form",
                    "Info"
                )  
        });
    }else{

        sharepoint_utilities.render_notification
            (
                "Cannot Continue",
                "Please complete the following sections before proceeding: <br/>" +
                field_properties.validation_message,
                "Warning"
            )        
    }
}

bd_initiation_rules.preview_approvers = function(trigger_field_name){

    let list_of_trigger_fields = 
    [   
        "ServiceLines","EntityRegType","Industry","OtherIndustry",
        "ScopeOfServices","PrimaryAssignedEngagementPartnerId","EngagementType",
        "BudgetedFee"
    ]

    if(list_of_trigger_fields.indexOf(trigger_field_name) > 0){
    
        let field_properties = sharepoint_utilities.create_meta_package($("div.bd-intitation-general-section"))
        if(field_properties.IsValid){
        
            //gets all the data required to determine the approvers
            $.when(bd_allocation_rules.determine_approvers(field_properties.meta_package)).done(function(approver_properties){

                $("div[sp-field-name='placeholder-allocation-preview-approver-container'] .row-description").html(approver_properties.additional_details)
                bd_security.create_allocation_table(approver_properties.list_of_members,$("div[sp-field-name='placeholder-allocation-preview-approver-container'] .field-component"),"preview");
                sharepoint_utilities.show_fields(["placeholder-allocation-preview-approver-container"]);    
            });
        }
    }
}

bd_initiation_rules.proceed_to_create_approvers = function(item_result){      
    
    let field_properties = sharepoint_utilities.create_meta_package($("div.bd-intitation-general-section"));

    $.when(bd_allocation_rules.determine_approvers(field_properties.meta_package)).done(function(approver_properties){

        if(!approver_properties.has_error){       

            //create an approval task for the Interally Captured Details section
            bd_approval_configuration.create_approval_tasks(approver_properties.list_of_members);
            if(approver_properties.list_of_members.length == 0){
                sharepoint_utilities.render_notification
                    (
                        "Cannot Create Tasks",
                        "Your form was submitted without approvers and cannot continue as there were thresholds that were outside of this tools scope",
                        "Warning"
                    )
            }else{
                //apply the security
                let applied_team_properties = bd_security.add_team_member(approver_properties.list_of_members)                
                bd_security.render_bd_allocation_team_members_table(approver_properties.list_of_members); 
                bd_security.update_security_record(applied_team_properties.new_role_reference_ids,approver_properties.list_of_members); 

                action_buttons.dashboard_update_submission_status("Internally Captured Details",item_result.Id.toString());

                setTimeout(function(){
                    $("#Left-sticky-menu li[title='Business Development']").click();
                },2000); 
            }            

        }else{

            warning_controller.add_new_validation_warning("Cannot continue with your submission",approver_properties.error_message,"Warning")
            sharepoint_utilities.render_notification
                (
                    "Cannot continue with your submission",
                    "Your selection contains criteria that does not have an associated approver",
                    "Warning"
                )
        }      
    });
}