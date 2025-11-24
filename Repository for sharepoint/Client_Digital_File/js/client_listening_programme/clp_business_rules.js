let clp_business_rules = {};

clp_business_rules.render_help_document = function(){

     //this renders the original submission form | there is another form which is the results handled in the clp_survey_results_page.js file

    // Set up the form container.
    let canvas = $(".page-section");
    canvas.addClass("hide");
    $(".page-loader-header").removeClass("hide");

    // Create and insert the form container sections.
    let clp_form_container_html = clp_business_rules.create_form_sections([
        "Help Guide"
    ]);

    $(".page-section").html(clp_form_container_html);

    $("div[form-navigation-target='Help Guide']").html(
        sharepoint_utilities.create_container_form(
            clp_help_guide_configuration.help_fields,
            "client-survey-help-section"
        )
    );    
    // Apply form plugins.
    sharepoint_utilities.apply_form_plugins(clp_help_guide_configuration.help_fields);   

    setTimeout(function(){
        canvas.removeClass("hide");
        $(".page-loader-header").addClass("hide");
        canvas.find("div[form-navigation-target='Help Guide']").removeClass("hide");
    },800)

}

clp_business_rules.render_selected_form = function(data_result) {
    
    //this renders the original submission form | there is another form which is the results handled in the clp_survey_results_page.js file

    // Set up the form container.
    let canvas = $(".page-section");
    canvas.addClass("hide");
    $(".page-loader-header").removeClass("hide");

    // Create and insert the form container sections.
    let clp_form_container_html = clp_business_rules.create_form_sections([
        "Client Survey Programme"
    ]);

    $(".page-section").html(clp_form_container_html);

    $("div[form-navigation-target='Client Survey Programme']").html(
        sharepoint_utilities.create_container_form(
            clp_field_configuration.survey_form,
            "client-survey-section"
        )
    );    
    // Apply form plugins.
    sharepoint_utilities.apply_form_plugins(clp_field_configuration.survey_form);   

    let client_name = "";
    //show the form section
    setTimeout(() => {
        //if there are results show them
        if(data_result.length > 0){
            client_name = data_result[0].clientName
        
            sharepoint_utilities.display_saved_list_fields(data_result, clp_field_configuration.survey_form, ".client-survey-section");
            clp_business_rules.handle_form_status(data_result[0].surveyStatus);
            clp_business_rules.handle_view_modes(clp_app_main["mode"]);          
            //remove loader - when all the results have loaded  
        }else{

            //set the unique period - this is a hidden field
            let period_value = moment().format("YYYY") + moment().quarter();
            sharepoint_utilities.set_field_value("Period",period_value);       
        }   
        
        client_risk_assesments.render_task_code_component(client_name,"taskCode")

        canvas.removeClass("hide");
        $(".page-loader-header").addClass("hide");
        canvas.find("div[form-navigation-target='Client Survey Programme']").removeClass("hide");
    }, 2000);
   
}

clp_business_rules.create_form_sections = function(array_of_sections) {

    let section_html = "<div id='field_section_container'>";
    for (let index = 0; index < array_of_sections.length; index++) {
        const section = array_of_sections[index];
        section_html += `
            <div form-navigation-target='${section}' class='page-section-form-container hide'></div>
        `;
    }
    section_html += "</div>";
    return section_html;
}

clp_business_rules.handle_view_modes =function(view_mode){

    switch(view_mode){

        case "view":
            sharepoint_utilities.lock_form($("div[form-navigation-target='Client Survey Programme']"))
        break;

        default:

        break;
    }
}

clp_business_rules.handle_form_status = function(form_status){

    sharepoint_utilities.hide_fields(["btn-submit-clp-request","btn-approve-clp-request"])

    switch(form_status){

        case "Pending Partner Approval":
            //approval no longer needed
            sharepoint_utilities.show_fields(["btn-submit-clp-request"])
        break;

        case "Submitted":            
            //approval no longer needed
            //sharepoint_utilities.show_fields(["btn-approve-clp-request"])
        break;   
        
        case "Submitted - Pending Response":

        break;

        case "Feedback Received":

        break;

        case "Removal Requested":

        break;

        case "Removal Approved":
            
        break;

        case "Removal Rejected":           
            sharepoint_utilities.show_fields(["btn-approve-clp-request"])
        break;
    }
}

