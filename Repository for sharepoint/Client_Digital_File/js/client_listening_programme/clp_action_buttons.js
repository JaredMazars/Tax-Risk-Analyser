let clp_action_buttons = {}

$(document).on("click","#Left-sticky-menu li[title='Client Listening Programme']",function(){
    
    //reseting all variables and the form
    $(".header-right-container-container").html("");
    main["selected_clp_data"] = [];
    //clp_app_main.render_submissions_table();    	
});

$(document).on("click","ul[data-app-name='Client Listening Programme'] li[data-link-id='New Survey']",function(){    
   
    // Reset form data for a new survey
    main["selected_clp_data"] = [];
    // Show the form
    clp_business_rules.render_selected_form([]); 	
});

$(document).on("click","ul[data-app-name='Client Listening Programme'] li[data-link-id='Help Guide']",function(){    
    
    // Reset form data for a new survey
    main["selected_clp_data"] = [];
    // Show the form
    clp_business_rules.render_help_document(); 	
});

$(document).on("click","div[app-name='Client Listening Programme'] input[data-sp-element-name='btn-submit-clp-request']",function(){

    if(app_configuration.form_reference_id){
        //existing submission from the AC
        clp_business_rules.approve_and_send_survey_to_client()
    }else{
        clp_business_rules.create_new_survey_request();
    }
    
});

$(document).on("click","div[app-name='Client Listening Programme'] input[data-sp-element-name='btn-approve-clp-request']",function(){
    //this was removed as per bertam 2025/07/16 - no approvals needed
    //clp_business_rules.approve_and_send_survey_to_client();
}); 

$(document).on("change","div[app-name='Client Listening Programme'] select[data-sp-element-name='temp-search-client-name']",function(){
    
    let clientCodeField = $("div[app-name='Client Listening Programme'] [data-sp-element-name='clientCode']");
    let newValue = $(this).val();
    if(clientCodeField.length > 0){
        sharepoint_utilities.set_field_value("clientCode", newValue);
        clp_business_rules.get_client_details(newValue)
    }

    let client_name = $(this).find(":selected").text();
    let clientNameField = $("div[app-name='Client Listening Programme'] [data-sp-element-name='clientName']");
    if(clientNameField.length > 0){
        sharepoint_utilities.set_field_value("clientName", client_name);
        // Force update for disabled clientName field:
        let isDisabled = clientNameField.is(":disabled");
        if(isDisabled){
            clientNameField.prop("disabled", false);
            clientNameField.val(client_name);
            clientNameField.prop("disabled", true);
        } else {
            clientNameField.val(client_name);
        }
    }



    client_risk_assesments.render_task_code_component(client_name,"taskCode")
});

$(document).on("change", ".clp-drop-down-container div[sp-field-name='temp-clp-search'] select[data-sp-element-name='clp-overview-search-client-name']", function() {

    let selectedClient = $(this).find(":selected").text();
    clp_app_main.render_submissions_by_client(selectedClient);
});

$(document).on("click","#clp_submissions_table tbody tr td .clp-reminder-request",function(){
    
    clp_action_buttons.send_reminder_request($(this).attr("data-itemid"));
});

$(document).on("click","#clp_submissions_table tbody tr td .clp-view-submission", function(){

    clp_app_main["mode"] = "view";
    let item_id = $(this).attr("data-itemid");    
    clp_app_main.render_submission_details(item_id);
 
});

$(document).on("click","#clp_submissions_table tbody tr td .clp-open-form", function(){   

    clp_app_main["mode"] = "edit";
    let item_id = $(this).attr("data-itemid");    
    clp_app_main.render_submission_details(item_id);

});

$(document).on("click","#clp_submissions_table tbody tr td .clp-view-feedback", function(){
    clp_app_main.render_survey_feedback($(this));
});

$(document).on("click","#clp_deletion_requests_table tbody tr td .clp-approve-deletion", function(){

    let clicked_action_button = $(this);
    let itemId = $(this).attr("data-itemid");
    sharepoint_utilities.render_notification("Approve Deletion", "Please wait while we process your approval", "Info");

    //create general notification   
    clp_app_main.create_general_notification(itemId,"Removal Approved")

    let meta_package = {
        "surveyStatus": "Removal Approved"
    };
    let update_item = sharepoint_utilities.update_item(
        app_configuration.clp_list_name,
        app_configuration.site_context,
        meta_package,
        parseInt(itemId)
    );
    $.when(update_item).done(function(){
        clicked_action_button.parent().parent().remove()
    });
});

