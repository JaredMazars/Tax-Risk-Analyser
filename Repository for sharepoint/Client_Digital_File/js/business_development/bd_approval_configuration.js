let bd_approval_configuration = {}

// Approvals - display approvers table
$(document).on("click","ul[data-app-name='Business Development'] li[data-link-id='Approvals']",function(){

    bd_approval_configuration.render_approval_tasks();

});


bd_approval_configuration.decline_application = function(clicked_button){

    //approves the current section and opens up the next section
    let get_button_action = clicked_button.attr("data-sp-element-name");  

    let field_properties = sharepoint_utilities.get_field_values(["AddConcludingComments","ApprovalComments"]).meta_package;
    let get_approval_properties = bd_approval_configuration.get_next_approver_details("declined");  
    let declined_status = get_approval_properties.current_task_details.TaskType
    let decline_reason = "";

    if(get_approval_properties.is_approver){

        switch(get_button_action){            
            
            case "sp-button-decline-evaluation":          
                decline_reason = field_properties["AddConcludingComments"];         
            break;
            case "sp-button-decline-independence-acceptance":        
                decline_reason = field_properties["ApprovalComments"]  
            break;      
        }  

        let meta_package = {
            "SubmissionStatus":"Declined",
            "SystemStatus":"Closed"
        }  
        
        notification_meta_package = {
            "Title":"Form Application Declined",
            "ApprovalTaskReferenceId":get_approval_properties.current_task_details.Id.toString(),
            "AssignedToId":0,
            "AssignedToDisplayName":"system defined",
            "NotificationDetails":decline_reason,
            "NotificationType":"Form Declined",
            "NotificationStatus":declined_status + " declined",
            "FormReferenceId":app_configuration.form_reference_id,
            "ChangeType":"-"
        }

    

        if(decline_reason.length > 10){

            

            sharepoint_utilities.render_notification
            (
                "Declining your approval",
                "Please wait while we submit your reason and send out the relevant notifications.",
                "Info"
            )

            //update the comments box
            let section_name = $("ul[data-app-name='Business Development']").find("li.currently-open").attr("data-link-id");  
            action_buttons.update_existing_submission(section_name)

            let update_item = sharepoint_utilities.update_item 
                (
                    app_configuration.bd_initiation,
                    app_configuration.site_context,
                    meta_package,
                    parseInt(app_configuration.form_reference_id)
                )    
            //updates the current task status
            let update_current_task = sharepoint_utilities.update_item 
            (
                app_configuration.bd_approval_tasks,
                app_configuration.site_context,
                {"TaskStatus":"Declined"},
                parseInt(get_approval_properties.current_task_details.Id)
            )    

            $.when(update_item,update_current_task)
                .done(function(){        

                    action_buttons.create_notification(notification_meta_package);                     
            }); 
        }else{
            sharepoint_utilities.render_notification
                (
                    "Declining Application",
                    "Please ensure you have a substantial reason why you are declining this request under the comments section",
                    "Warning"
                )
        }   
    }else{
        sharepoint_utilities.render_notification
        (
            "Unauthorized",
            "You are not designed to decline this application section.",
            "Warning"
        )
    }
    
}