clp_business_rules.get_client_details = function(client_code){

    let get_client_details = sharepoint_utilities.get_list_items_by_title(
                                    app_configuration.client_list_site_context, 
                                    "*",
                                    "M_ClientCode eq '"+client_code+"'",
                                    app_configuration.client_list_name,
			                        "Id desc"
                                )
		
    let get_ac_details = sharepoint_utilities.get_list_items_by_title(
                                    app_configuration.site_context, 
                                    "ClientServiceLine,RequestOffice,EngagementManager/Title,EngagementManager/Id,EngagementPartner/Id,EngagementPartner/EMail"+
                                    "&$expand=EngagementManager/Title,EngagementManager/Id,EngagementPartner/Id,EngagementPartner/EMail",
                                    "ClientCode eq '"+client_code+"'",
                                    app_configuration.ac_submission,
			                        "Id desc"
                                )
    
    $.when(get_client_details,get_ac_details)		
	.done(function(client_results,ac_results){

        //set office
        if(ac_results.length > 0){
            sharepoint_utilities.set_field_value("office",ac_results[0].RequestOffice);
            sharepoint_utilities.set_field_value("serviceLine",ac_results[0].ClientServiceLine)
            //set partner if available
            sharepoint_utilities.force_select_2_value(                
                ac_results[0].EngagementPartner.EMail,
                ac_results[0].EngagementPartner.Id,
                $("select[data-sp-element-name='partnerId']")
            )

            //set manager if available
            $("select[data-sp-element-name='managersId']").html(`<option value='${ac_results[0].EngagementManager.Id}'>${ac_results[0].EngagementManager.Title}</option>`);
            $("select[data-sp-element-name='managersId']").val([ac_results[0].EngagementManager.Id]);
            $("select[data-sp-element-name='managersId']").trigger('change.select2');	

        }

        if(client_results.length >0){
            //set client contact email if available
            sharepoint_utilities.set_field_value("clientContactName",client_results[0].M_ClientContactName); 
            sharepoint_utilities.set_field_value("clientContactEmail",client_results[0].M_ClientContactEmail); 
            sharepoint_utilities.set_field_value("clientContactPhone",client_results[0].M_ClientContactPhone); 
            sharepoint_utilities.set_field_value("clientGroupCode",client_results[0].ClientGroupCode); 
        }   
    });

}


clp_business_rules.approve_and_send_survey_to_client = function(){

    let reference_id = parseInt(app_configuration.form_reference_id);   
    let get_meta_package = sharepoint_utilities.create_meta_package($("div[form-navigation-target='Client Survey Programme'] > div"));  
    sharepoint_utilities.render_notification
    (
        "Checking your approval",
        "Please wait while we check your approval",
        "Info|Warning"
    )  
    
    if(get_meta_package.IsValid){

        sharepoint_utilities.set_field_value("surveyStatus","Submitted");
        let update_item = sharepoint_utilities.update_item 
                (                  
                    app_configuration.clp_list_name,
                    app_configuration.site_context,
                    get_meta_package.meta_package,
                    reference_id
                )
        $.when(update_item)
            .done(function(){

                sharepoint_utilities.render_notification
                (
                    "Submission Success",
                    "Please wait while we send out the approval notification",
                    "Info"
                )
                clp_app_main.create_general_notification(reference_id.toString(),"Submitted");
                $("#Left-sticky-menu li[title='Client Listening Programme']").click();
            
        });
    }else{
        sharepoint_utilities.render_notification
        (
            "Cannot Approve Submission",
            get_meta_package.validation_message,
            "Warning"
        )
    }  
    
}


clp_business_rules.create_new_survey_request = function(){

    let field_properties = sharepoint_utilities.get_field_values(["taskCode","clientCode","Period"]);      
    sharepoint_utilities.render_notification
    (
        "Checking your submission details",
        "Please wait while we validate your submission",
        "Info"
    )
    $.when(clp_business_rules.check_for_duplicate_submission())
    .done(function(no_duplicate_exists){

        if(no_duplicate_exists){

            sharepoint_utilities.set_field_value("surveyStatus","Submitted")
            sharepoint_utilities.set_field_value("Title",clp_business_rules.create_unique_title(field_properties.meta_package));  

            let get_meta_package = sharepoint_utilities.create_meta_package($("div[form-navigation-target='Client Survey Programme'] > div"));  
            let field_values = clp_business_rules.clean_fields(get_meta_package.meta_package);   
            let valid_email = clp_business_rules.validate_email(field_values["clientContactEmail"]);

            if(valid_email){
                if(get_meta_package.IsValid){  
                    
                    let create_item = sharepoint_utilities.save_item
                        (
                            app_configuration.clp_list_name,
                            app_configuration.site_context,
                            field_values
                        );
                    $.when(create_item)
                        .done(function(item_id){

                            clp_app_main.create_general_notification(item_id.Id.toString(),"Submitted");
                            sharepoint_utilities.render_notification
                            (
                                "Submission Success",
                                "Please wait while we send out the approval notification",
                                "Info"
                            )
                            //intiate the notification                            
                            $("#Left-sticky-menu li[title='Client Listening Programme']").click();
                    });  

                }else{
                    sharepoint_utilities.render_notification
                    (
                        "Cannot submit",
                        get_meta_package.validation_message,
                        "Warning"
                    )      
                }
            }
        }
    });  
};