$(document).on("click","#clp_deletion_requests_table tbody tr td .clp-reject-deletion", function(){
    
    let clicked_action_button = $(this);
    let itemId = $(this).attr("data-itemid");

    let box_button_options = {
        "Yes": function() {
            continue_to_reject(clicked_action_button);
            return false;
        },
        "No": function() {}
    };

    let rejectionJustificationField = [
        {
            "Title": "Reject Reason",
            "Description": "Please provide a reason for rejecting the removal request",
            "sp_field_name": "RejectReason",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": true,
            "sp_additional_properties": "none",
            "field_icon": "Edit"
        }
    ];

    let container_html = `
        <div>
            <p>Are you sure you want to reject this removal request?</p>
            <div id='rejection-options'></div>
        </div>
    `;

    sharepoint_utilities.render_confirmation_box(
        "Reject Removal Request",
        container_html,
        box_button_options,
        "30%"
    );

    setTimeout(function() {
        $("#rejection-options").html(
            sharepoint_utilities.create_container_form(
                rejectionJustificationField,
                "rejection-details-form-fields"
            )
        );
        sharepoint_utilities.apply_form_plugins(rejectionJustificationField);
    }, 500);

    function continue_to_reject(clicked_action_button) {

        let field_properties = sharepoint_utilities.get_field_values(["RejectReason"]);
        
        if (field_properties.IsValid) {
            sharepoint_utilities.render_notification("Reject Deletion", "Please wait while we process your rejection", "Info");

            clp_app_main.create_general_notification(itemId,"Removal Rejected")

            let meta_package = {
                "surveyStatus": "Removal Rejected",
                "RejectReason": field_properties.meta_package["RejectReason"]
            };
            let update_item = sharepoint_utilities.update_item(
                app_configuration.clp_list_name,
                app_configuration.site_context,
                meta_package,
                itemId
            );
            
            $.when(update_item)
            .done(function() {
                setTimeout(function() {
                    clicked_action_button.parent().parent().remove();
                    sharepoint_utilities.close_container_window($(".confirmation-box_content-title"));
                }, 1000);
            });
        } else {
            sharepoint_utilities.render_notification(
                "Reject Deletion",
                "Please fill in all required fields",
                "Warning"
            );
        }
    }
});

$(document).on("click","ul[data-app-name='Client Listening Programme'] li[data-link-id='Submit a Survey']",function(){
    $("ul[data-app-name='Client Listening Programme']").addClass("disable-interaction");
    clp_app_main.render_submissions_table();
});

$(document).on("click","ul[data-app-name='Client Listening Programme'] li[data-link-id='View Submissions']",function(){

    $("ul[data-app-name='Client Listening Programme']").addClass("disable-interaction");
    clp_app_main.render_submissions_table();
});

$(document).on("click","ul[data-app-name='Client Listening Programme'] li[data-link-id='Removal Requests']",async function(){
    const isAdmin = app_configuration.is_clp_admin;
    if (isAdmin) {
        $("ul[data-app-name='Client Listening Programme']").addClass("disable-interaction");
        clp_app_main.render_deletion_requests_table();
    } else {
        sharepoint_utilities.render_notification("Access Denied", "You do not have permission to view Removal Requests.", "Warning");
    }
});

$(document).on("click", "#clp_submissions_table tbody tr td .clp-deletion-request", function(){
    let itemId = $(this).attr("data-itemid");

    let box_button_options = {
        "Yes": function() {
            continue_to_remove();
            return false;
        },
        "No": function() {}
    };

    let removalJustificationField = [
        {
            "Title": "Reason",
            "Description": "Please add your reason",
            "sp_field_name": "RemovalReason",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "single-select-drop-down-own-values",
            "own_values": ["Duplicate", "Proposal not accepted", "No longer a client", "Other"],
            "field_icon": "ActionCenter"
        },
        {
            "Title": "Justification",
            "Description": "Please provide additional justification for the removal",
            "sp_field_name": "RemovalJustification",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": true,
            "sp_additional_properties": "none",
            "field_icon": "Edit"
        }
    ];

    let container_html = `
        <div>
            <p>Are you sure you want to request the removal of this survey? You will lose access to this item.</p>
            <div id='removal-options'></div>
        </div>
    `;

    sharepoint_utilities.render_confirmation_box(
        "Request Deletion",
        container_html,
        box_button_options,
        "30%"
    );

    setTimeout(function() {
        $("#removal-options").html(
            sharepoint_utilities.create_container_form(
                removalJustificationField,
                "removal-details-form-fields"
            )
        );
        sharepoint_utilities.apply_form_plugins(removalJustificationField);
    }, 500);

    function continue_to_remove() {
        let field_properties = sharepoint_utilities.get_field_values(["RemovalReason", "RemovalJustification"]);
        
        if (field_properties.IsValid) {
            sharepoint_utilities.render_notification("Request Deletion", "Please wait while we process your request", "Info");

            clp_app_main.create_general_notification(itemId,"Removal Requested")

            let meta_package = {
                "surveyStatus": "Removal Requested",
                "RemovalReason": field_properties.meta_package["RemovalReason"],
                "RemovalJustification": field_properties.meta_package["RemovalJustification"]
            };
            let update_item = sharepoint_utilities.update_item(
                app_configuration.clp_list_name,
                app_configuration.site_context,
                meta_package,
                itemId
            );
            
            $.when(update_item)
            .done(function() {
                setTimeout(function() {
                    clp_app_main.render_submissions_table();
                    sharepoint_utilities.close_container_window($(".confirmation-box_content-title"));
                }, 1000);
            });
        } else {
            sharepoint_utilities.render_notification(
                "Request Deletion",
                "Please fill in all required fields",
                "Warning"
            );
        }
    }
});


 clp_action_buttons.send_reminder_request = function(reference_id){

    let paragraph = "You are about to send a reminder to the select client. Are you sure you want to do this?"

    let reminder_function = {
        "yes":function(){
            clp_action_buttons.send_reminder_notification(reference_id);
        },
        "no":function(){
            return true;
        }
    }
    sharepoint_utilities.render_confirmation_box("Send Reminder Action",paragraph,reminder_function,"50%");

 };

 clp_action_buttons.send_reminder_notification = function(reference_id){

     sharepoint_utilities.render_notification(
                "Reminder Notification",
                "Please wait while we send out the reminder",
                "Info"
            );
    clp_app_main.create_general_notification(reference_id,"Reminder Notification")

 }
