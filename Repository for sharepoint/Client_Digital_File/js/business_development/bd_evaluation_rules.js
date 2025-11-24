let bd_evaluation_rules = {};

$(document).on("click","div[sp-field-name='sp-button-mitigating-factors'] input",function(){

    bd_allocation_rules.add_new_team_member_form("QRM"); 

});

$(document).on("click","div[sp-field-name='sp-button-database-check'] input",function(){

    window.open(app_configuration.bd_entity_database_url,"blank")
    
});

$(document).on("click","div[sp-field-name='sp-button-complete-we-check'] input",function(){

    window.open(app_configuration.bd_wecheck_url,"blank")
    
});

$(document).on("click","div[sp-field-name='sp-button-link-to-hubspot'] input",function(){

    window.open(app_configuration.bd_hubspot_url,"blank")
    
});

$(document).on("click","div[sp-field-name='sp-button-apply-qrm-approval'] input",function(){

    //update qrm approval task
    let get_user_id = parseInt($(this).attr("data-approver-id"));
    let get_task_id = parseInt($(this).attr("data-task-id"));

    if(get_user_id == _spPageContextInfo.userId){
        bd_evaluation_rules.update_qrm_task(get_task_id);
    }else{
        sharepoint_utilities.render_notification
            (
                "Oops",
                "You know you are not the approver for this task - why click it",
                "Warning"
            )
    }
    

    
});

bd_evaluation_rules.update_qrm_task = function(get_task_id){

    sharepoint_utilities.render_notification
        (
            "Approving Task",
            "Approving your task and sending out the notification",
            "Info"
        )
    let meta_package = {
        "TaskStatus":"Approved"
    }
    let update_item = sharepoint_utilities.update_item 
        (
            app_configuration.bd_qrm_approval_tasks,
            app_configuration.site_context,
            meta_package,
            get_task_id
        )

    $.when(update_item)
        .done(function(){

            let notification_meta_package = {
                "Title":"Status Change Notification",
                "ApprovalTaskReferenceId":"-",
                "AssignedToId":0,
                "AssignedToDisplayName":"system defined",
                "NotificationDetails":"-",
                "NotificationType":"status change",
                "NotificationStatus":"Evaluation",
                "FormReferenceId":app_configuration.form_reference_id.toString(),
                "ChangeType":"-"
            }

            action_buttons.create_notification(notification_meta_package);

            setTimeout(() => {
                $("#Left-sticky-menu li[title='Business Development']").click();    
            }, 200);           
    });  
}

bd_evaluation_rules.create_qrm_task = function(approver_id,role_name){

    let meta_package = {
        "Title":"New Approval Task - Business Development - " + main["selected_bd_data"][0].ClientName,
        "Description":"Approval task allocated for Evaluation Phase",
        "AssignedToId":approver_id,
        "TaskStatus":"Pending Approval",
        "ReferenceID":app_configuration.form_reference_id.toString(),
        "SignatureType":role_name, //this is the 
        "Comments":"-",
        "TaskType":"Requires QRM Assistance",
        "ApprovalOrder":"0"
    }

    sharepoint_utilities.save_item
        (
            app_configuration.bd_qrm_approval_tasks,
            app_configuration.site_context,
            meta_package
        ); 
}