clp_business_rules.validate_email = function(email_address){
    // Validate client email address
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let is_valid = true;
    if (!emailRegex.test(email_address)) {
        sharepoint_utilities.render_notification("Cannot submit", "Please provide a valid email address.", "Warning");
        is_valid = false;
    }

    return is_valid
}

clp_business_rules.clean_fields = function(meta_package){

   for (const [key, value] of Object.entries(meta_package)) {

        if(value){
             if (typeof value === 'string') {
                meta_package[key] = value.trim(); 
            }
        }     
   }  

    return meta_package
}

clp_business_rules.create_unique_title = function(get_meta_package){

    // Generate the new Title based on clientCode, taskCode, and Period
    let clientCode = get_meta_package["clientCode"] || "";
    let taskCode = get_meta_package["taskCode"] || "";
    let period = get_meta_package["Period"] || "";
    let unique_str = clientCode + "-" + taskCode + "-" + period;
    let hash = CryptoJS.MD5(unique_str).toString().substring(0, 8).toUpperCase();
    let generated_title = "CLP-" + hash;   

    return generated_title
}

clp_business_rules.check_for_duplicate_submission = function(){

    let CreatePromise = $.Deferred();
    let no_duplicate_exists = false;

    let get_meta_package = sharepoint_utilities.create_meta_package($("div[form-navigation-target='Client Survey Programme'] > div")).meta_package;
    sharepoint_utilities.hide_fields(["btn-submit-clp-request"]);      
    
    let duplicate_filter = "Period eq '"+get_meta_package["Period"]+"' "+                           
                            "and clientGroupCode eq '"+get_meta_package["clientGroupCode"]+"'" +
                               " and taskCode eq '" + get_meta_package["taskCode"] +"'" +
                                    " and surveyStatus eq 'Submitted'";


    let get_list_items = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "*,Author/Title&$expand=Author/Title",
            duplicate_filter,
            app_configuration.clp_list_name,
            "Id desc"
        )
    $.when(get_list_items).
        done(function(item_results){
    
           if(item_results.length > 0){
                sharepoint_utilities.render_notification
                (
                    "Survey already exists",
                    "A submission (##" + item_results[0].Id + " - "+item_results[0].surveyStatus+") submitted by "+item_results[0].Author.Title+" already exists for this quarter and task code ("+item_results[0].taskCode+")",
                    "Warning"
                )    
                no_duplicate_exists = false;
           }else{

                sharepoint_utilities.show_fields(["btn-submit-clp-request"]); 
                no_duplicate_exists = true;
           }
           CreatePromise.resolve(no_duplicate_exists);
        }); 

    return CreatePromise.promise();
}


