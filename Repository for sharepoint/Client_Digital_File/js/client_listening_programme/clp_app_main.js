let clp_app_main = {}

clp_app_main.check_clp_permissions = function() {
    return new Promise((resolve) => {
     
        let get_list_items = sharepoint_utilities.get_list_items_by_title
            (
                app_configuration.site_context, 
                "*",
                "AdminId eq '"+_spPageContextInfo.userId +"'",
                app_configuration.clp_admin_list,
                "Id desc"
            )
        $.when(get_list_items).
            done(function(item_results){

                let permissions = {
                    "admin":false,
                    "pa_admin":false,
                    "pa_admin_filter":"",                   
                }
        
                //logic with results
                for (let index = 0; index < item_results.length; index++) {
                    const item_row = item_results[index];
                    
                    if(item_row.Title == "Admin"){
                        permissions.admin = true;
                    }
                    if(item_row.Title == "PA Admin"){
                        permissions.pa_admin = true;
                    }

                     if(item_row.AssociatedPartnersId){
                        permissions.pa_admin_filter = create_pa_partner_filter(item_row.AssociatedPartnersId)
                     }
                    
                }

               

                resolve(permissions);
        });      
    });


    function create_pa_partner_filter(array_of_partner_ids){

        let filter = " or ";

        for (let index = 0; index < array_of_partner_ids.length; index++) {
            const element = array_of_partner_ids[index];
            filter += "(partnerId eq " + element + " ) or "
        }

        filter = filter.slice(0,-4)
        return filter
    }
};

clp_app_main.render_submissions_table = function() {
    clp_app_main.render_submissions_by_client(""); 
};

clp_app_main.render_deletion_requests_table = async function() {

    //this is contained under the hidden admin link.
    //This link is only visable to people in the admin list 
    //Is admin is a function used to check if the user is in that list

    const isAdmin = app_configuration.is_clp_admin;
    if (!isAdmin) {
        $(".page-section").html("<p>You do not have permission to view this content.</p>");
        return;
    }
    
    // Filter for items with surveyStatus as "Deletion request"
    var filter = "surveyStatus eq 'Removal Requested'";
    
    var get_deletion_requests = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context,
        "Id,Title,clientName,clientCode,clientContactName,clientContactEmail,taskCode,Period,surveyStatus,Modified,RemovalJustification,RemovalReason",
        filter,
        app_configuration.clp_list_name,
        "Modified desc"
    );
    
    $.when(get_deletion_requests).done(function(deletionData) {
        let table_html = `
            <div class="clp-table-wrapper" style="width: 100%;">
                <div class="clp-drop-down-container" style="width: 100%;">
                    <div sp-field-name="temp-clp-search" class="field-component" style="margin-bottom: 20px;"></div>
                    <div sp-field-name="temp-clp-table" class="field-component">
                        <table id="clp_deletion_requests_table" class="table-dashboard accordion-table table" style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Client Name</th>
                                    <th>Client Code</th>
                                    <th>Task Code</th>                                     
                                    <th>Survey Status</th>
                                    <th>Removal Reason</th>
                                    <th>Removal Justification</th>
                                    <th>Last Modified</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>`;
        
        deletionData.forEach(function(item) {
            let actionButtons = `
                <i title="Approve" class="menu-icon ms-Icon ms-Icon--CheckMark clp-approve-deletion" data-itemid="${item.Id}" style="margin-right: 8px; color: green;"></i>
                <i title="Reject" class="menu-icon ms-Icon ms-Icon--Blocked clp-reject-deletion" data-itemid="${item.Id}" style="color: red;"></i>
            `;
            
            table_html += `
                <tr data-itemid="${item.Id}">
                    <td>${item.Title || ""}</td>
                    <td>${item.clientName || ""}</td>
                    <td>${item.clientCode || ""}</td>   
                    <td>${item.surveyStatus || ""}</td>
                    <td>${item.RemovalReason || ""}</td>
                    <td>${item.RemovalJustification || ""}</td>
                    <td>${moment(item.Modified).format(app_configuration.display_date_format)}</td>
                    <td class="table-action-buttons-cell">${actionButtons}</td>
                </tr>`;
        });
        
        table_html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        $(".page-section").html(table_html);
        
        // Initialize DataTable
        $('#clp_deletion_requests_table').DataTable({
            "pageLength": 10,
            "bLengthChange": true,
            "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
            "dom": '<"top"lf>rt<"bottom"ip><"clear">',
            "drawCallback": function() {
                $("#clp_deletion_requests_table_length select").css({"width": "auto"});
                $("#clp_deletion_requests_table_filter input").css({"width": "auto", "min-width": "200px"});
                $(".dataTables_wrapper").css("width", "100%");
            }
        });
        $("ul[data-app-name='Client Listening Programme']").removeClass("disable-interaction");
    });
};

