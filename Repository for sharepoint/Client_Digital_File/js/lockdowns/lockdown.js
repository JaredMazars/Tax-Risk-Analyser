let lockdown = {}

$(document).on("click","#Left-sticky-menu li[title='Lockdown']",function(){
    
	$(".header-right-container-container").html("");
    main["selected_lockdown_data"] = [];    	
});


$(document).on("click","div[app-name='Lockdown'] input[data-sp-element-name='create-new-lockdown-form']",function(){

    lockdown.create_new_record(lockdown_fields_configuration.planning,$(".lockdown-planning-section"));
});


$(document).on("click","ul[data-app-name='Lockdown'] li[data-link-id='Submit a new lockdown']",function(){
    //reset the form data
    $("ul[data-app-name='Lockdown']").addClass("disable-interaction");
    lockdown.render_selected_form(main["selected_lockdown_data"]);
});


$(document).on("click","div[app-name='Lockdown'] input[data-sp-element-name='qrm-country-risk-manager-approval-button']",function(){
  
    lockdown.approval_unlock_file();
});




$(document).on("change",".lockdown-drop-down-container div[sp-field-name='temp-lockdown-search'] select",function(){

    lockdown.render_lockdown_history($(this).val());
});

$(document).on("change","div[form-navigation-target='Initiation of Lockdown'] select[data-sp-element-name='ClientName']",function(){
    lockdown.get_client_code($(this).val());
    client_risk_assesments.render_task_code_component($(this).val(),"TaskCode");
});

$(document).on("change","div[form-navigation-target='Date & Details Finalisation'] input[data-sp-element-name='EngagementLevel']",function(){   

    lockdown.engagement_level_rules($(this).val());
});

$(document).on("change","div[form-navigation-target='Initiation of Lockdown'] input[data-sp-element-name='YearEndEngagement']",function(){   

    lockdown.validation_of_year_end_date();

});

$(document).on("change","div[form-navigation-target='Initiation of Lockdown'] input[data-sp-element-name='ExpectedSigningDate']",function(){   

    lockdown.auto_populate_dates();

});



$(document).on("change","div[form-navigation-target='Date & Details Finalisation'] input[data-sp-element-name='IsPIE']",function(){   

    if($(this).val() == "Yes"){
        sharepoint_utilities.show_fields(["TypeOfPublicInterestEntity"])
    }else{

        sharepoint_utilities.hide_fields(["TypeOfPublicInterestEntity"])
        sharepoint_utilities.set_select_2_fields_by_text("N/A",$("select[data-sp-element-name='TypeOfPublicInterestEntity']"));
    }
});

$(document).on("change","div[form-navigation-target='Date & Details Finalisation'] input[data-sp-element-name='EQRPerformed']",function(){   

    if($(this).val() == "Yes"){
        sharepoint_utilities.show_fields(["EQRReviewerId"]);
    }else{
        sharepoint_utilities.hide_fields(["EQRReviewerId"]);   
        sharepoint_utilities.set_select_2_fields("N/A","0",$("select[data-sp-element-name='EQRReviewerId']"));    
    }
});


$(document).on("click","div[app-name='Lockdown'] #my_lockdown_table tbody tr td i",function(){

    lockdown.handle_table_action_buttons($(this))
       
});

lockdown.handle_table_action_buttons = function(action_element){

    let request_meta = {
        "item_id":action_element.attr("data-itemid"),
        "data_source_type":action_element.attr("data-source-type")
    }

    setTimeout(function(){
        switch(action_element.attr("title")){

            case "Cancel this lockdown":
                //if the status is Waiting on QRM 
                let lockdown_status = action_element.attr("data-task-status");
                switch(lockdown_status){
                    case "Waiting on QRM Completion":
                        let qrm_admin_check = sharepoint_utilities.check_user_group("QRMITAdmins",app_configuration.site_context);
                        $.when(qrm_admin_check).done(function(is_valid){
                            if(is_valid){
                                lockdown.remove_request(request_meta.item_id)
                            }else{
                                sharepoint_utilities.render_notification
                                    (
                                        "Cancellation of lockdown",
                                        "Only the QRM IT ADMINS can cancel this request",
                                        "Warning"
                                    )
                            }
                        });
                    
                    break;

                    default:
                        lockdown.remove_request(request_meta.item_id)
                    break;
                } 

            break;

            case "View this lockdown":              
                lockdown.render_actions(request_meta);
            break;

            case "Request to unlock file":               
            
                lockdown.request_unlock_approval(request_meta) 
            break;

        }
    },500)
}



$(document).on("click","#Left-sticky-menu li[title='Lockdown']",function(){

    setTimeout(function(){
        lockdown.render_lockdown_search();
    },500);   
});


$(document).on("click","div[app-name='Lockdown'] input[data-sp-element-name='btn-lockdown-generate key']",function(){
        lockdown.generate_key();
});

$(document).on("click","div[app-name='Lockdown'] input[title~='Next']",function(){
    //button to create a new acceptance
    lockdown.go_to_next_section();  
});

$(document).on("click","div[app-name='Lockdown'] input[title='Back']",function(){
    //button to create a new acceptance
    lockdown.go_back_to_section();   
});

$(document).on("click", "ul[data-app-name='Lockdown'] li", function(){

    let get_section_name = $(this).attr("data-link-id");
    lockdown.show_section(get_section_name)
});

$(document).on("click", "ul[data-app-name='Lockdown'] li[data-link-id='Approval History']", function(){

    lockdown.render_approval_history();
});


