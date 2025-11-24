let my_dashboard_functions = {}

$(document).on("click",".navigation-panel-list-items li[data-link-id='View My Clients']",function(){

    my_dashboard_functions.render_outstanding_client_continuances();
});


$(document).on("click",".navigation-panel-list-items li[data-link-id='My Submissions']",function(){

    my_dashboard_functions.render_my_submissions();
});



$(document).on("click","#my_clients_table .table-action-buttons-cell i",function(){

    my_dashboard_functions.render_actions($(this));
});

$(document).on("click","#my_submissions_table tbody tr td i",function(){

    my_dashboard_functions.trigger_action_buttons($(this));
});

//open up the form associated with this approval
$(document).on("click","#my_tasks_table .bd-approval-task-view, #my_submissions_table .bd-approval-task-view",function(){

    $("#Left-sticky-menu li[title='Business Development']").click();
    bd_business_rules.render_existing_form ($(this).parent().parent().attr("data-itemid"));  

});

//open up the form associated with this approval
$(document).on("click","#my_tasks_table .lockdown-approval-task-view",function(){

   
    $("#Left-sticky-menu li[title='Lockdown']").click();
    let request_meta= {
        "item_id":$(this).parent().parent().attr("data-itemid"),
        "data_source_type":"v2"
    }
    lockdown.render_data_from_email(request_meta)
});


my_dashboard_functions.trigger_action_buttons = function(selected_action){

    let app_name = selected_action.parentsUntil("tr").parent().attr("data-app-name");
    let action_type = selected_action.attr("title");

    switch(app_name){

        case "Lockdown":        
            if(action_type == "View this lockdown"){
                //open up the client-risk assesment menu from the dashboard menu first        
                $("#Left-sticky-menu li[title='Lockdown']").click();             
            }
           
            lockdown.handle_table_action_buttons(selected_action); 

        break;

        case "business development":

        break;

        case "acceptance_continuance":

            if(action_type == "View the current submission"){
                //open up the client-risk assesment menu from the dashboard menu first  
                main["system_click"] = true;
                $("#Left-sticky-menu li[title='Client Acceptance and Continuance']").click();  
            }            
            client_risk_assesments.handle_table_action_buttons(selected_action);    
                    

        break;

    }

}




my_dashboard_functions.render_outstanding_client_continuances = function(){


    //get a list of all clients for this partner
    var get_all_clients = sharepoint_utilities.get_list_items_by_title(
        app_configuration.client_list_site_context, 
        "Id,M_ClientName,Client_x0020_Partner_x0020_Name",
        "Client_x0020_Partner_x0020_Name eq '"+_spPageContextInfo.userDisplayName+"'",
        //"Client_x0020_Partner_x0020_Name eq 'Marc Edelberg'",
        
        app_configuration.client_list_name,
        "Id desc");

    //old archive site
    var get_all_ac_for_partner = sharepoint_utilities.get_list_items_by_title(
        app_configuration.archive_ac_submission_site_context, 
        "Id,Form_x0020_Status,RiskStatus,ClientName,Modified,AcceptanceOrContinuance",
       "EngagementPartnerId eq '"+_spPageContextInfo.userId+"' and Modified ge '"+moment().subtract(1,"year").format("YYYY-MM-DD")+"'",
       //"EngagementPartnerId eq '52' and Modified ge '"+moment().subtract(1,"year").format("YYYY-MM-DD")+"'",
        app_configuration.archive_list_name,
        "Id desc");

    //new site data
    var get_all_ac_for_partner_v2 = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "Id,Form_x0020_Status,RiskStatus,ClientName,Modified,AcceptanceOrContinuance",
       "EngagementPartnerId eq '"+_spPageContextInfo.userId+"'  and Modified ge '"+moment().subtract(1,"year").format("YYYY-MM-DD")+"'",
       //"EngagementPartnerId eq '52'  and Modified ge '"+moment().subtract(1,"year").format("YYYY-MM-DD")+"'",
        "ACSubmissions",
        "Id desc"); 
    

        //get all the data for the partner and merge the data sets to find which ones are outstanding
        $.when(
            get_all_clients,
            get_all_ac_for_partner,
            get_all_ac_for_partner_v2
            )
            
            .done(function(all_client_data,
                all_ac_partner_data,
                get_all_ac_for_partner_v2_data
                ){

            let table_html =
            `   
                <table id='my_clients_table' class="table-dashboard accordion-table table">
                    <thead>                     
                        <th>Client Name <i class="ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th>
                        <th>Client Partner <i class="ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th>
                        <th class="table-submission-date-column">Last Submission <i class="ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th> 
                        <th class="table-status-column">Current Status <i class="ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th>
                        <th class="table-action-buttons-cell">Actions</th>
                    </thead>
                    <tbody>            
            `

            for (let index = 0; index < all_client_data.length; index++) {
                const client_row = all_client_data[index];

                let ac_properties = my_dashboard_functions.get_previous_submissions(client_row.M_ClientName,all_ac_partner_data,get_all_ac_for_partner_v2_data);

                table_html += 
                `
                    <tr>                       
                        <td>${client_row.M_ClientName}</td>
                        <td>${client_row.Client_x0020_Partner_x0020_Name}</td>
                        <td class="table-submission-date-column">${ac_properties.last_submission_date}</td>
                        <td>
                            <div class="table-status-container">
                                <div data-client-class='${ac_properties.current_status}'></div>
                                ${ac_properties.current_status}
                            <div>
                        </td>
                        <td class="table-action-buttons-cell">
                            ${ac_properties.action_buttons}                        
                        </td>
                    </tr>
                `                
            }

            table_html +=
            `   
                    </tbody>
                </table
            `

            $(".page-section").html(table_html);

            $('#my_clients_table').DataTable({
                "pageLength": 10,
                "bLengthChange": true,
                "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "All"] ]
            });

        });

}