clp_app_main.trigger_action_buttons = function(selected_action) {
    let item_id = selected_action.attr("data-itemid");

    clp_app_main.render_submission_details(item_id);
};

clp_app_main.render_submission_details = function(item_id) {

    //shows the form data for the selected submission either through the email or through the "View submissions" navigation link, 
    // and then clicking on the view action button

    let consolidated_fields = sharepoint_utilities.consolidate_fields(clp_field_configuration);  
    let query = sharepoint_utilities.generate_query_for_expanded_fields(consolidated_fields); 

    var get_submission = sharepoint_utilities.get_list_items_by_title(
       app_configuration.site_context,
       query,
       "Id eq '" + item_id + "'",
       app_configuration.clp_list_name,
       "Id desc"
    );
    $.when(get_submission).done(function(item_results) {

         if(item_results.length > 0) {
             app_configuration.form_reference_id = item_id;
             main["selected_clp_data"] = item_results;
             clp_business_rules.render_selected_form(item_results);
         }
    });
};


clp_app_main.render_submissions_by_client = function(client_name) {
    //shows all the submission when clicking on the view submissions button
    //You will only see submissions where the logged in users is a partner or manager and the submission and not been removed.    

    //this filter is used when the client name is blank. i.e when loading the page for the first time
    //is auto shows submission where the logged in user is involved.
    var filter = "( "+
                        "(partnerId eq " + _spPageContextInfo.userId + ") or "+
                        "(managersId eq " + _spPageContextInfo.userId + ") or "+
                        "(AuthorId eq " + _spPageContextInfo.userId + ")"+
                        app_configuration.pa_admin_filter +
                    ") and "+
                    "surveyStatus ne 'Removal Approved'";
    
    //this is when the search box has trigger the event
    if(client_name){
        filter = "clientName eq '" + main.clean_client_name(client_name) + "' and surveyStatus ne 'Removal Approved'"
    }  
    
    var get_all_clp_submissions = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context,
        "Id,Title,clientName,clientCode,clientContactName,clientContactEmail,taskCode,Period,surveyStatus,Modified,partnerId,managersId",
        filter,
        app_configuration.clp_list_name,
        "Modified desc"
    );
    
    $.when(get_all_clp_submissions).done(function(submissionData) {
        let table_html = `
            <div class="clp-table-wrapper" style="width: 100%;">
                <div class="clp-drop-down-container" style="width: 100%;">
                    <div sp-field-name="temp-clp-search" class="field-component" style="margin-bottom: 20px;"></div>
                    <div sp-field-name="temp-clp-table" class="field-component">
                        <table id="clp_submissions_table" class="table-dashboard accordion-table table" style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Client Name</th>
                                    <th>Client Code</th>                                 
                                    <th>Survey Status</th>
                                    <th>Last Modified</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>`;
        
        // Fetch user details for partner and managers if there are submissions
        if (submissionData.length > 0) {
            let userIds = new Set();
            submissionData.forEach(item => {
                if (item.partnerId) userIds.add(item.partnerId);
                if (item.managersId && Array.isArray(item.managersId)) item.managersId.forEach(id => userIds.add(id));
            });
            
            let userQuery = Array.from(userIds).map(id => `Id eq ${id}`).join(" or ");
            let userEndpoint = `${app_configuration.people_picker_site_context}/_api/web/lists/getbytitle('User Information List')/items?$select=Id,Title&$filter=${encodeURIComponent(userQuery)}`;
            
            $.when(sharepoint_utilities.get_items_by_url(userEndpoint))
            .done(function(userData) {
                let usersMap = {};
                userData.forEach(user => usersMap[user.Id] = user.Title);
                
                renderTable(submissionData, usersMap);
            })
            .fail(function(error) {
                console.error("Failed to fetch user data:", error);
                // Fallback if user query fails
                renderTable(submissionData, {});
            });
        } else {
            renderTable(submissionData, {});
        }
        
        function renderTable(data, usersMap) {
            data.forEach(function(item) {
                          
                // Check if the current user is the partner or in the managers group
                let isUserAssigned = (item.partnerId === _spPageContextInfo.userId) || 
                                     (item.managersId && Array.isArray(item.managersId) && item.managersId.includes(_spPageContextInfo.userId)) ||
                                     (app_configuration.is_clp_admin) ||
                                     (app_configuration.is_pa_admin)
                
                // Define action buttons based on user assignment
                let actionButtons = `<i title="View Submission" class="menu-icon ms-Icon ms-Icon--View clp-view-submission" style="margin-right: 8px;" data-itemid="${item.Id}" data-app-name="clp"></i>`;
                if (isUserAssigned) {
                    if (item.surveyStatus === "Feedback Received") {
                        actionButtons += `<i title="View Feedback" class="menu-icon ms-Icon ms-Icon--Comment clp-view-feedback" style="margin-right: 8px;" data-itemid="${item.Id}" data-app-name="clp"></i>`;
                    }
                    if (item.surveyStatus === "Pending Submission" || item.surveyStatus === "Removal Rejected" || item.surveyStatus == "Pending Partner Approval") {
                        actionButtons += `<i title="Open Form" class="menu-icon ms-Icon ms-Icon--Edit clp-open-form" data-itemid="${item.Id}" data-app-name="clp"></i>`;    
                    }

                    //only show the edit button
                    if(item.surveyStatus == "Pending Partner Approval"){
                        actionButtons = `<i title="Open Form" class="menu-icon ms-Icon ms-Icon--Edit clp-open-form" data-itemid="${item.Id}" data-app-name="clp"></i>`;   
                    }

                    if(item.surveyStatus == "Submitted - Pending Response" || item.surveyStatus == "Submitted" ){
                         actionButtons += `<i title="Request Deletion" class="menu-icon ms-Icon ms-Icon--Delete clp-deletion-request" style="margin-left:8px;" data-itemid="${item.Id}" data-app-name="clp"></i>`;                         
                       
                    }

                    if(item.surveyStatus == "Submitted - Pending Response"){

                       actionButtons += `<i title="Send a reminder" class="menu-icon ms-Icon ms-Icon--MailReminder clp-reminder-request" style="margin-left:8px;" data-itemid="${item.Id}" data-app-name="clp"></i>`;
                    }
                }
                
                table_html +=
                    `<tr data-itemid="${item.Id}">
                        <td>${item.Id}</td>
                        <td>${item.clientName || ""}</td>
                        <td>${item.clientCode || ""}</td>                        
                        <td>${item.surveyStatus || ""}</td>
                        <td>${moment(item.Modified).format(app_configuration.display_date_format)}</td>
                        <td class="table-action-buttons-cell">${actionButtons}</td>
                    </tr>`;
            });
            
            table_html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
            $(".page-section").html(table_html);

            // Populate the search dropdown
            let search_field = [
               {
                    "Title":"Search client details",
                    "Description":"Use the search box to find your client and associated client code from greatsoft.",
                    "sp_field_name":"clp-overview-search-client-name",          
                    "sp_field_type":"select",         
                    "field_width":"full-width",
                    "field_validate":true,
                    "sp_additional_properties":"exclude-from-meta single-select-typeahead plain-text-field",
                    "additional_filters":"",
                    "drop_down_title_field":"M_ClientName",
                    "drop_down_value_field":"M_ClientCode",
                    "drop_down_order_by":"Title asc",
                    "list_name":app_configuration.client_list_name,
                    "site_context":app_configuration.client_list_site_context,
                    "field_icon":"ContactList" 
                }
            ]      

            let search_html = sharepoint_utilities.create_container_form(search_field, "clp-search-section");
            $(".clp-drop-down-container div[sp-field-name='temp-clp-search']").html(search_html);
            sharepoint_utilities.apply_form_plugins(search_field);

            // Initialize DataTable with additional styling for controls
            $('#clp_submissions_table').DataTable({
                "pageLength": 10,
                "bLengthChange": true,
                "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
                "dom": '<"top"lf>rt<"bottom"ip><"clear">',
                "drawCallback": function() {
                    $("#clp_submissions_table_length select").css({"width": "auto"});
                    $("#clp_submissions_table_filter input").css({"width": "auto", "min-width": "200px"});
                    $(".dataTables_wrapper").css("width", "100%");
                }
            });
            $("ul[data-app-name='Client Listening Programme']").removeClass("disable-interaction");
        }
    });
};