bd_evaluation_rules.determine_conclusion = function(responses){

    //check for QRM Approval Tasks  
    let get_qrm_approval_tasks = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "*,AssignedTo/Title&$expand=AssignedTo/Title",
            "ReferenceID eq '"+ app_configuration.form_reference_id.toString() +"'",
            app_configuration.bd_qrm_approval_tasks,
            "Id desc"
        )
    $.when(get_qrm_approval_tasks).
        done(function(item_results){

        let table_html =
        `
            <table>
                <thead>
                <tr>
                    <td>Assigned To</td>
                    <td>Status</td>
                    <td>Modified</td>
                </tr>
                </thead>
                <tbody>
        `

        let check_for_in_progress_tasks = false;
        let current_user_id_requiring_approval = null;
        let task_id = null;
        let has_qrm_approved = false;
        //logic with results
        for (let index = 0; index < item_results.length; index++) {
            const item_row = item_results[index];

            if(item_row.TaskStatus == "Pending Approval"){
                check_for_in_progress_tasks = true;
                current_user_id_requiring_approval = item_row.AssignedToId
                task_id = item_row.Id
            }

            if(item_row.TaskStatus == "Approved"){
                has_qrm_approved = true;
            }

            table_html +=
            `
                <tr>
                    <td>${item_row.AssignedTo.Title}</td>
                    <td>${item_row.TaskStatus}</td>
                    <td>${moment(item_row.Modified).format(app_configuration.display_date_format)}</td>
                </tr>
            `                
        }

        table_html +=
        `
                </body>
            </table>
        `

        $("div[sp-field-name='placeholder-on-qrm-approval-tasks'] div.field-component").html(table_html);
         //if there are tasks
        sharepoint_utilities.hide_fields(["placeholder-on-qrm-approval-tasks"]);
        if(item_results.length > 0 ){
            sharepoint_utilities.show_fields(["placeholder-on-qrm-approval-tasks"]);
        }     


        //sort out the messaging and the calculations
        let result_total = {
            "yes":0,
            "no":0
        }    
    
        let response = "";
        let message =  "";
    
        let evaluation_action_buttons = ["sp-button-approve-and-start-independence","sp-button-mitigating-factors"];
        sharepoint_utilities.hide_fields(evaluation_action_buttons);    
        
    
        for (let index = 0; index < responses.length; index++) {
            const response = responses[index];
            
            if(response == "Yes"){
                result_total.yes += 1
            }else
            if(response == "No"){
                result_total.no += 1
            }
        }
    
        if(result_total.yes == responses.length){
            response = "Authorized to continue";
            message = "You may approve this submission"
            sharepoint_utilities.show_fields(["sp-button-approve-and-start-independence"]);
    
        }else
        if(result_total.no == responses.length){
            response = "Decline and stop process";
            message = "Please decline this submission"
        }else{          
            
            response = "Further considerations are required";
            if(check_for_in_progress_tasks){
             
                           
                sharepoint_utilities.show_fields(["sp-button-apply-qrm-approval"]);
                sharepoint_utilities.hide_fields(["sp-button-mitigating-factors"]);
                $("input[data-sp-element-name='sp-button-apply-qrm-approval']").attr("data-approver-id",current_user_id_requiring_approval);
                $("input[data-sp-element-name='sp-button-apply-qrm-approval']").attr("data-task-id",task_id);

                if(current_user_id_requiring_approval == _spPageContextInfo.userId){
                    message = "As the QRM approver, please use the approval button below to continue with the application"  
                }else{                
                    message = "Only the assigned QRM approver can apply thier approval"    
                }

            }else{
             
                if(!has_qrm_approved){
                    message = "Please involve a QRM representative on this submission using the 'request QRM Assistance' if you wish to continue with this application"
                    sharepoint_utilities.show_fields(["sp-button-mitigating-factors"]);
                    sharepoint_utilities.hide_fields(["sp-button-approve-and-start-independence"]); 
                }else{
                    response = "Further considerations are required and QRM approval has been obtained";
                    sharepoint_utilities.show_fields(["sp-button-approve-and-start-independence"]); 
                }
                

            }
        }
    
        sharepoint_utilities.set_field_description("bd_evaluation_recommendation_header",response + "<br/>" + message);    
        sharepoint_utilities.render_notification
        (
            response,
            message,
            "Info"
        )  
    });
    
}
// Conclusion and Analysis Table
bd_evaluation_rules.render_bd_conclusion_and_analysis_table = function(){

    let field_properties = sharepoint_utilities.get_field_values(["AchieveStrategy" , "ReputationalRisk", "SkillsAndResources", "ProfitMargins", "WinningProbability"]); 


        let table_html =
        `
            <table id='bd-conclusion-and-analysis-table' class=''>
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Question</th>
                        <th>Answer</th>                          
                    </tr>
                </thead>
            <tbody>
        `

            table_html +=            
        `
            <tr>
                <td>1</td>
                <td>Will this client opportunity help us achieve out strategy?</td>
                <td>${field_properties.meta_package.AchieveStrategy}</td>
            </tr>
            <tr>
                <td>2</td>
                <td>Does the client carry any reputational risk?</td>
                <td>${field_properties.meta_package.ReputationalRisk}</td>
            </tr>
            <tr>
                <td>3</td>
                <td>Do we have the skills and available resources to deliver the required services?</td>
                <td>${field_properties.meta_package.SkillsAndResources}</td>
            </tr>
            <tr>
                <td>4</td>
                <td>Is this opportunity capable of being delivered profitably reaching thresholds set for recovery and margins?</td>
                <td>${field_properties.meta_package.ProfitMargins}</td>
            </tr>
            <tr>
                <td>5</td>
                <td>What is the probability of us winning the tender?</td>
                <td>${field_properties.meta_package.WinningProbability}</td>
            </tr>
        `                

        table_html +=
        `
            </tbody>
            </table>
        `

        if(field_properties.IsValid){
            $("div[sp-field-name='bd-conclusion-and-results-table-placeholder']").html(table_html);
            bd_evaluation_rules.determine_conclusion(field_properties.array_of_values); 
        }

             
        
    }