/*
clp_business_rules.save_or_update_form = function(){

    //we need to separate this out into 2 buttons
    //one for approval and one for original submission - once you submit , it goes to the partner to approve to send out to client
    //add some kind of tick box to do so

    $("div[form-navigation-target='Client Survey Programme'] select[data-sp-element-name='surveyStatus']").val("Submitted").change();
    let get_meta_package = sharepoint_utilities.create_meta_package($("div[form-navigation-target='Client Survey Programme'] > div"));
    // Refresh meta_package with latest values from the DOM for each field in the survey form.
    clp_field_configuration.survey_form.forEach(function(field) {
        let fieldElem = $("div[form-navigation-target='Client Survey Programme'] [data-sp-element-name='" + field.sp_field_name + "']");
        if(fieldElem.length > 0) {
            let fieldValue = fieldElem.val();
            if (typeof fieldValue === "string") {
                get_meta_package[field.sp_field_name] = fieldValue.trim();
            } else {
                get_meta_package[field.sp_field_name] = fieldValue;
            }
        }
    });
    // Explicitly update taskCode from the DOM (try both input and select elements)
    let taskCodeInput = $("div[form-navigation-target='Client Survey Programme'] [data-sp-element-name='taskCode']"); // Broader selector
    if (taskCodeInput.length > 0 && taskCodeInput.val()) {
        let newTaskCode = taskCodeInput.val().trim();
        get_meta_package["taskCode"] = newTaskCode;
    }
    // Validate client email address
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(get_meta_package["clientContactEmail"])) {
        sharepoint_utilities.render_notification("Error", "Please provide a valid email address.", "Warning");
        return;
    }
    
    // Generate the new Title based on clientCode, taskCode, and Period
    let clientCode = get_meta_package["clientCode"] || "";
    let taskCode = get_meta_package["taskCode"] || "";
    let period = get_meta_package["Period"] || "";
    let unique_str = clientCode + "-" + taskCode + "-" + period;
    let hash = CryptoJS.MD5(unique_str).toString().substring(0, 8).toUpperCase();
    let generated_title = "CLP-" + hash;
    get_meta_package["Title"] = generated_title;

    // Check for duplicates excluding the current form (if editing)
    let filterQuery = "Title eq '" + generated_title.replace(/'/g, "''") + "'";
    if (app_configuration.form_reference_id) {
        filterQuery += " and Id ne " + app_configuration.form_reference_id; 
    }
    let queryUrl = app_configuration.site_context + "/_api/web/lists/getByTitle('" + app_configuration.clp_list_name + "')/items?$filter=" + encodeURIComponent(filterQuery);

    $.when(sharepoint_utilities.get_items_by_url(queryUrl))
    .done(function(results) {
        if (results && results.length > 0) {
            sharepoint_utilities.render_notification("Error", "A survey with this client, task code, and period combination already exists. Please modify your inputs or edit the existing survey.", "Warning");
            return;
        } else {
            // Update the Title field in the UI before saving
            let titleInput = $("div[form-navigation-target='Client Survey Programme'] input[data-sp-element-name='Title']");
            if (titleInput.length > 0) {
                titleInput.prop("disabled", false);
                titleInput.val(generated_title);
                titleInput.prop("disabled", true);
            }
            if (app_configuration.form_reference_id) {
                // Update the form
                sharepoint_utilities.vaildate_meta_package_for_updates(
                    get_meta_package,
                    app_configuration.site_context,
                    app_configuration.clp_list_name,
                    app_configuration.form_reference_id,
                    function() {
                        // Update main["selected_clp_data"] to reflect the new values
                        if (main["selected_clp_data"] && main["selected_clp_data"][0]) {
                            main["selected_clp_data"][0].Title = generated_title;
                            main["selected_clp_data"][0].taskCode = taskCode;
                        }
                        clp_app_main.render_submissions_table();
                    },
                    function(error) {
                    }
                );
            } else {
                // Create a new form
                sharepoint_utilities.vaildate_meta_package(
                    get_meta_package,
                    app_configuration.site_context,
                    app_configuration.clp_list_name,
                    function(result) {
                        clp_business_rules.form_reference_id = result.Id;
                        clp_app_main.render_submissions_table();

                        
                    },
                    function(error) {
                    }
                );
            }
        }
    })
    .fail(function(error) {
        // If the duplicate check fails, proceed with save/update anyway (optional fallback)
        if (app_configuration.form_reference_id) {
            sharepoint_utilities.vaildate_meta_package_for_updates(
                get_meta_package,
                app_configuration.site_context,
                app_configuration.clp_list_name,
                app_configuration.form_reference_id,
                function() { clp_app_main.render_submissions_table(); },
                function() {}
            );
        } else {
            sharepoint_utilities.vaildate_meta_package(
                get_meta_package,
                app_configuration.site_context,
                app_configuration.clp_list_name,
                function(result) {
                    clp_business_rules.form_reference_id = result.Id;
                    clp_app_main.render_submissions_table();
                },
                function() {}
            );
        }
    });
}

 //clp_business_rules.render_task_code_component(client_name, "taskCode");

    
    /*
    mode = mode || "new";
    if (mode === "new") {
        app_configuration.form_reference_id = null;
    
    }
    
    */

    /*

    // Declare and initialize savedData from main["selected_clp_data"]
    //let savedData = (main["selected_clp_data"] && main["selected_clp_data"].length > 0) ? main["selected_clp_data"] : [{}];

    // Insert the form fields with conditional display of temp-search-client-name.
    let fieldsToRender = clp_field_configuration.survey_form.filter(function(field) {
        if (field.sp_field_name === "temp-search-client-name" && mode !== "new") {
            // Display the field only if clientCode or taskCode is blank.
            return (!savedData[0].clientCode || !savedData[0].taskCode);
        }
        return !field.hasOwnProperty("displayOn") || field.displayOn === mode;
    });
    
    // Add conditional hiding for clientName field in edit mode and dynamically update description for temp-search-client-name
    fieldsToRender = fieldsToRender.map(field => {
        if (field.sp_field_name === "clientName" && mode === "edit" && (!savedData[0].clientCode || !savedData[0].taskCode)) {
            return { ...field, sp_additional_properties: field.sp_additional_properties ? field.sp_additional_properties + " hide-field" : "hide-field" };
        } else if (field.sp_field_name === "temp-search-client-name" && mode === "edit" && (!savedData[0].clientCode || !savedData[0].taskCode)) {
            // Update description only for this specific condition
            return { ...field, Description: "The current selected client has a blank client- or task code. Please re-select your client below to continue" };
        }
        return field;  // Return the original field otherwise
    });

    */

    


    /*
    if(mode === "new"){
         sharepoint_utilities.hide_fields(["clientName"]);       
    }
    

    let consolidated_fields = clp_field_configuration.survey_form;
    
    // Filter out fields that shouldn’t be re-populated
    let filtered_fields = consolidated_fields.filter(function(field) {
        return field && field.sp_field_name !== "temp-search-client-name" && field.sp_field_type !== "button";
    });
    
    // For edit/read modes, normalize savedData to ensure consistent structure.
    if (mode !== "new") {
        if (savedData[0]["temp-search-client-name"] == null) {
            savedData[0]["temp-search-client-name"] = savedData[0].clientName || "";
        }
    }

    */

  
    

    /*
    // Fetch user details from User Information List for partner and managers
    let partnerId = savedData[0].partnerId || (savedData[0].partner && savedData[0].partner.Id) || (savedData[0].partnerStringId ? parseInt(savedData[0].partnerStringId, 10) : null);
    let managersIds = savedData[0].managersId || (savedData[0].managers ? savedData[0].managers.map(m => m.Id || m) : savedData[0].managersStringId || []);
    
    if (partnerId || managersIds.length > 0) {
        let userIds = [partnerId].filter(id => id !== null && typeof id === "number");
        if (Array.isArray(managersIds)) {
            userIds = userIds.concat(managersIds.map(m => typeof m === "object" && m.Id ? m.Id : typeof m === "number" ? m : parseInt(m, 10)).filter(id => typeof id === "number"));
        }
        userIds = [...new Set(userIds)]; // Remove duplicates
    
        if (userIds.length > 0) {
            let restEndpoint = "https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/_api/web/lists/getbytitle('User Information List')/items";
            let filterQuery = userIds.map(id => `Id eq ${id}`).join(' or ');
            let fullUrl = `${restEndpoint}?$select=Id,Title&$filter=${encodeURIComponent(filterQuery)}`;
    
            $.when(sharepoint_utilities.get_items_by_url(fullUrl))
            .done(function(userData) {
                let usersMap = {};
                userData.forEach(user => {
                    usersMap[user.Id] = user.Title;
                });
    
                if (partnerId && usersMap[partnerId]) {
                    savedData[0].partner = { Id: partnerId, Title: usersMap[partnerId] };
                } else {
                    savedData[0].partner = partnerId ? { Id: partnerId, Title: "User " + partnerId } : null;
                }
    
                if (userIds.length > 0) {
                    savedData[0].managers = managersIds.map(m => {
                        let id = m.Id || m;
                        return { Id: parseInt(id, 10), Title: usersMap[id] || "User " + id };
                    });
                } else {
                    savedData[0].managers = [];
                }
    
                renderForm();
            })
            .fail(function(error) {
                savedData[0].partner = partnerId ? { Id: partnerId, Title: "User " + partnerId } : null;
                savedData[0].managers = managersIds.map(m => ({ Id: parseInt(m.Id || m, 10), Title: "User " + (m.Id || m) }));
                renderForm();
            });
        } else {
            savedData[0].partner = null;
            savedData[0].managers = [];
            renderForm();
        }
    } else {
        savedData[0].partner = null;
        savedData[0].managers = [];
        renderForm();
    }

    */
    /*
    function renderForm() {
    
        // Render the fields
        try {
            sharepoint_utilities.display_saved_list_fields(savedData, filtered_fields, ".client-survey-section");
            // Ensure taskCode is rendered as a select and set initial value
            let clientName = savedData[0].clientName || "";
            if (clientName) {
                clp_business_rules.render_task_code_component(clientName, "taskCode");
                setTimeout(() => {
                    let taskCodeField = $("div[app-name='Client Listening Programme'] select[data-sp-element-name='taskCode']");
                    if (taskCodeField.length > 0 && savedData[0].taskCode) {
                        taskCodeField.val(savedData[0].taskCode);
                        console.log("Initial taskCode set from savedData:", savedData[0].taskCode);
                    }
                }, 1000); // Delay to ensure render_task_code_component completes
            }
        } catch (e) {
            console.error("Error in display_saved_list_fields:", e, "Saved data:", savedData, "Filtered fields:", filtered_fields);
        }
    }
    /*
    setTimeout(function() {
        if (mode === "new" || (mode === "edit" && $("div[form-navigation-target='Client Survey Programme'] [data-sp-element-name='surveyStatus']").val() === "Pending Submission")) {
            
            let periodVal = moment().format("YYYY") + moment().quarter();
            $("div[form-navigation-target='Client Survey Programme'] input[data-sp-element-name='Period']").val(periodVal);
        }
        canvas.removeClass("hide");
        $(".page-loader-header").addClass("hide");
        canvas.find("div[form-navigation-target='Client Survey Programme']").removeClass("hide");
        $("ul[data-app-name='Client Listening Programme']").removeClass("disable-interaction");
        if (mode === "read") {
            $(".client-survey-section").find("[data-sp-element-name='create-new-clp-form']").hide();
            $(".client-survey-section").find("input, select, textarea").prop("disabled", true);
        }
    }, 2500);
    */