bd_approval_configuration.approve_application = function(clicked_button){  
   
    let get_approval_properties = bd_approval_configuration.get_next_approver_details("approved");   

    let validation = true;
    //validate acceptance documentation
    switch(clicked_button.attr("data-sp-element-name")){

        case "sp-button-approve-and-start-completion":
            //validation on the accpetance approval button
            validation = bd_independance_rules.validate_uploaded_documents();
        break;
    }

    if(get_approval_properties.is_approver == true){

        if(validation == true){

            sharepoint_utilities.render_notification
            (
                "Applying your approval",
                "Please wait while we submit your approval and send out the relevant notifications.",
                "Info"
            )

            let meta_package = {
                "SubmissionStatus":get_approval_properties.next_approver_details.TaskType,
                "SystemStatus":"Open"
            }

            if(get_approval_properties.approval_completed){
                meta_package.SystemStatus = "Closed";
            }
        
            notification_meta_package = {
                "Title":"Form process change notification",
                "ApprovalTaskReferenceId":get_approval_properties.next_approver_details.Id.toString(),
                "AssignedToId":get_approval_properties.next_approver_details.AssignedToId,
                "AssignedToDisplayName":"system defined",
                "NotificationDetails":"-",
                "NotificationType":"Form Approved",
                "NotificationStatus":get_approval_properties.next_approver_details.TaskType,
                "FormReferenceId":app_configuration.form_reference_id,
                "ChangeType":"-"
            }

            //updates the current submission status
            let update_item = sharepoint_utilities.update_item 
                (
                    app_configuration.bd_initiation,
                    app_configuration.site_context,
                    meta_package,
                    parseInt(app_configuration.form_reference_id)
                )

            //updates the current task status
            let update_current_task = sharepoint_utilities.update_item 
                (
                    app_configuration.bd_approval_tasks,
                    app_configuration.site_context,
                    {"TaskStatus":"Approved"},
                    parseInt(get_approval_properties.current_task_details.Id)
                )  

            let set_next_task_to_pending = sharepoint_utilities.update_item 
                    (
                        app_configuration.bd_approval_tasks,
                        app_configuration.site_context,
                        {"TaskStatus":"Pending Approval"},
                        get_approval_properties.next_approver_details.Id
                    )   
            $.when(update_item,update_current_task,set_next_task_to_pending)
                .done(function(){   
                
                    action_buttons.create_notification(notification_meta_package);            
                    $("#Left-sticky-menu li[title='Business Development']").click();
                    
            });
        }else{
            sharepoint_utilities.render_notification
            (
                "Documents Required",
                "Please ensure all the required documents are required to be uploaded before proceeding to approve",
                "Warning"
            )      
        } 
    }else{
        sharepoint_utilities.render_notification
        (
            "Unauthorized",
            "You are not designed to approve this application section. <br/>"+
            "Approval from " + get_approval_properties.current_task_details.AssignedTo.Title + " is required",
            "Warning"
        )
    }

}

bd_approval_configuration.get_next_approver_details = function(approval_status){

    let next_approver_details = {}
    let current_task_details = {}
    let declined_approver_details = {};
    let approval_completed = false;
    let is_approver = false;
    let next_approver_is_found = false;

    //search the list for the pending task
    let approval_task_cube =  app_configuration["bd_approval_tasks_data"];
    let approval_count = 0;

    for (let index = 0; index < approval_task_cube.length; index++) {
        const approval_row = approval_task_cube[index];

        //check if the current task being approved is the logged in user
        if(approval_row.TaskStatus == "Pending Approval"){
            
            if(approval_row.AssignedToId == _spPageContextInfo.userId){
                is_approver = true;
            }
           
            current_task_details = approval_row
        }

         //check for the next task in line that is in progress       
        if(approval_row.TaskStatus == "Waiting" && next_approver_is_found == false){

            approval_count += 1;
            next_approver_details = approval_row;
            next_approver_is_found = true;          
        }

        if(approval_status == "declined" && approval_row.TaskType == "Pending Approval"){

            approval_count += 1;
            declined_approver_details = approval_row;            
        }
    }
     //if not then the form is completed
    if(approval_count == 0){
        //approval is completed
        approval_completed = true;      
        next_approver_details = {
            "TaskType":"Approved",
            "AssignedToId":0,
            "Id":"-"
        } 
    }   

    return {
        "next_approver_details":next_approver_details,
        "declined_approver_details":declined_approver_details,
        "current_task_details":current_task_details,
        "approval_completed":approval_completed,
        "is_approver":is_approver
    }

}