//--------- all notifications-------------

$(document).on("click","div[app-name='Lockdown'] input[data-sp-element-name='submit-for_approval']",function(){
    //button to create a new acceptance
    lockdown.send_for_approval();
});

$(document).on("click","div[app-name='Lockdown'] input[data-sp-element-name='approve-lockdown-details']",function(){
    //button to create a new acceptance
    lockdown.partner_approval(); 
});


$(document).on("click","div[app-name='Lockdown'] input[data-sp-element-name='qrm-approval-button']",function(){

    lockdown.complete_lockdown();
});


lockdown.show_section = function(section_name){
    //hide all sections
    $(".page-section-form-container").addClass("hide"); 
    //display section based on name
    $("#field_section_container div[form-navigation-target='"+section_name+"']").removeClass("hide");
}



lockdown.auto_populate_dates = function(){

    let get_field_properties = sharepoint_utilities.get_field_values(["ExpectedSigningDate"])

    if(get_field_properties.IsValid){

        var signing_date = get_field_properties.meta_package["ExpectedSigningDate"];


        var AssemblyDate = moment(signing_date).add(60,"days").format(app_configuration.display_date_format);
        var kpi_deadline_date = moment(signing_date).add(45,"days").format(app_configuration.display_date_format);


        //calculate assembly date
        var AssstartDate = moment(signing_date,app_configuration.date_format);
        var AssendDate = moment(AssemblyDate,app_configuration.date_format);

        var Assresult = "Assembly and lockdown deadline as per paragraph 3(b) & 3(c) of policy ("+ AssendDate.diff(AssstartDate, 'days') +" days)";

        sharepoint_utilities.set_field_value("AssemblyDeadline",AssemblyDate)
        sharepoint_utilities.set_field_value("MazarsKPIDeadline",kpi_deadline_date);	
    }

}

lockdown.request_unlock_approval = function(request_meta){

    let item_id = parseInt(request_meta.item_id)    
    let data_source_type = request_meta.data_source_type;

    let box_button_options = {
        "Yes":function(){
            continue_to_unlock();
            return false
        },
        "No":function(){
            
        }
    }
    
    let unlock_reason = [{
        "Title": "Reason",
        "Description": "Please add your reason",
        "sp_field_name": "QRMUnlockReason",
        "sp_field_type": "textarea",
        "field_width": "half-width",
        "field_validate": true,
        "sp_additional_properties":"",                  
              
    }] 

    let container_html = 
    `
        <div>
            <p>Are you sure you want to cancel this request - you will loose all access to this item?</p> 
            <div id='unlock-reason-details'></div>          
        </div>
    `
    
    sharepoint_utilities.render_confirmation_box(
        "Unlocking of lockdown record",
        container_html,
        box_button_options,
    "30%");

    setTimeout(function(){
        //call the specific fields in the cube and render them in the sections above
        //this renders all the fields inside the container
        $("#unlock-reason-details").html(
            sharepoint_utilities.create_container_form(
                unlock_reason,//cube fields json
                "unlock-details-form-fields" //class to identify
            )
        );           
    },500)   

    function continue_to_unlock(){
       
        let field_properties = sharepoint_utilities.get_field_values(["QRMUnlockReason"]); 
                 
        if(field_properties.IsValid){

            sharepoint_utilities.render_notification("Unlocking Record","Please wait while we send your request for approval to the country risk manager","Info");
            let meta_package = {
                "FormStatus":"Waiting on Unlock Approval",                
                "QRMUnlockReason":field_properties.meta_package["QRMUnlockReason"]
            }
            let update_item = sharepoint_utilities.update_item 
            (
                app_configuration.lockdown_list_name,
                app_configuration.site_context,
                meta_package,
                item_id
            )          
           
            $.when(update_item)
            .done(function(){
                setTimeout(function(){
                    lockdown.create_notification(0,"Set by workflow","Unlock Approval Requested",item_id);
      
                    lockdown.render_lockdown_history($("select[title='Search for your lockdowns via Client Name']").val());
                    sharepoint_utilities.close_container_window($(".confirmation-box_content-title"))
                },1000);            
            });
        }else{
            sharepoint_utilities.render_notification
                (
                    "Unlocking of lockdown request",
                    "Please add your reason first",
                    "Warning"
                )
        }
    }
 
   
}

lockdown.approval_unlock_file = function(){

    let get_field_values = sharepoint_utilities.create_meta_package($("div[form-navigation-target='Unlock File Approval']"));
     
    if(get_field_values.IsValid){    

         $.when(lockdown.set_task_to_approved("Country Risk Manager")).done(function(response){
            if(response == "success"){
                sharepoint_utilities.set_field_value("FormStatus","Unlocked with Approval");   
                lockdown.update_current_section_data();
                
                lockdown.create_notification(0,"Set by workflow","Unlock Approval Complete",main["selected_lockdown_data"][0].Id);
                $("#Left-sticky-menu li[title='Lockdown']").click();  
            }
         });

       
        
    }else{
        sharepoint_utilities.render_notification("Cannot complete approval","Please complete the following fields first: " + get_field_values.validation_message,"Warning");
    }
}

//submit-for_approval