clp_app_main.render_survey_feedback = function(selected_action) {

    //this is kinda backwards, but i guess it works.
    //When the scheduled flow checks for an update of the status, an email is sent to the submitter that there is feedback
    //When this user logs onto the form , this code kicks off to intiate "Feedback Was recived"

    let item_id = selected_action.attr("data-itemid");
    var get_submission = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context,
        "*",
        "Id eq '" + item_id + "'",
        app_configuration.clp_list_name,
        "Id desc"
    );
    $.when(get_submission).done(function(original_request_details) {
         if (original_request_details.length > 0) {
         
             var get_results = sharepoint_utilities.get_list_items_by_title(
                 app_configuration.site_context,
                 "*",
                 "AssociatedReferenceId eq '" + item_id + "'",
                 "CLPResponses",
                 "Id desc"
             );
             $.when(get_results).done(function(survey_response_details) {

                 if (survey_response_details.length > 0) {
                     $(".page-section").html("<div class='clp-survey-results-container'></div>");

                    //render the first found results
                    //the render action then checks for multiple responses and displays that under the survey record selector  
                    let all_survey_responses = survey_response_details  
                    clp_survey_results_page.render_results(original_request_details[0],survey_response_details[0],all_survey_responses);
                    
                 } else {
                     $(".page-section").html("<p>No survey results found for this submission.</p>");
                 }
             }).fail(function(error){
                 $(".page-section").html("<p>Error fetching survey results.</p>");
             });
         } else {
             $(".page-section").html("<p>Submission not found.</p>");
         }
    });
};

