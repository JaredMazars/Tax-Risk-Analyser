let bd_allocation_rules = {};

// Allocation - Team Members Table
$(document).on("click","ul[data-app-name='Business Development'] li[data-link-id='Allocation']",function(){
   
    //render the existing table
    bd_security.render_bd_allocation_team_members_table(JSON.parse((main["selected_bd_data"][0].RoleDetails))); 
});

// Allocation - Assign or Re-assign team member
$(document).on("click","div[app-name='Business Development'] input[data-sp-element-name*='sp-button-add-new']",function(){

    bd_allocation_rules.add_new_team_member_form();    
});

// Remover team member on bd-allocation-team-members-table
$(document).on("click","#bd-allocation-team-members-table tbody tr td .remove-user",function(){

    sharepoint_utilities.render_notification
        (
            "Removing User",
            "Please wait while we remove the user",
            "Info"
        )

    let get_index_id = $(this).parent().parent().attr("data-attr-bd-id");
    let user_id = $(this).parent().parent().attr("data-attr-bd-user-id");
    let user_name = $(this).parent().parent().attr("data-attr-bd-user-name");
    
    let team_properties = bd_security.remove_team_member(get_index_id);

    bd_security.render_bd_allocation_team_members_table(team_properties.list_of_team_members);
    bd_security.update_security_record(team_properties.new_role_reference_ids,team_properties.list_of_team_members);   

    notification_meta_package = {
        "Title":"Permimission Change",
        "ApprovalTaskReferenceId":"-",
        "AssignedToId":parseInt(user_id),
        "AssignedToDisplayName":user_name,
        "NotificationDetails":team_properties.team_member_details.display_name + 
            " was remove with the " + team_properties.team_member_details.role_name,                       
        "NotificationType":"Remove User",
        "NotificationStatus":"Permission change",
        "FormReferenceId":app_configuration.form_reference_id,
        "ChangeType":"-"
    }
    action_buttons.create_notification(notification_meta_package);

});