lockdown.send_for_approval = function(){

    let get_field_values = sharepoint_utilities.create_meta_package($("div[form-navigation-target='Date & Details Finalisation']"));
     
    if(get_field_values.IsValid){    
        sharepoint_utilities.set_field_value("FormStatus","Waiting on Approval");    
        lockdown.update_current_section_data();
        lockdown.create_notification(0,"Set by workflow","New Notification",main["selected_lockdown_data"][0].Id);
        $("#Left-sticky-menu li[title='Lockdown']").click();  
    }else{
        sharepoint_utilities.render_notification("Cannot complete approval","Please complete the following fields first: " + get_field_values.validation_message,"Warning");
    }
}

lockdown.partner_approval = function(){

    let get_field_values = sharepoint_utilities.create_meta_package($("div[app-name='Lockdown']"));
    let validate_partner_id = parseInt(sharepoint_utilities.get_field_values(["EngagementPartnerId"]).meta_package["EngagementPartnerId"])

    if(validate_partner_id == _spPageContextInfo.userId){

        if(get_field_values.IsValid == true){  

             //update the associated task once approved
            $.when(lockdown.set_task_to_approved("Partner Approval")).done(function(response){

                    if(response == "success"){
                        sharepoint_utilities.set_field_value("FormStatus","Waiting on QRM Completion");
                        let approval_date = moment().format(app_configuration.display_date_format);
                        sharepoint_utilities.set_field_value("PartnerApprovalDate",approval_date);
                        lockdown.update_current_section_data();              
                        //create notification
                        lockdown.create_notification(0,"Set by workflow","Lockdown Approved",main["selected_lockdown_data"][0].Id);
                        //reset the page
                        $("#Left-sticky-menu li[title='Lockdown']").click();  
                    }
            });        
            
        }else{
            sharepoint_utilities.render_notification("Cannot complete approval","Please complete the following fields first: " + get_field_values.validation_message,"Warning");
        }        
        
    }else{
        sharepoint_utilities.render_notification("Cannot complete approval","You are not authorized to approve this submission","Warning");
        
    }
}



lockdown.set_task_to_approved = function(approval_task_type){

    let create_promise = $.Deferred();

    let task_filter = "AssignedToId eq '"+_spPageContextInfo.userId +"'";

    if(approval_task_type == "QRM Approval"){
        task_filter = "substringof('"+_spPageContextInfo.userEmail +"',TeamAssignedToEmails)";
    }
   
    //find approval task
    let get_list_items = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "Id",
            "ReferenceID eq '"+main.selected_lockdown_data[0].Id+"' and TaskType eq '"+approval_task_type+"' and " + task_filter,
            app_configuration.lockdown_task_list,
            "Id desc"
        )
    $.when(get_list_items).
        done(function(item_results){
            if(item_results.length > 0){
                let meta_package = {
                    "TaskStatus":"Approved"
                }
                let update_item = sharepoint_utilities.update_item 
                        (
                            app_configuration.lockdown_task_list,
                            app_configuration.site_context,
                            meta_package,
                            item_results[0].Id
                        )
                $.when(update_item)
                    .done(function(){
                       
                        create_promise.resolve("success");
                });   
            }else{

                create_promise.resolve("error");
                sharepoint_utilities.render_notification
                    (
                        "Cannot Approve Task",
                        "There are no "+approval_task_type+" task for you to approve for reference: " + main.selected_lockdown_data[0].Id,
                        "Warning"
                    )
            }     
        });
    
    return create_promise
    
}

lockdown.create_notification = function(AssignedToId,Message,NotificationType,AssociatedReference){

	var NotificationProperties = {};
	NotificationProperties["Title"] = "New Notification";
	NotificationProperties["Message"] = Message;
	NotificationProperties["AssignedToId"] = AssignedToId;
	NotificationProperties["NotificationType"] = NotificationType;
	NotificationProperties["AssociatedReferenceID"] = AssociatedReference.toString();	

	sharepoint_utilities.save_item(app_configuration.lockdown_general_notifications,app_configuration.site_context,NotificationProperties);	
}


lockdown.engagement_level_rules = function(selected_value){

    let initialize_fields = 
    [
        "EngagementLevelOtherDetails","AssuranceWork","OpinionType","IndustryType","IsPIE","TypeOfPublicInterestEntity","ClientCategory","PIScore",
        "EQRPerformed","EQRReviewerId","JointReport","IsTransnational","IsListed","InternallyCompiled","RAYear","EngagementYear","FeesBilled","RemainingFees", "AuditSoftwarePackageUsed"
    ]
    sharepoint_utilities.hide_fields(initialize_fields);
    sharepoint_utilities.set_fields_as_not_required(initialize_fields);

    let fields_to_show_and_validate = []
    switch(selected_value){

        case "Group (Holding company and subsidiaries)":
            fields_to_show_and_validate = ["AssuranceWork","OpinionType","IndustryType","IsPIE","ClientCategory","PIScore",
            "EQRPerformed","EQRReviewerId","JointReport","IsTransnational","IsListed","InternallyCompiled","RAYear","EngagementYear","FeesBilled","RemainingFees", "AuditSoftwarePackageUsed"]
        break;

        case "Standalone entity":
            fields_to_show_and_validate = ["AssuranceWork","OpinionType","IndustryType","IsPIE","ClientCategory","PIScore",
            "EQRPerformed","EQRReviewerId","JointReport","IsTransnational","IsListed","InternallyCompiled","RAYear","EngagementYear","FeesBilled","RemainingFees", "AuditSoftwarePackageUsed"]
        break;

        case "Other":
            fields_to_show_and_validate = ["EngagementLevelOtherDetails"]
        break;
    }

    sharepoint_utilities.show_fields(fields_to_show_and_validate);
    sharepoint_utilities.set_fields_as_required(fields_to_show_and_validate);

    //check change rules
    $("input[data-sp-element-name='IsPIE']").change();
    $("input[data-sp-element-name='EQRPerformed']").change();
    
}

