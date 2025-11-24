let my_tasks_functions = {}


$(document).on("click",".navigation-panel-list-items li[data-link-id='My Approval Tasks']",function(){

    my_tasks_functions.render_my_approval_tasks();
});

$(document).on("click","div[app-name='View dashboard'] #my_tasks_table .view-table-action-button",function(){

    my_dashboard_functions.render_actions($(this))
});


my_tasks_functions.render_my_approval_tasks = function(){

    let current_logged_in_user = _spPageContextInfo.userId;

    //for testing
    //current_logged_in_user = 52

    var get_archive_approval_tasks = sharepoint_utilities.get_list_items_by_title(
        app_configuration.archive_ac_submission_site_context, 
        "Title,Created,ReferenceID,TaskStatus",
        "AssignedToId eq '"+current_logged_in_user+"' and TaskStatus eq 'In Progress'",
        "Approval TasksVAL",
        "Id desc");

    var get_ac_approval_tasks = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "Title,Created,ReferenceID,TaskStatus",
        "AssignedToId eq '"+current_logged_in_user+"' and TaskStatus eq 'In Progress'",
        "Approval Tasks", 
        "ApprovalOrder asc");	
    
    var get_bd_approval_tasks = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "*,AssignedTo/Title&$expand=AssignedTo/Title",
        "AssignedToId eq '" + current_logged_in_user + "' and TaskStatus eq 'Pending Approval'",
        app_configuration.bd_approval_tasks, 
        "ApprovalOrder asc");	

    var get_lockdown_partner_approval_tasks = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "*,AssignedTo/Title&$expand=AssignedTo/Title",
        "AssignedToId eq '" + current_logged_in_user + "' and TaskStatus eq 'Not Started' and TaskType eq 'Partner Approval'",
        app_configuration.lockdown_task_list, 
        "ApprovalOrder asc");	

    var get_lockdown_qrm_approval_tasks = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "*,AssignedTo/Title&$expand=AssignedTo/Title",
        " substringof('"+_spPageContextInfo.userEmail +"',TeamAssignedToEmails) and TaskStatus eq 'Not Started' and TaskType eq 'QRM Approval'",
        app_configuration.lockdown_task_list, 
        "ApprovalOrder asc");	

    var approval_html = 
    `
        <table id='my_tasks_table' class="table-dashboard accordian-table table dataTable no-footer" style='width:100%;'>
            <thead>
                <th>Reference</td>                    
                <th>Created</th>           
                <th>Status</th>
                <th>Action</th>
            </thead>
        <tbody>
    `

    $.when(
        get_archive_approval_tasks,
        get_ac_approval_tasks,
        get_bd_approval_tasks,
        get_lockdown_partner_approval_tasks,
        get_lockdown_qrm_approval_tasks
        ).done(
            function(
                archive_task_data,
                current_approval_task_data,
                bd_approval_task_data,
                lockdown_partner_task_data,
                lockdown_qrm_task_data
            ){	
    
       approval_html += render_html_row(archive_task_data,"ac_archives");
       approval_html += render_html_row(current_approval_task_data,"ac_current");
       approval_html += render_html_row(bd_approval_task_data,"bd_tasks");

       approval_html += render_html_row(lockdown_partner_task_data,"lockdown_tasks");
       approval_html += render_html_row(lockdown_qrm_task_data,"lockdown_tasks");
                            
        approval_html += 
        `
            </tbody>
            </table>
        `      

        $("div[app-name='View dashboard']").html(approval_html);
        
        $("#my_tasks_table").DataTable({       
            "bLengthChange": false,
            "order": [],
            "searching":false,
            "paging": false,
            "info": false
        });
        
    });	
  

    function render_html_row(row_results,data_source_type){

        let approval_html = "";

        for (let index = 0; index < row_results.length; index++) {
            const row_record = row_results[index];                  
          
            approval_html +=             
            `
                <tr class='ApprovalTableRows'
                    data-itemid='${row_record["ReferenceID"]}'
                >
                    <td style='width:55%;'>${row_record.Title} (${row_record.ReferenceID})</td>             
                    <td data-sort='${moment(row_record.Created).format("x")}'>${moment(row_record.Created).format("DD/MM/YYYY")}</td>
                    <td>
                        <div class="table-status-container">
							<div data-client-class='${row_record.TaskStatus}'></div>
							${row_record.TaskStatus}
						</div>
                    </td>
                    <td>                    
                        ${render_action_buttons(row_record,data_source_type)}                       
                    </td>
                </tr>
            `;             
        }			

        return approval_html
    }

    function render_action_buttons(row_record,data_source_type){

        let action_button_html = "";

        //acceptance checks
        let acceptance_or_continuance_check = "acceptance";
        if(row_record.Title.toLowerCase().indexOf("continuance") >= 0){
            acceptance_or_continuance_check = "continuance";
        }

        switch(data_source_type){

            case "lockdown_tasks":
                action_button_html = 
                `
                    <i title='Approve this request' class='menu-icon ms-Icon table-action-button ms-Icon--View lockdown-approval-task-view'></i>&nbsp;&nbsp; 
                `
            break;

            case "bd_tasks":
                action_button_html = 
                `
                    <i title='Approve this request' class='menu-icon ms-Icon table-action-button ms-Icon--View bd-approval-task-view'></i>&nbsp;&nbsp; 
                `
            break;

            case "ac_archives":                

                action_button_html = 
                `
                    <i title='View this request' class='menu-icon ms-Icon ms-Icon--View view-table-action-button table-action-button'
                    data-itemid='${row_record["ReferenceID"]}'
                    data-action-type='${acceptance_or_continuance_check}' 
                    data-source-type='${data_source_type.split("ac_")[1]}'                        
                    data-form-status='existing'                           
                    >                            
                    </i>&nbsp;&nbsp; 
                `

            break;

            case "ac_current":

                action_button_html = 
                `
                    <i title='View this request' class='menu-icon ms-Icon ms-Icon--View view-table-action-button table-action-button'
                    data-itemid='${row_record["ReferenceID"]}'
                    data-action-type='${acceptance_or_continuance_check}' 
                    data-source-type='${data_source_type.split("ac_")[1]}'                        
                    data-form-status='existing'                           
                    >                            
                    </i>&nbsp;&nbsp; 
                `
            break;
        }

       

        return action_button_html

    }
}