my_dashboard_functions.get_previous_submissions = function(current_client_name,all_ac_partner_data,get_all_ac_for_partner_v2){

    let last_submission_date = "";
    let current_status = "Requires Acceptance";
    let record = [];
    let data_source_type = "";
    let action_type = "";

    for (let index = 0; index < all_ac_partner_data.length; index++) {
        const element = all_ac_partner_data[index];

        //if there are no forms found for the client then the default status is set to requires acceptances
        current_status = "Requires Acceptance";  
        //make a mach on the client name
        if(element.ClientName == current_client_name){
            last_submission_date = moment(element.Modified).format("YYYY-MM-DD");            
            
            record = element;
            //check if the last form submitted was this year
            //if there is a form found and it has been completed for this current year
            if(moment(element.Modified).format("YYYY") == moment().format("YYYY") && element.Form_x0020_Status == "Completed"){
                current_status = "Compliant"

            }else
            if(moment(element.Modified).format("YYYY") == moment().format("YYYY") && element.Form_x0020_Status == "Declined"){
                current_status = "Declined"

            }             
            else{
                
                //if there is a form found but its status in not set to completed
                if(element.Form_x0020_Status != "Completed" && element.AcceptanceOrContinuance == "Acceptance"){
                    current_status = "Acceptance In Progress"
                }else
                if(element.Form_x0020_Status != "Completed" && element.AcceptanceOrContinuance == "Continuance"){
                    current_status = "Continuance In Progress"
                }else{
                    current_status = "Requires Continuance"
                }
            }

            data_source_type = "archives"
            action_type = element.AcceptanceOrContinuance;

            break;
        }        
    }

    //auto switch over using the new system
    for (let index_2 = 0; index_2 < get_all_ac_for_partner_v2.length; index_2++) {
        const element = get_all_ac_for_partner_v2[index_2];

        current_status = "Requires Acceptance";

        if(element.ClientName == current_client_name){
            last_submission_date = moment(element.Modified).format("YYYY-MM-DD");
            
            //check if the last form submitted was this year
            //if there is a form found and it has been completed for this current year
            if(moment(element.Modified).format("YYYY") == moment().format("YYYY") && element.Form_x0020_Status == "Completed"){
                current_status = "Compliant"

            }else
            if(moment(element.Modified).format("YYYY") == moment().format("YYYY") && element.Form_x0020_Status == "Declined"){
                current_status = "Declined"

            }        
            
            else{
                
                //if there is a form found but its status in not set to completed
                if(element.Form_x0020_Status != "Completed" && element.AcceptanceOrContinuance == "Acceptance"){
                    current_status = "Acceptance In Progress"
                }else
                if(element.Form_x0020_Status != "Completed" && element.AcceptanceOrContinuance == "Continuance"){
                    current_status = "Continuance In Progress"
                }else{
                    current_status = "Requires Continuance"
                }
            }             

            data_source_type = "latest";
            action_type = element.AcceptanceOrContinuance;

            break;
        }        
    }

    //determine the action icons to show
    let action_buttons = my_dashboard_functions.render_action_buttons(action_type,data_source_type,record,current_status)

    return {
        "current_status":current_status,
        "last_submission_date":last_submission_date,
        "selected_record":record,
        "action_buttons":action_buttons
    }

}