lockdown.validation_of_year_end_date= function(){


    let get_field_properties = sharepoint_utilities.get_field_values(["YearEndEngagement","ExpectedSigningDate"]);
    let field_values = get_field_properties.meta_package;    
	
	//check that the financial year end date is not after the reporting date
	let financial_year_end_date = field_values["YearEndEngagement"]
    let expected_signing_date = field_values["ExpectedSigningDate"]

    //ensure a future date cannot be added 
	let reporting_date = expected_signing_date
	let reporting_date_check = moment(reporting_date,app_configuration.date_format).isAfter();

	//check if the reporting date is the last day of the month
	let is_last_day_of_month = moment(reporting_date,app_configuration.date_format).isSame(moment(reporting_date,app_configuration.date_format).endOf('month'));
	if(reporting_date_check){
        
        sharepoint_utilities.set_field_value("YearEndEngagement","");
        sharepoint_utilities.set_field_value("ExpectedSigningDate","");

        sharepoint_utilities.render_notification("Year End Data","Auto adjustment: for the last day of the month","Info")
       
	}

    if(expected_signing_date){
        //check that the YearEndEngagement end date is not after the reporting date	 / signing date
        let financial_year_end_check = moment(financial_year_end_date,app_configuration.date_format).isAfter(moment(reporting_date,app_configuration.date_format));
        if(financial_year_end_check){

            sharepoint_utilities.render_notification("Expected Signing Date","The expected signing date of the engagement report cannot be set to a date before the engagement file's year-end","Warning")
            sharepoint_utilities.set_field_value("YearEndEngagement","");    
        }else{
            
            last_day_of_month = moment(reporting_date,app_configuration.date_format).endOf('month').format(app_configuration.display_date_format);
            if(is_last_day_of_month){		
                sharepoint_utilities.set_field_value("YearEndEngagement",last_day_of_month);   

            }else{
                last_day_of_month_of_previous_month = moment(reporting_date,app_configuration.date_format).subtract(1,"months").endOf('month').format(app_configuration.display_date_format);
                sharepoint_utilities.set_field_value("YearEndEngagement",last_day_of_month_of_previous_month);
            }			
            
            sharepoint_utilities.render_notification("Year End Data","Auto adjustment: for the last day of the month","Info")
           
        }
    }

   
}



lockdown.get_client_code = function(client_name){

    sharepoint_utilities.set_field_value("ClientCode","");

    $.when(
		sharepoint_utilities.get_list_items_by_title(
			app_configuration.client_list_site_context, 
			"M_ClientCode",
			"M_ClientName eq '"+ main.clean_client_name(client_name) +"'",
			app_configuration.client_list_name,
			"Id desc")
		)
	.done(function(results){

        if(results.length > 0){
		    sharepoint_utilities.set_field_value("ClientCode",results[0].M_ClientCode);
        }
	});

}

lockdown.generate_key = function(){

    let random_key = Math.random().toString(36).slice(2);
    sharepoint_utilities.set_field_value("LockdownKey",random_key)
}

lockdown.render_lockdown_search = function(){

    let lockdown_lookup_component = 
    {    
        "lockdown_lookup": 
        [
            {
                "Title":"Search for your lockdowns via Client Name",
                "Description":"Please select your client name",
                "sp_field_name":"temp-lockdown-search",          
                "sp_field_type":"select",
                "field_width":"half-width",
                "field_validate":false,
                "sp_additional_properties":"single-select-typeahead exclude-from-meta allow-own-values",
                "additional_filters":"",
                "drop_down_title_field":"M_ClientName",
                "drop_down_value_field":"M_ClientName",
                "drop_down_order_by":"Title asc",
                "list_name":app_configuration.client_list_name,
                "site_context":app_configuration.client_list_site_context,
                "field_icon":"ContactList" 
            },          
            {
                "Title":"Lockdown table history",
                "Description":"Lockdown table history",
                "sp_field_name":"temp-lockdown-table-history",          
                "sp_field_type":"placeholder",
                "field_width":"full-width",
                "field_validate":false,
                "sp_additional_properties":"placeholder exclude-from-meta hide-details"                
            }
        ]
    }

    $("#additional-component-placeholders").html(sharepoint_utilities.create_container_form(
        lockdown_lookup_component.lockdown_lookup,
        "lockdown-drop-down-container form-basic")
    );    
    sharepoint_utilities.apply_form_plugins(lockdown_lookup_component.lockdown_lookup);   
}