bd_allocation_rules.add_new_team_member_form = function(default_persona){

    let form_title = "Add new team member to the submission";
    let task_fields = 
        [	
           {
               "Title": "Approver",
               "Description": "Please select the new assignee",
               "sp_field_name": "sp-temp-assigned-approver",
               "sp_field_type": "select",
               "field_width": "half-width",
               "field_validate": true,
               "sp_additional_properties": "number single-select-typeahead",        
               "drop_down_title_field":"Title",
               "drop_down_value_field":"EMail",
               "list_name": "User Information List",
               "site_context": app_configuration.people_picker_site_context,
               "field_icon": "AccountBrowser"
           },           
           {
               "Title":"Role",
               "Description":"Please select the role of the new assignee",
               "sp_field_name":"sp-temp-assigned-role",
               "sp_field_type":"select",
               "field_width":"half-width",
               "field_validate":true,
               "sp_additional_properties":"single-select-drop-down-external-list",
               "additional_filters":"",
               "drop_down_title_field":"Title",
               "drop_down_value_field":"Id",
               "drop_down_order_by":"Title asc",
               "list_name":'BDRoleTypes',
               "site_context": app_configuration.site_context,
               "field_icon":"AccountBrowser" 
           },
           {
                "Title":"Permission Level",
                "Description":"Please select the level of interaction",
                "sp_field_name":"sp-temp-assigned-permission-level",
                "sp_field_type":"select",
                "field_width":"half-width",
                "field_validate":true,
                "sp_additional_properties":"single-select-drop-down-external-list",
                "additional_filters":"",
                "drop_down_title_field":"Title",
                "drop_down_value_field":"Id",
                "drop_down_order_by":"Title asc",
                "list_name":'BDRolePermissions',
                "site_context": app_configuration.site_context,
                "field_icon":"AccountBrowser" 
           },
           {
               "Title": "Reason for assignment",
               "Description": "Please provide a reason for this reassignment",
               "sp_field_name": "sp-temp-assigned-reason",
               "sp_field_type": "textarea",
               "field_width": "full-width",
               "field_validate": true,
               "sp_additional_properties": "exclude-from-meta"        
           }
       ] 

   
   
   
   //add pop up box
   let approval_butons = {
       "Confirm":function(){

            let field_properties = sharepoint_utilities.get_field_values(
                [
                    "sp-temp-assigned-approver","sp-temp-assigned-role",
                    "sp-temp-assigned-permission-level","sp-temp-assigned-reason","RoleDetails"]
                );    
            
            if(field_properties.IsValid){

                sharepoint_utilities.render_notification
                    (
                        "Adding Permissions",
                        "Please wait while we add permissions and send out communications",
                        "Info"
                    )

                let row_data = field_properties.meta_package
                let get_user_id = sharepoint_utilities.validate_user_in_site_collection(
                        row_data["sp-temp-assigned-approver"],
                        app_configuration.site_context
                );
                $.when(get_user_id).done(function(user_id){

                    
                    let role_name = $("select[data-sp-element-name='sp-temp-assigned-role'] option:selected").text();
                    let approver_name = $("select[data-sp-element-name='sp-temp-assigned-approver'] option:selected").text();
                    let permission_name = $("select[data-sp-element-name='sp-temp-assigned-permission-level'] option:selected").text();
                    //add the member to the table
                    let new_team_member_details = {
                        "role_name":role_name,
                        "display_name":approver_name,
                        "email":row_data["sp-temp-assigned-approver"],
                        "user_id":user_id,                    
                        "role_name":role_name,           
                        "role_id":row_data["sp-temp-assigned-role"],
                        "role_permission_id":row_data["sp-temp-assigned-permission-level"],
                        "role_permission_name":permission_name
                    }  

                    let get_current_team_members = JSON.parse(field_properties.meta_package.RoleDetails);
                    get_current_team_members.push(new_team_member_details);

                    let team_member_properties =  bd_security.add_team_member(get_current_team_members);
                    bd_security.render_bd_allocation_team_members_table(get_current_team_members)
                    //add notification

                    notification_meta_package = {
                        "Title":"Permimission Change",
                        "ApprovalTaskReferenceId":"-",
                        "AssignedToId":user_id,
                        "AssignedToDisplayName":approver_name,
                        "NotificationDetails":approver_name + " was added with the " + role_name +" role for the following reason " + row_data["sp-temp-assigned-reason"],
                        "NotificationType":"Add New User",
                        "NotificationStatus":"Permission change",
                        "FormReferenceId":app_configuration.form_reference_id,
                        "ChangeType":"-"
                    }

                    action_buttons.create_notification(notification_meta_package);
                    
                    sharepoint_utilities.close_container_window($(".allocation-assigning-team-member"));

                    bd_security.update_security_record(team_member_properties.new_role_reference_ids,get_current_team_members);       
                    
                    switch(default_persona){

                        case "QRM":
                            //create a separate approval task for QRM in a separate table and display it under the conclusion section of the form
                            bd_evaluation_rules.create_qrm_task(
                                user_id,
                                row_data["sp-temp-assigned-role"]                                
                            )
                        break;
                    }
                });
                
            }else{
                sharepoint_utilities.render_notification
                    (
                        "Cannot action member permissions",
                        field_properties.validation_message,
                        "Warning"
                    )
            }  
           
          

            return false;

       },
       "Cancel":function(){}
   }

   let approval_box_message = 
   `
       <div class='content-pop-up-window-content' style='min-height:200px !important;width:100%'>				
           <div class='confirm-box-container'></div>
       </div>
   `

   $.confirm(
       {
           title: form_title,
           content: approval_box_message,
           titleClass: "allocation-assigning-team-member",
           boxWidth: "50%",
           type:"green",
           useBootstrap: false,
           buttons: approval_butons,
           onContentReady: function () {
                $(".confirm-box-container").html(sharepoint_utilities.create_container_form(task_fields,"bd_allocation_assign_engagement_partner"));
                sharepoint_utilities.apply_form_plugins(task_fields);     
                
                //check for defaul persona
                switch(default_persona){

                    case "QRM":  
                        setTimeout(() => {
                                sharepoint_utilities.set_select_2_fields_by_value(12,$("select[data-sp-element-name='sp-temp-assigned-role']"));    
                                sharepoint_utilities.set_select_2_fields_by_value(1,$("select[data-sp-element-name='sp-temp-assigned-permission-level']"));
                                sharepoint_utilities.disable_fields(["sp-temp-assigned-role","sp-temp-assigned-permission-level"]);
                                sharepoint_utilities.set_field_value("sp-temp-assigned-reason","QRM Assistance Required");
                        }, 1000);                       
                        
                    break;
                }
            }
       }
   ); 
}