/*
clp_business_rules.render_task_code_component = function(client_name, task_code_field_name) {
    let clean_client_name = main.clean_client_name(client_name);

    $.when(
        sharepoint_utilities.get_list_items_by_title(
            app_configuration.client_list_site_context,
            "TaskCodes",
            "M_ClientName eq '" + clean_client_name + "'",
            app_configuration.client_list_name,
            "Id desc"
        )
    ).done(function(task_code_results) {
        let task_code_options = [];

        for (let index = 0; index < task_code_results.length; index++) {
            const task_code_field = task_code_results[index].TaskCodes;
            if (task_code_field) {
                if (task_code_field.indexOf("|") >= 0) {
                    let list_of_task_codes = task_code_field.split("|");
                    for (let i = 0; i < list_of_task_codes.length; i++) {
                        task_code_options.push(list_of_task_codes[i]);
                    }
                } else {
                    task_code_options.push(task_code_field);
                }
            }
        }

        // Use the radio button rendering function
        clp_business_rules.render_task_codes(task_code_options, task_code_field_name);

        // Set the initial value
        setTimeout(() => {
            let savedTaskCode = main["selected_clp_data"] && main["selected_clp_data"][0] ? main["selected_clp_data"][0].taskCode : null;
            if (savedTaskCode && task_code_options.includes(savedTaskCode)) {
                sharepoint_utilities.set_radio_value(task_code_field_name, savedTaskCode);
            }
        }, 2000);
    });
}

clp_business_rules.render_task_codes = function(list_of_client_codes,task_code_field_name){

    let form_json_field_properties = {
        "Title":"Client task code",
        "Description":"The task code from greatsoft that applies to this client",
        "sp_field_name":task_code_field_name,
        "own_values":list_of_client_codes
    }

    // Adjustments to hide the title, description, and input box
    let sp_field_name = form_json_field_properties.sp_field_name;
    let plugin_container = $("div[sp-field-name='"+sp_field_name+"']");

    plugin_container.find(".radio-button-component").remove()
    sharepoint_utilities.create_radio_buttons_with_own_values(form_json_field_properties);    
    //adjust for the various heights
    $("div[sp-field-name='"+task_code_field_name+"'] .field-component .radio-button-component").css("height","auto"); 

    //check for an existing value and select it.
    let field_properties = sharepoint_utilities.get_field_values([task_code_field_name]); 
    if(field_properties.meta_package[task_code_field_name]){
        sharepoint_utilities.set_radio_value(task_code_field_name,field_properties.meta_package[task_code_field_name])
    }
     
    
   
}*/