lockdown.render_lockdown_history = function(client_name){  

    var get_active_lockdowns = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "*,EngagementPartner/Title&$expand=EngagementPartner/Title",
        "ClientName eq '"+main.clean_client_name(client_name)+"' and FormStatus ne 'Cancelled'",
        app_configuration.lockdown_list_name,
        "Id desc");

    let table_html =
        `   
            <table id='my_lockdown_table' class='table-dashboard accordin-table table'>
                <thead>                   
                    <th>Client Details</th>                
                    <th>Expected Signing Date</th>
                    <th>Reporting date</th> 
                    <th>Reminder date</th>  
                    <th>Year End</th>   
                    <th>Last updated</th>
                    <th>Actions</th>
                </thead>
                <tbody>            
        `

    $.when(get_active_lockdowns).done(function(active_lockdown_data){      

        for (let index = 0; index < active_lockdown_data.length; index++) {

            let active_row = active_lockdown_data[index];
            let action_buttons = lockdown.determine_action_buttons(active_row);

            let engagement_partner_display = "";
            if(active_row.EngagementPartnerId){
                engagement_partner_display = active_row.EngagementPartner.Title
            }       

            table_html +=          
                    `
                        <tr>                     
                            <td style='width:20%'>                                
                                <b>${active_row.ClientName.toUpperCase()}</b>
                                <br>
                                ${sharepoint_utilities.check_for_null(active_row.Region,"")}
                                <br>
                                ${engagement_partner_display}
                                <br>
                                <b style='color:#0071CE;'>${active_row.FormStatus}<b/>
                            </td>                            
                            <td>${display_date_field(active_row.ExpectedSigningDate)}</td> 
                            <td>${display_date_field(active_row.Reportingdate)}</td>              
                            <td>${display_date_field(active_row.ReminderDate)}</td>                                      
                            <td>${display_date_field(active_row.YearEndEngagement)}</td>  
                            <td>${display_date_field(active_row.Modified)}</td>
                            <td>${action_buttons}</td>
                        </tr>
                    `      
        }


        table_html +=
        `   
                </tbody>
            </table
        `

        $(".lockdown-drop-down-container div[sp-field-name='temp-lockdown-table-history'] .field-component").html(table_html);

        $('#my_lockdown_table').DataTable({
            "pageLength": 10,
            "bLengthChange": false,

            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "All"] ]
        });

    });

    function display_date_field(source_date){

        let date = "";

        if(source_date){
            date = moment(source_date).format(app_configuration.display_date_format)
        }

        return date
    }    

}

lockdown.determine_action_buttons = function(row_details){

    let action_buttons = 
    `
        <i title='View this lockdown' 
            class='menu-icon ms-Icon ms-Icon--View table-action-button' 
            data-action-type='display_lockdown_data' 
            data-source-type='active' 
            data-task-status='${row_details["FormStatus"]}' 
            data-itemid='${row_details["Id"]}'
        >
        </i>&nbsp;&nbsp; 
    `;

    if(row_details["FormStatus"] != "Complete" && row_details["FormStatus"] != "Unlocked with Approval"){
        action_buttons += 
        `
            <i title='Cancel this lockdown' 
                class='menu-icon ms-Icon ms-Icon--DeactivateOrders table-action-button'                        
                data-itemid='${row_details["Id"]}'
            >
            </i>&nbsp;&nbsp; 
        `
    } 

    if(row_details["FormStatus"] == "Complete"){

        //We show the request for the lockdown file to be unlocked
        //only if the lockdown is complete, a notification is sent for an approval task and logged under the approval list
        action_buttons += 
        `
            <i title='Request to unlock file' 
                class='menu-icon ms-Icon ms-Icon--Unlock table-action-button'                        
                data-itemid='${row_details["Id"]}'
            >
            </i>&nbsp;&nbsp; 
        `
    }

    return action_buttons

}

lockdown.render_data_from_email = function(request_meta){

    $(".lockdown-drop-down-container").addClass("hide");   
    lockdown.render_actions(request_meta)
}

lockdown.render_actions = function(request_meta){

    let item_id = parseInt(request_meta.item_id)    
    let data_source_type = request_meta.data_source_type;

    //just do the switching when using the relavant datasources
    let list_name = app_configuration.lockdown_list_name;
    let list_context = app_configuration.site_context;

    if(data_source_type == "lockdown_archive"){        
        list_context = app_configuration.lockdown_archive_site_context;
    }

    let selected_fields = sharepoint_utilities.generate_select_and_expand_fields(sharepoint_utilities.consolidate_fields(lockdown_fields_configuration));
    var get_lockdown_submissions = sharepoint_utilities.get_list_items_by_title(
        list_context, 
        selected_fields,
        "Id eq " + item_id,
        list_name,
        "Id desc");    


    $.when(get_lockdown_submissions).done(function(get_lockdown_submission_data){

        main["selected_lockdown_data"] = get_lockdown_submission_data;   
        lockdown.render_selected_form(get_lockdown_submission_data);  
    });
}