bd_allocation_rules.determine_approvers = function(form_details){

    let approver_promise = $.Deferred();

    let channel_properties = determine_channel_filter(form_details.ServiceLines);  
    let has_error = false;
    let error_message = "";     

    //get all the rules associated with the budget
    let get_approver_rules = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "*,PermissionType/Title,AssociatedRoles/Title&$expand=PermissionType/Title,AssociatedRoles/Title",
            "StartThresholdAmount le "+ form_details.BudgetedFee +" and EndThresholdAmount ge " + form_details.BudgetedFee + channel_properties.channel_filter,
            app_configuration.bd_approver_rules,
            "Id asc"
        )

    //get all assigne people per roles and rules
    let get_approver_roles = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "*,AssociatedRoles/Title,AssociatedPerson/Title,AssociatedPerson/EMail,AssociatedPerson/Id&$expand=AssociatedRoles/Title,AssociatedPerson/Title,AssociatedPerson/EMail,AssociatedPerson/Id",
            "",
            app_configuration.bd_approver_roles,
            "Id desc"
        )
    $.when(get_approver_rules,get_approver_roles).
        done(function(approver_results,approver_role_results){                    

            //create a preview of the rules that were found in the system
            let additional_details = "";         
           
            //for each of the approvers required per rule
            let list_of_members = [];
            for (let index = 0; index < approver_results.length; index++) {
                const approver_configuration = approver_results[index];                    
                let configured_roles = approver_configuration.AssociatedRoles;

                additional_details += "Rule Id: " + approver_configuration.Id + " - " + 
                    approver_configuration.Title +
                    "<br/>";


                //for each of the roles
                for (let role_index = 0; role_index < configured_roles.length; role_index++) {
                    const current_role = configured_roles[role_index];                      
                    
                    let current_role_id = approver_configuration.AssociatedRolesId[role_index]

                        //find the specific approver by assocaited tole , service line , priority sector or non priority sector
                    let lookup_specific_approver_details = lookup_Approver_details(form_details,current_role_id,approver_role_results,channel_properties);
                    if(lookup_specific_approver_details.process_role){

                        role_security_details =  {
                            "role_name":current_role.Title,           
                            "role_id":current_role_id,
                            "role_permission_id":approver_configuration.PermissionTypeId,
                            "role_permission_name":approver_configuration.PermissionType.Title
                        }
                        let approver_object = Object.assign(lookup_specific_approver_details.json_team_data,role_security_details);
                        list_of_members.push(approver_object);

                            //check for any blank roles - this is an error check if something has not been configured correctly
                        for (const [key, value] of Object.entries(role_security_details)) {
                            if(!value){
                                error_message += "- " + key + " is not found<br/>";
                                has_error = true;
                            }
                        }
                        
                    }                        
                }     
            }                   

            approver_promise.resolve({
                "list_of_members":list_of_members,
                "has_error":has_error,
                "error_message":error_message,
                "additional_details":additional_details                
            });
            
    });    

    return approver_promise.promise();

    function lookup_Approver_details(field_properties,current_role_Id,approver_role_configuration){
       
        let process_role = true;
      

        let approver_login_details = get_approver_login_details(field_properties,current_role_Id,approver_role_configuration);
       
        let json_team_data = {
            
            "display_name":approver_login_details.display_name,
            "email":approver_login_details.EMail,
            "user_id":approver_login_details.Id
        }       

        if(field_properties.PrimaryAssignedEngagementPartnerId > 0){       
            
            //if there is an engagement partner then we dont need a sector lead or a head of service line leader replacement
            //current_role_Id== 10 || current_role_Id == 5
            if(current_role_Id== 10 || current_role_Id == 5){
                process_role = false        
            }           
        }else{  

            //check if we need to process te regional leader role -  this is the case if an other scope of services is selected as other
            if(field_properties.ScopeOfServices.indexOf("Other") == -1 && current_role_Id == 6){
                process_role = false  
            }
            //if there is no engagement partner then we remove the role and add the sector lead or service line leader replacement
            if(current_role_Id == 9){
                process_role = false        
            } 
        }  

        return {
            "process_role":process_role,
            "json_team_data":json_team_data,
            "has_error":has_error,
            "error_message":error_message
        }

    }

    function get_approver_login_details(field_properties,current_role_Id,approver_role_configuration){

        let approver_login_details = {};

        let extract_scope_of_services = field_properties.ScopeOfServices.split("#;");
      

        let is_found = false;
        //loop through all the rows
        for (let index = 0; index < approver_role_configuration.length; index++) {
            const approver_roles_row = approver_role_configuration[index];


            //if its the engagement partner role we pre-populate
            //need to fix this - only if an engagement partner exists should it go down this road
            if(current_role_Id == 9 && field_properties.PrimaryAssignedEngagementPartnerId > 0){                
                if(main["selected_bd_data"][0]){
                    approver_login_details = {
                        "display_name":$("select[data-sp-element-name='PrimaryAssignedEngagementPartnerId']  option:selected").text(),
                        "EMail":"",
                        "Id":main["selected_bd_data"][0].PrimaryAssignedEngagementPartnerId
                    }

                    is_found = true;
                }
            }else  
            if(approver_roles_row.AssociatedRolesId == current_role_Id){             
                 //if there is a match with the roles
                //determine the role lookup
                switch(current_role_Id){

                    //National Service Line Leader
                    case 4:
                        
                        if(approver_roles_row.ServiceLineType == field_properties.ServiceLines){
                            approver_login_details = {
                                "display_name":approver_roles_row.AssociatedPerson.Title,
                                "EMail":approver_roles_row.AssociatedPerson.EMail,
                                "Id":approver_roles_row.AssociatedPerson.Id
                            }

                            is_found = true;
                        }
                    break;

                    //national sector leader
                    case 5:

                        //uses prioirty sector aas a    lookup to the industry field
                        
                        if(approver_roles_row.PrioritySector == field_properties.Industry){
                            approver_login_details = {
                                "display_name":approver_roles_row.AssociatedPerson.Title,
                                "EMail":approver_roles_row.AssociatedPerson.EMail,
                                "Id":approver_roles_row.AssociatedPerson.Id
                            }

                            is_found = true;
                        }
                       
                    break;


                    //regional leader - is required when scope of service is set to other
                    case 6:

                         //if is other selected then use the region field as a lookup
                         if(field_properties.ScopeOfServices.indexOf("Other") >= 0){
                            if(approver_roles_row.NonPrioritySector == field_properties.StateRegion){
                                approver_login_details = {
                                    "display_name":approver_roles_row.AssociatedPerson.Title,
                                    "EMail":approver_roles_row.AssociatedPerson.EMail,
                                    "Id":approver_roles_row.AssociatedPerson.Id
                                }

                                is_found = true;
                            }
                        }                        
                    break;

                    //engagement partner
                    case 9:

                       //do nothing as no role configured

                    break;


                    //head of service line
                    case 10:

                        if(approver_roles_row.ServiceLineType == field_properties.ServiceLines){
                            approver_login_details = {
                                "display_name":approver_roles_row.AssociatedPerson.Title,
                                "EMail":approver_roles_row.AssociatedPerson.EMail,
                                "Id":approver_roles_row.AssociatedPerson.Id
                            }

                            is_found = true;
                        }

                    break;

                    //focus group leaders
                    case 11:

                        for (let index = 0; index < extract_scope_of_services.length; index++) {
                            const element = extract_scope_of_services[index];
                            
                            let get_sub_service = element.split(" - ")[1];
                            //loop through all the categorts selected under scope of services
                            if(approver_roles_row.FocusGroup.toLowerCase() == get_sub_service.toLowerCase()){
                                approver_login_details = {
                                    "display_name":approver_roles_row.AssociatedPerson.Title,
                                    "EMail":approver_roles_row.AssociatedPerson.EMail,
                                    "Id":approver_roles_row.AssociatedPerson.Id
                                }
                            }

                            is_found = true;
                        }         

                    break;

                    //person whom submitter the application
                    case 15:
                        
                        approver_login_details = {
                            "display_name":_spPageContextInfo.userDisplayName,
                            "EMail":_spPageContextInfo.userEmail,
                            "Id":_spPageContextInfo.userId
                        }
                        is_found = true;                        
                        

                    break;

                    //for all other roles without rules
                    default:
                        approver_login_details = {
                            "display_name":approver_roles_row.AssociatedPerson.Title,
                            "EMail":approver_roles_row.AssociatedPerson.EMail,
                            "Id":approver_roles_row.AssociatedPerson.Id
                        }

                        is_found = true;
                    break;

                }
            }   
            
            if(is_found){
                //stop processing the role as its details have now been found
                break;
            }
        }

        return approver_login_details

    }

    function determine_channel_filter(selected_service_lines){


        /*
            A client can select to have assurance and non-assurance services (group engagement), 
            a this point it will trigger two flows; an assurance and non-assurance flow, following
            the allocation criteria set for both channel 1 and channel 2 allocations. 
            Collaboration between the departments will happen when performing the evaluation step.

            For multiple select service will trigger the process to be performed to cover all services required, 
            i.e. 2 acceptance questionnaires, 2 engagement letters, 2 different task codes 
            (if client proposal is successful)
        */

        let channel_filter = ""
        let assurance_found = false;
        let non_assurance_found = false;

        if(selected_service_lines){

            let list_of_selections = selected_service_lines.split("#;");
            for (let index = 0; index < list_of_selections.length; index++) {
                const row_item = list_of_selections[index];

                //dont process twice
                if(assurance_found == false){
                    if(row_item == "Audit" || row_item == "Statutory compliance"){
                        assurance_found = true;                    
                    }
                }
                if(non_assurance_found == false){
                    if(row_item != "Audit" && row_item != "Statutory compliance"){                     
                        non_assurance_found = true;
                    }   
                }
            }            
        }


        if(assurance_found == true && non_assurance_found == true){
            channel_filter = " and (Channel eq 'Assurance' or Channel eq 'Non Assurance')"
        }else
        if(assurance_found == true){
            channel_filter = " and Channel eq 'Assurance'"
        }else
        if(non_assurance_found == true){
            channel_filter = " and Channel eq 'Non Assurance'"
        }

        return {
            "channel_filter":channel_filter,
            "non_assurance_found":non_assurance_found,
            "assurance_found":assurance_found
        }
        
    }


}