my_dashboard_functions.render_action_buttons = function(action_type,data_source_type,record,current_status){

    let field_properties =
    `
        data-action-type='${action_type}' 
        data-source-type='${data_source_type}'
        data-itemid='${record["Id"]}'  
        data-service-type='${record["ClientAcceptanceType"]}' 
        data-ac-lite='${record["ACLiteVersion"]}'
    `
    
    //determine the action icons to show
    let action_buttons = "";
    switch(current_status){

        case "Compliant":
            action_buttons =   
            `
                <i title='Download the pdf' class='menu-icon ms-Icon ms-Icon--CloudDownload table-action-button' 
                    ${field_properties}
                    data-form-status='existing'                         
                    >
                </i>
            `        
        break;    

        case "Declined":
            action_buttons = `<i title='View the current submission' class='menu-icon ms-Icon ms-Icon--View table-action-button' 
                ${field_properties}
                data-form-status='existing'             
            >
            </i>`
        break;
        
        case "Continuance In Progress":
            action_buttons = `<i title='View the current submission' class='menu-icon ms-Icon ms-Icon--View table-action-button' 
                ${field_properties}  
                data-form-status='existing'            
            >
            </i>`
        break;

        case "Acceptance In Progress":
            action_buttons = `<i title='View the current submission' class='menu-icon ms-Icon ms-Icon--View table-action-button' 
                ${field_properties}
                data-form-status='existing'              
            >
            </i>`
        break;

        case "Requires Acceptance":
            action_buttons = `
            <i title='Submit an acceptance for this client' class='menu-icon ms-Icon ms-Icon--NewFolder table-action-button' 
                data-action-type='acceptance' 
                data-source-type='latest'
                data-itemid='0'
                data-form-status='new'       
            >
            </i>`
        break;

        case "Requires Continuance":
            action_buttons = `
            <i title='Submit a continuance for this client' class='menu-icon ms-Icon ms-Icon--NewFolder table-action-button' 
                data-action-type='continuance' 
                data-source-type='latest'
                data-itemid='${record["Id"]}'
                data-form-status='new'       
            >
            </i>`
        break;

      
    }

    return action_buttons
}

my_dashboard_functions.render_actions = function(action_element){

    let item_id = parseInt(action_element.attr("data-itemid"));
    let action_type = action_element.attr("data-action-type");
    let data_source_type = action_element.attr("data-source-type");
 
    if(data_source_type == "archives"){     

        //redirect user to the old site to complete it there first.
        let archive_site_url = app_configuration.ac_archive_link_url +"/EditForm.aspx?ID="+submission_data.item_id+
        "&Source="+app_configuration.mazars_intranet;
        
        window.open(archive_site_url,"_blank");

    }else{    

        let submission_data = {
            "item_id":item_id,
            "action_type":action_type,
            "data_source_type":action_element.attr("data-source-type"),
            "form_type":action_type,
            "form_status":action_element.attr("data-form-status")
        }     
    
        //open up the client-risk assesment menu        
        $("li[title='Client Acceptance and Continuance']").click();
        $(".assesment-drop-down-container").addClass("hide");

        setTimeout(function(){
            if(action_type.toLowerCase() == "acceptance"){
                    client_risk_assesments.render_acceptance_form_html(submission_data); 
            }else{
                    client_risk_assesments.render_continuance_form_html(submission_data); 
            } 
          
        },1500);          
    }
}