lockdown.render_selected_form = function(get_lockdown_submission_data){

    let canvas =  $(".page-section");   
    canvas.addClass("hide");
    $(".page-loader-header").removeClass("hide");


    //create the sections that hide and show based on the navigation item selected
    let section_names = [
        "Initiation of Lockdown",
        "Date & Details Finalisation",
        "Partner Approval",      
        "QRM Approval",
        "Unlock File Approval",
        "Approval History" 
    ]

    canvas.html(lockdown.create_form_sections(section_names))

    canvas.find("div[form-navigation-target='Initiation of Lockdown']").html(sharepoint_utilities.create_container_form(lockdown_fields_configuration.planning,"lockdown-planning-section"));
    canvas.find("div[form-navigation-target='Date & Details Finalisation']").html(sharepoint_utilities.create_container_form(lockdown_fields_configuration.Finalization,"lockdown-finalization-section"));
    canvas.find("div[form-navigation-target='Partner Approval']").html(sharepoint_utilities.create_container_form(lockdown_fields_configuration.partner_approval,"lockdown-completion-section"));
    canvas.find("div[form-navigation-target='QRM Approval']").html(sharepoint_utilities.create_container_form(lockdown_fields_configuration.qrm_approval,"lockdown-completion-section"));
    canvas.find("div[form-navigation-target='Unlock File Approval']").html(sharepoint_utilities.create_container_form(lockdown_fields_configuration.unlock_file,"unlock_file-approval-section"));

    canvas.find("div[form-navigation-target='Approval History']").html(sharepoint_utilities.create_container_form(lockdown_fields_configuration.approval_history,"approval-history-section"));


    let consolidate_all_fields = sharepoint_utilities.consolidate_fields(lockdown_fields_configuration);

    //apply any plugins
    sharepoint_utilities.apply_form_plugins(consolidate_all_fields);  

    if(get_lockdown_submission_data){
        if(get_lockdown_submission_data.length > 0){   


            client_risk_assesments.render_task_code_component(
                get_lockdown_submission_data[0].ClientName,
                "TaskCode")
                   

            main.render_form_reference_number("QLD"+get_lockdown_submission_data[0].Id + " " + sharepoint_utilities.check_for_null(get_lockdown_submission_data[0].ClientCode,""))

            setTimeout(function(){
                //display the data    
                //use that cube to display the relavant fields
                sharepoint_utilities.display_saved_list_fields(
                    get_lockdown_submission_data,
                    consolidate_all_fields,
                    null                
                );                

                //check for blank client code
                if(!get_lockdown_submission_data[0].ClientCode){
                    lockdown.get_client_code(get_lockdown_submission_data[0].ClientName);
                }

                $("li[data-link-id='Submit a new lockdown']").removeClass("currently-open");
                $("li[data-link-id='Initiation of Lockdown']").addClass("currently-open");                  

            },1500);       
        }    
    }else{
        //if no data defalt the array to a blank array
        main["selected_lockdown_data"] = []
    }

    setTimeout(function(){       
        lockdown.form_status_rules();
        canvas.removeClass("hide");
        $(".page-loader-header").addClass("hide");
        //show the first section
        canvas.find("div[form-navigation-target='Initiation of Lockdown']").removeClass("hide");
        lockdown.auto_populate_dates();
        $("ul[data-app-name='Lockdown']").removeClass("disable-interaction");
    },2500);
}


lockdown.render_approval_history = function(){

    let get_list_items = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "*,AssignedTo/Title&$expand=AssignedTo/Title",
            "ReferenceID eq '"+main["selected_lockdown_data"][0].Id+"'",
            app_configuration.lockdown_task_list,
            "ApprovalOrder asc"
        )
    $.when(get_list_items).
        done(function(item_results){

            let approval_table = 
            `
                <table id='lockdown-approval-table' class='dataTable'>
                    <thead>
                        <tr>
                            <td>Approver</td>
                            <td>Status</td>
                            <td>Created</td>
                            <td>Last update</td>
                        </tr>
                    </thead>
                    <tbody>           
            `    
            //logic with results
            for (let index = 0; index < item_results.length; index++) {
                const item_row = item_results[index];

                let AssignedTo = "";
                switch(item_row.TaskType){
                    case "QRM Approval":
                        AssignedTo = "Lockdown Team";
                    break;
                    case "Partner Approval":
                        AssignedTo = item_row.AssignedTo.Title;
                    break;
                }
                approval_table +=
                `
                    <tr>
                        <td>${AssignedTo}</td>
                        <td>${item_row.TaskStatus}</td>
                        <td>${moment(item_row.Created).format(app_configuration.display_date_format)}</td>
                        <td>${moment(item_row.Modified).format(app_configuration.display_date_format)}</td>
                    </tr>
                `
            }

            approval_table += 
            `
                    </tbody>
                </table>
            `

            $("div[sp-field-name='placeholder-lockdown-approval-table']").html(approval_table);



        });
}