clp_app_main.render_data_from_email = function(request_meta) {
    // Open the navigation path
    $("#Left-sticky-menu li[title='Client Listening Programme']").click();

    // Fetch the item to determine its surveyStatus, partnerId, and managersId
    var get_submission = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context,
        "Id,surveyStatus,partnerId,managersId",
        "Id eq '" + parseInt(request_meta.item_id) + "'",
        app_configuration.clp_list_name,
        "Id desc"
    );

    $.when(get_submission).done(function(item_results) {
        if (item_results.length > 0) {
            let item = item_results[0];
            let surveyStatus = item.surveyStatus || "";
            let partnerId = item.partnerId || null;
            let managersId = item.managersId && Array.isArray(item.managersId) ? item.managersId : [];

            // Default mode is "read" (read-only access is always allowed)
            let mode = "read";

            // Check if the current user is the partner or one of the managers
            let currentUserId = _spPageContextInfo.userId;
            let isAuthorized = (partnerId === currentUserId) || managersId.includes(currentUserId) || app_configuration.is_clp_admin || app_configuration.is_pa_admin

            // If authorized and status is "Pending Submission", allow edit mode
            if (isAuthorized && surveyStatus === "Pending Submission") {
                mode = "edit";
            } else if (!isAuthorized && surveyStatus === "Pending Submission") {
                // Notify the user they can’t edit due to lack of permission
                sharepoint_utilities.render_notification(
                    "Access Restriction",
                    "You do not have permission to edit this submission. It is opened in read-only mode.",
                    "Warning"
                );
            }

            // Use a slight delay to ensure navigation is ready
            setTimeout(function() {
                if (surveyStatus === "Feedback Received") {
                    let fakeElement = $("<div></div>").attr("data-itemid", item.Id);
                    clp_app_main.render_survey_feedback(fakeElement);
                } else {
                    // Render the submission details with the determined mode
                    clp_app_main.render_submission_details(parseInt(request_meta.item_id), mode);
                }
            }, 500);
        } else {
            sharepoint_utilities.render_notification("Error", "No submission found for the provided ID.", "Warning");
            $(".page-section").html("<p>No submission found for the provided ID.</p>");
        }
    }).fail(function(error) {
        sharepoint_utilities.render_notification("Error", "Error loading submission details.", "Warning");
        $(".page-section").html("<p>Error loading submission details.</p>");
    });
};


clp_app_main.create_general_notification = function(Reference_Id,NotificationType){

    let meta_package = {
        "Title":"New Notification",
        "NotificationType":NotificationType,
        "AssociatedReferenceID":Reference_Id
    }
    let create_item = sharepoint_utilities.save_item
        (
            app_configuration.clp_general_notifications,
            app_configuration.site_context,
            meta_package
    ); 
}