my_dashboard_functions.render_my_submissions = function(){

    //new site data
    var get_all_ac_for_current_user = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "Id,Form_x0020_Status,RiskStatus,ClientName,Modified,AcceptanceOrContinuance,ClientAcceptanceType,ACLiteVersion",
        "AuthorId eq '"+_spPageContextInfo.userId+"'",
        "ACSubmissions",
        "Id desc");

    //get all bd client requests based on the client name    
    let get_bd_client_submissions = sharepoint_utilities.get_list_items_by_title
      (
          app_configuration.site_context, 
          "*,Author/Title&$expand=Author/Title",
          "substringof(';"+_spPageContextInfo.userId+";',RoleReferenceId) and SystemStatus eq 'Open'",
          app_configuration.bd_initiation,
          "ClientName desc"
      )

    let get_lockdown_submissions = sharepoint_utilities.get_list_items_by_title
    (
        app_configuration.site_context, 
        "*,Author/Title&$expand=Author/Title",
        "AuthorId eq '"+_spPageContextInfo.userId+"' and FormStatus ne 'Cancelled' and FormStatus ne 'Complete'",
        app_configuration.lockdown_list_name,
        "ClientName desc"
    )


    //get all the data for the partner and merge the data sets to find which ones are outstanding
    $.when(
        get_all_ac_for_current_user,
        get_bd_client_submissions,
        get_lockdown_submissions)
        .done(function(
            current_user_data,
            get_bd_client_submissions_data,
            get_lockdown_submission_data){

        let table_html =
        `   
            <table id='my_submissions_table' class="table-dashboard accordion-table table">
                <thead>             
                    <th>Client Name <i class="ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th>             
                    <th class="table-submission-date-column">Last Submission <i class="ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th> 
                    <th class="table-status-column">Type<i class="ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th>
                    <th class="table-status-column">Current Status <i class="ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th>
                    <th>Actions</th>
                </thead>
                <tbody>            
                    ${render_html_row(current_user_data,"acceptance_continuance")}
                    ${render_html_row(get_bd_client_submissions_data,"business development")}    
                    ${render_html_row(get_lockdown_submission_data,"Lockdown")}            
                </tbody>
            </table>
        `

        $(".page-section").html(table_html);

        $('#my_submissions_table').DataTable({
            "pageLength": 10,
            "bLengthChange": true,
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "All"] ]
        });

    });

    function render_html_row(data_set,data_source_type){

        let table_html = "";
        let submission_type = "";
        let field_properties = "";
        let action_buttons ="";
        let form_status = "";
        let reference_number = "";

        for (let index = 0; index < data_set.length; index++) {
            const current_row = data_set[index];        


            switch(data_source_type){

                case "Lockdown":

                    action_buttons = lockdown.determine_action_buttons(current_row)
                   
                    submission_type = data_source_type;
                    form_status = current_row.FormStatus;
                    reference_number = "LDR"+current_row.Id

                break;

                case "acceptance_continuance":

                    action_buttons = client_risk_assesments.render_action_buttons(current_row["AcceptanceOrContinuance"],"current",current_row)                  

                    form_status = current_row.Form_x0020_Status;
                    submission_type = determine_if_continuance_lite(current_row["ACLiteVersion"], current_row.AcceptanceOrContinuance)
                    reference_number = "CRA"+current_row.Id

                break;

                case "business development":

                    action_buttons = 
                    `
                        <i title='View the current submission' class='menu-icon ms-Icon ms-Icon--View table-action-button bd-approval-task-view'></i>
                    `
                    submission_type = "Business Development";
                    form_status = current_row.SubmissionStatus;
                    reference_number = "BD"+current_row.Id
                break;
            }


           
            table_html += 
            `
                <tr data-itemid='${current_row.Id}' data-app-name='${data_source_type}'>                   
                    <td>${current_row.ClientName}</td>         
                    <td class="table-submission-date-column" data-sort='${moment(current_row.Modified).format("x")}'>${moment(current_row.Modified).format(app_configuration.display_date_format)}</td>
                    <td>${submission_type} <br/> ${reference_number}</td>
                    <td>
                        <div class="table-status-container">
                            <div data-client-class='${form_status}'></div>
                            ${form_status}
                        <div>
                    </td>
                    <td class="table-action-buttons-cell">
                        ${action_buttons}                        
                    </td>
                </tr>
            `                
        }

        return table_html
    }

    function determine_if_continuance_lite(ac_lite_status, AcceptanceOrContinuance){

        let status_type = AcceptanceOrContinuance

        if(ac_lite_status == "yes"){
            status_type = "Continuance Lite"
        }

        return status_type
}
}