lockdown.form_status_rules = function(){

    $("ul[data-app-name='Lockdown'] li[data-link-id='Unlock File Approval']").addClass("nav-item-disabled"); 
   
    if(main["selected_lockdown_data"].length > 0){
        let form_status = main["selected_lockdown_data"][0].FormStatus

        sharepoint_utilities.hide_fields(["create-new-lockdown-form"]);
        $("ul[data-app-name='Lockdown'] li[data-link-id='QRM Approval']").addClass("nav-item-disabled"); 

        switch(form_status){

            case "Complete":
                sharepoint_utilities.disable_all_fields_by_section("Initiation of Lockdown",["input","select","textarea","button"]); 
                sharepoint_utilities.disable_all_fields_by_section("Date & Details Finalisation",["input","select","textarea","button"]);  
                sharepoint_utilities.disable_all_fields_by_section("Partner Approval",["input","select","textarea","button"]);
                sharepoint_utilities.disable_all_fields_by_section("QRM Approval",["input","select","textarea","button"]);      
                lockdown.disabled_task_code();
            break;   

            case "Unlocked with Approval":

                sharepoint_utilities.disable_all_fields_by_section("Initiation of Lockdown",["input","select","textarea","button"]); 
                sharepoint_utilities.disable_all_fields_by_section("Date & Details Finalisation",["input","select","textarea","button"]);  
                sharepoint_utilities.disable_all_fields_by_section("Partner Approval",["input","select","textarea","button"]);
                sharepoint_utilities.disable_all_fields_by_section("QRM Approval",["input","select","textarea","button"]);      
                sharepoint_utilities.disable_all_fields_by_section("Unlock File Approval",["input","select","textarea","button"]);   
                lockdown.disabled_task_code();
            break;


            case "Waiting on Approval":
                sharepoint_utilities.hide_fields(["submit-for_approval"]);   
                lockdown.disabled_task_code(); 
                
            break;

            case "Waiting on QRM Completion":        

                sharepoint_utilities.disable_all_fields_by_section("Initiation of Lockdown",["input","select","textarea","button"]); 
                sharepoint_utilities.disable_all_fields_by_section("Date & Details Finalisation",["input","select","textarea","button"]);  
                sharepoint_utilities.disable_all_fields_by_section("Partner Approval",["input","select","textarea","button"]);              
                sharepoint_utilities.show_fields(["qrm-approval-button"]);
                lockdown.disabled_task_code();
                $("ul[data-app-name='Lockdown'] li[data-link-id='QRM Approval']").removeClass("nav-item-disabled"); 
                sharepoint_utilities.set_fields_as_required(["ActualLockdownDate"]);
            break;

            case "Waiting on Unlock Approval":

                sharepoint_utilities.disable_all_fields_by_section("Initiation of Lockdown",["input","select","textarea","button"]); 
                sharepoint_utilities.disable_all_fields_by_section("Date & Details Finalisation",["input","select","textarea","button"]);  
                sharepoint_utilities.disable_all_fields_by_section("Partner Approval",["input","select","textarea","button"]);
                sharepoint_utilities.disable_all_fields_by_section("QRM Approval",["input","select","textarea","button"]);   
                $("ul[data-app-name='Lockdown'] li[data-link-id='Unlock File Approval']").removeClass("nav-item-disabled"); 
                
            break;

            default:

                //if there is data - this is an existing form
                sharepoint_utilities.hide_fields(["create-new-lockdown-form"]);
                sharepoint_utilities.show_fields(["next-go-to-client-details"]);

            break;
        }

        //trigger the change rules of the engagement level selection
        $("div[form-navigation-target='Date & Details Finalisation'] input[data-sp-element-name='EngagementLevel']").change();        
        $("ul[data-app-name='Lockdown'] li").removeClass("nav-item-disabled"); 
        $("ul[data-tree-level='third-level-navigation']").removeClass("hide");
        

    }else{

        //disabled all links
        $("ul[data-app-name='Lockdown'] ul li").addClass("nav-item-disabled");
        //except the first one
        $("ul[data-app-name='Lockdown'] li[data-link-id='Initiation of Lockdown']").removeClass("nav-item-disabled");          
        sharepoint_utilities.show_fields(["create-new-lockdown-form"]);
    }
}

lockdown.create_form_sections = function(array_of_sections){

    let section_html = "<div id='field_section_container'>";
    for (let index = 0; index < array_of_sections.length; index++) {
        const section = array_of_sections[index];

        section_html +=
        `
            <div form-navigation-target='${section}' class='page-section-form-container hide'></div>
        `        
    }
    section_html += "</div>"
    return section_html
}

lockdown.go_to_next_section = function(){

    lockdown.update_current_section_data();

    let get_current_selected_item = $("ul[data-app-name='Lockdown']").find("li.currently-open");    

    let check_for_sub_link_navigation = get_current_selected_item.next().find("ul")
    //check to see if the next link is a top level link
    if(check_for_sub_link_navigation.length > 0){
        get_current_selected_item.next().click()
        get_current_selected_item.next().next().children("li:first-child").click();    
    }else{
        get_current_selected_item.next().click();
    }

    
    
}

lockdown.go_back_to_section = function(){

    let get_current_selected_item = $("ul[data-app-name='Lockdown'] li.currently-open");
    get_current_selected_item.prev().click();
}

/**
 *uses the field configuration with the container of where the fields are stored to generate and save an item
 * @param  {field_configuration} field_configuration_array This is what you define in your field_set_configuration.js
 * @param  {form_container_class} jquery_object this is the jquery selected form container class e.g $(".example-form-container")
 * @return {boolean}   
 * return true
 */
lockdown.create_new_record = function(field_configuration,form_container_class){
    //this checks all the properties of the configured fields and returns and obj of all the values and validation status etc.
    let get_meta_package = sharepoint_utilities.create_meta_package(form_container_class);

    let check_expected_signing_date = sharepoint_utilities.get_field_values(["ExpectedSigningDate"]);

    if(check_expected_signing_date.IsValid){

        sharepoint_utilities.vaildate_meta_package(
            get_meta_package,
            app_configuration.site_context,
            app_configuration.lockdown_list_name,
            function commit_success(data){
            
                main["selected_lockdown_data"] = [data];
                lockdown.form_status_rules();
                $("ul[data-app-name='Lockdown'] li[data-link-id='Date & Details Finalisation']").removeClass("nav-item-disabled");
                $("ul[data-app-name='Lockdown'] li[data-link-id='Final-Lockdown-Submission']").removeClass("nav-item-disabled");
                $("ul[data-app-name='Lockdown'] li[data-link-id='Date & Details Finalisation']").click();
            },
            function commit_error(){

            }
        )
    }else{
        sharepoint_utilities.render_notification
            (
                "Cannot continue",
                "Please ensure you have selected an expected signing date",
                "Warning"
            )
    }
}