bd_approval_configuration.render_approval_tasks = function(){

    var get_bd_approval_tasks = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "*,AssignedTo/Title&$expand=AssignedTo/Title",
        "ReferenceID eq '"+main["selected_bd_data"][0].Id+"'",
        app_configuration.bd_approval_tasks, 
        "ApprovalOrder asc");	

    var approval_html = 
    `
        <table id='bd-approver-table-overview' class="table-dashboard accordian-table table dataTable no-footer" style='width:100%;'>
            <thead>
                <th>Reference</td>  
                <th>Assigned To</th>                  
                <th>Created</th>           
                <th>Status</th>             
            </thead>
        <tbody>
    `

    $.when(get_bd_approval_tasks).done(function(get_bd_approval_tasks_results){
    
        app_configuration["bd_approval_tasks_data"] = get_bd_approval_tasks_results;

        for (let index = 0; index < get_bd_approval_tasks_results.length; index++) {
            const task_row = get_bd_approval_tasks_results[index];
          
            
            approval_html +=             
            `
                <tr class='ApprovalTableRows' 
                    data-itemid='${task_row["ID"]}'
                    data-item-status='${task_row["TaskStatus"]}'    
                >
                    <td>${task_row.TaskType}</td>  
                    <td>${task_row.AssignedTo.Title}</td>             
                    <td>${moment(task_row.Created).format("DD/MM/YYYY")}</td>
                    <td>
                        <div class="table-status-container">
							<div data-bd-approval-class='${task_row.TaskStatus}'></div>
							${task_row.TaskStatus}
						</div>
                    </td>
                </tr>
            `
        }


        
        $("div[sp-field-name='temp-bd-approval-table']").html(approval_html);
        $("#bd-approver-table-overview").DataTable({       
            "bLengthChange": false,
            "order": [],
            "searching":false,
            "paging": false,
            "info": false
        });
        

    });
}

bd_approval_configuration.create_approval_tasks = async function(role_approver_details){

     let field_properties = sharepoint_utilities.get_field_values(["ClientName"]).meta_package;     
    

    sharepoint_utilities.render_notification
    (
        "Approval Tasks",
        "Finalizing approvals and creating approval tasks where necessary",
        "Info"
    )

    let list_of_updates = [];
   //creates the approval tasks where the role type is approver   
    let list_of_sections_to_approve = ["Internally Captured Details","Allocation","Evaluation","Independence"]

    if(role_approver_details.length > 0){

        let role_approvers = role_approver_details;
        let approval_order = 0;

        for (let section_index = 0; section_index < list_of_sections_to_approve.length; section_index++) {
            const approval_section_name = list_of_sections_to_approve[section_index];

            let found_first_approver = false;
            
            for (let index = 0; index < role_approvers.length; index++) {
                const role_aprover = role_approvers[index];

                //if this is an approver role            
                if(role_aprover.role_permission_id == 1){              

                    let must_create_task = true;
                    let approval_status = "Waiting";
                    
                     //for the internally captured details only one approver is required
                     //if this is the first task of the role approvers set
                    if(approval_section_name == "Internally Captured Details" && section_index == 0 && found_first_approver == false){                   
                        approval_status = "Pending Approval"
                        found_first_approver = true;
                    }else    
                    if(approval_section_name == "Internally Captured Details"){
                        must_create_task = false;
                    }

                    approval_order += 1;
                    let meta_package = {
                        "Title":"New Approval Task - Business Development - " + field_properties["ClientName"],
                        "Description":"Approval task allocated for " + approval_section_name,
                        "AssignedToId":role_aprover.user_id,
                        "TaskStatus":approval_status,
                        "ReferenceID":app_configuration.form_reference_id.toString(),
                        "SignatureType":role_aprover.role_name, //this is the 
                        "Comments":"-",
                        "TaskType":approval_section_name,
                        "ApprovalOrder":approval_order.toString()
                    }

                   
                    if(must_create_task){
                        list_of_updates.push(sharepoint_utilities.save_item
                        (
                            app_configuration.bd_approval_tasks,
                            app_configuration.site_context,
                            meta_package
                        )); 
                    }
                }              
            }
        }

        //once all the deletes have been made
        const finalized_async_updates = await Promise.all(list_of_updates);           
    } 
}