lockdown.update_current_section_data = function(){

    //get the current section
    let item_id = main["selected_lockdown_data"][0].Id;

    if(item_id){
        //get all fields in the current section
        let get_meta_package = sharepoint_utilities.create_meta_package($("div[app-name='Lockdown']"));
        //update the current secction
        $.when(sharepoint_utilities.update_item(
            app_configuration.lockdown_list_name,
            app_configuration.site_context,
            get_meta_package.meta_package,
			item_id
			))
        .done(function(response){
			
            //auto close the window
            if(response == "success"){
                sharepoint_utilities.render_notification("Form Updated","Your current working form was updated","Info");               
            }else{
                sharepoint_utilities.render_notification("Error","Something went wrong while updating your form","Warning");
            }            
        })       
    }else{
        sharepoint_utilities.render_notification("Cannot update form","Cannot find the unique form reference for the current submission to update","Warning");
    }

}

lockdown.complete_lockdown = function(){

    let qrm_admin_check = sharepoint_utilities.check_user_group("QRMITAdmins",app_configuration.site_context)

    $.when(qrm_admin_check).done(function(is_valid){

        if(is_valid){
            //get the current section
            let item_id = main["selected_lockdown_data"][0].Id;
            let current_section = $("ul[data-app-name='Lockdown'] li.currently-open").attr("data-link-id")

            if(item_id){
                //update the associated task once approved
                $.when(lockdown.set_task_to_approved("QRM Approval")).done(function(task_response){
                    //get all fields in the current section
                    sharepoint_utilities.set_field_value("QRMConfirmationDate",moment().format(app_configuration.display_date_format))
                    let get_meta_package = sharepoint_utilities.create_meta_package($("div[form-navigation-target='"+current_section+"'] > div"));
                    //add the complete meta
                    get_meta_package.meta_package["FormStatus"] = "Complete";     
                    //update the current secction
                    $.when(sharepoint_utilities.update_item(
                        app_configuration.lockdown_list_name,
                        app_configuration.site_context,
                        get_meta_package.meta_package,
                        item_id
                        ))
                    .done(function(response){
                        
                        //auto close the window
                        if(response == "success"){                     

                            lockdown.create_notification(0,"Set by workflow","Lockdown complete",item_id);
                            sharepoint_utilities.render_notification("Lockdown marked as complete","Your lockdown form has been closed","Info");    
                            $("#Left-sticky-menu li[title='Lockdown']").click();          
                        }else{
                            sharepoint_utilities.render_notification("Error","Something went wrong while updating your form","Warning");
                        }            
                    })       
                });
            }else{
                sharepoint_utilities.render_notification("Cannot update form","Cannot find the unique form reference for the current submission to update","Warning");
            }

        }else{
            sharepoint_utilities.render_notification("Cannot completed lockdown","Only QRM IT admins can complete the lockdown","Warning");
        }

    });
}

lockdown.remove_request = function(item_id){

    let box_button_options = {
        "Yes":function(){
            continue_to_remove();
            return false
        },
        "No":function(){
            
        }
    }

    
    let cancellation_field = [{
        "Title": "Reason",
        "Description": "Please add your reason",
        "sp_field_name": "CancellationReason",
        "sp_field_type": "select",
        "field_width": "half-width",
        "field_validate": true,
        "sp_additional_properties":"single-select-drop-down-own-values",          
        "own_values":["Duplicate","Incorrect information","Lockdown not required"],
        "field_icon":"ActionCenter"            
    }] 

    let container_html = 
    `
        <div>
            <p>Are you sure you want to cancel this request - you will loose all access to this item?</p>
            <div id='cancellation-options'></div>
        </div>
    `
    
    sharepoint_utilities.render_confirmation_box(
        "Cancellation of lockdown record",
        container_html,
        box_button_options,
    "30%");
    

    setTimeout(function(){
        //call the specific fields in the cube and render them in the sections above
        //this renders all the fields inside the container
        $("#cancellation-options").html(
            sharepoint_utilities.create_container_form(
                cancellation_field,//cube fields json
                "cancellation-details-form-fields" //class to identify
            )
        );  
        //apply the plugins such as dates , drop downs etc 
        sharepoint_utilities.apply_form_plugins(cancellation_field);   
    },500)   


    function continue_to_remove(){
       
        let field_properties = sharepoint_utilities.get_field_values(["CancellationReason"]); 
                 
        if(field_properties.IsValid){

            sharepoint_utilities.render_notification("Removing Record","Please wait while we remove your record","Info");
            let meta_package = {
                "FormStatus":"Cancelled",
                "QRMFileVerification":"Yes", //this is to stop the notifications reminders from going out
                "CancellationReason":field_properties.meta_package["CancellationReason"]
            }
            let update_item = sharepoint_utilities.update_item 
            (
                app_configuration.lockdown_list_name,
                app_configuration.site_context,
                meta_package,
                item_id
            )          

           
            $.when(update_item)
            .done(function(){
                setTimeout(function(){
                    lockdown.render_lockdown_history($("select[title='Search for your lockdowns via Client Name']").val());
                    sharepoint_utilities.close_container_window($(".confirmation-box_content-title"))
                },1000);            
            });
        }else{
            sharepoint_utilities.render_notification
                (
                    "Cancellation of lockdown",
                    "Please select a reason first",
                    "Warning"
                )
        }
    }

}

lockdown.disabled_task_code = function(){

    $("div[sp-field-name='TaskCode']").find(".radio-button-component").remove();
    $("div[sp-field-name='TaskCode']").find("input").removeClass("hide")
    $("div[sp-field-name='TaskCode']").find("input").prop("disabled",true);
}