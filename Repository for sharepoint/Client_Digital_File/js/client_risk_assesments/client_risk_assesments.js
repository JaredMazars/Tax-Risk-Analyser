let client_risk_assesments = {}

$(document).on("click",".client-acceptance-general input[data-sp-element-name='client-risk-assessments-create-button']",function(){
    //button to create a new acceptance
    client_risk_assesments.prompt_new_acceptance_record();
});

$(document).on("click",".client-continuance-general input[data-sp-element-name='client-risk-assessments-create-button']",function(){
    //button to create a new acceptancess
    client_risk_assesments.prompt_new_continuance_record();
});

$(document).on("click","div[app-name='Client Acceptance and Continuance'] input[title='Next']",function(){
    //button to create a new acceptance
    client_risk_assesments.go_to_next_section();
});

$(document).on("click","div[app-name='Client Acceptance and Continuance'] input[title='Back']",function(){
    //button to create a new acceptance
    client_risk_assesments.go_back_to_section();
});

$(document).on("click", "div[app-name='Client Acceptance and Continuance'] input[data-sp-element-name='new-acceptance-action-button']", function(){
      
    //handles the creation of a new acceptance form
    let record_properties = {
        "item_id":0,
        "action_type":"Acceptance",
        "data_source_type":"Current",
        "form_type":"Acceptance",
        "form_status":"new"
    }     
    client_risk_assesments.render_acceptance_form_html(record_properties);    

    //display the template option
    //Remove template option from the ClientAcceptanceType column  in the AC Submissions list
    //sharepoint_utilities.show_fields(["template-selector"]);
});


$(document).on("click", "ul[data-app-name='Client Acceptance and Continuance'] li", function(){

    let get_section_name = $(this).attr("data-link-id");

    app_configuration["previous-selected-section"] = app_configuration["currently-selected-section"];
    app_configuration["currently-selected-section"] = $(this) 

    client_risk_assesments.show_section(get_section_name);   
    
});


$(document).on("click", "#client_search_assessents_table tbody tr td i", function(){
 
    client_risk_assesments.handle_table_action_buttons($(this));
});

// === resignation icon - switch this to save form + update the status based on resignation button
// === resignation save the action

$(document).on("click", "input[data-sp-element-name='btn-resign-from-engagement']", function(){
     

    let submission_data = {
        "item_id":main.selected_client_risk_data.Id,
        "action_type":main.selected_client_risk_data.action_type,
        "data_source_type":"current",
        "form_type":"exisiting",
        "form_x0020_status":"Resigned"
    }   

    let custom_options = {
        "Yes":continue_to_resign,
        "No":function(){}
    }

    sharepoint_utilities.render_confirmation_box("Resign from the current engagement","Are you sure you want to resign from this engagement?",custom_options,"50%");

    function continue_to_resign(){
        // run the function to check if the resignation document has been uploaded
        supporting_documents.append_to_current_document_required("Resignation Letter");
        supporting_documents.resignation_validation(submission_data);        
    }
       
});


$(document).on("change", "input[data-sp-element-name='Q12PartA']", function(){ 
    
    client_risk_assesments.check_if_rely_comply_assesment_is_required();
});



$(document).on("click", "input[data-sp-element-name='sp-temp-bulk-mark-risks-part-a']", function(){ 

    client_risk_assesments.mark_all_risks_in_bulk($("div[form-navigation-target='Part A - Risk Considered as Major']"),"Low / Standard");
    // $('input[name="Q1PartA"]:eq(0)').click();
    $('input[name$="PartA"]').each(function() {
        $(this).filter('[value="Low / Standard"]').click();
    });

});

$(document).on("click", "input[data-sp-element-name='sp-temp-bulk-mark-risks-part-b']", function(){ 

    client_risk_assesments.mark_all_risks_in_bulk($("div[form-navigation-target='Part B - Risk Considered as Normal']"),"Low / Standard");
    $('input[name$="PartB"]').each(function() {
       //$(this).filter('[value="Low / Standard"]').prop('checked', true);
       $(this).filter('[value="Low / Standard"]').click();
    });    
});
//contiunace lite form

$(document).on("click", "input[data-sp-element-name='sp-temp-bulk-mark-risks-as-no-part-a']", function(){ 

    client_risk_assesments.mark_all_risks_in_bulk($("div[form-navigation-target='Part A - Risk Considered as Major']"),"No");

});

$(document).on("click", "input[data-sp-element-name='sp-temp-bulk-mark-risks-as-no-part-b']", function(){ 

    client_risk_assesments.mark_all_risks_in_bulk($("div[form-navigation-target='Part B - Risk Considered as Normal']"),"No");
    
});

$(document).on("click", "input[data-sp-element-name='sp-temp-bulk-mark-risks-as-no-ac-lite']", function(){ 

    client_risk_assesments.mark_all_risks_in_bulk($("div[form-navigation-target='LITE']"),"No");
    
});

$(document).on("click", "div[sp-field-name*='ACLite']", function(){ 

    client_risk_assesments.mark_all_risks_in_bulk($("div[form-navigation-target='LITE']"),"No");    
});

$(document).on("click", "input[data-sp-element-name='sp-temp-bulk-mark-risks-as-no-independence']", function(){ 

    client_risk_assesments.mark_all_risks_in_bulk($("div[form-navigation-target='Indpendence and other considerations']"),"No");
    
});

$(document).on("change",".custom-lite-form-answers div[sp-additional-properties='radio-buttons-own-values'] input",function(){

    client_risk_assesments.continuance_lite_risk_rules()
})

$(document).on("change", "select[data-sp-element-name='ClientAcceptanceType']", function(){

    client_risk_assesments.rule_engine();
    

});


$(document).on("change","select[data-sp-element-name='ApplicableStandard']",function(){

    client_risk_assesments.run_applicable_standard_rules();   

});

$(document).on("change", "input[data-sp-element-name='IsCarlPartner']", function(){
    client_risk_assesments.carl_partner_validation();

})

$(document).on("change", "input[data-sp-element-name='s90Calculator']", function(){
    assurance_functions.display_s90_considerations()
});



$(document).on("change", "select[data-sp-element-name='ApplicableStandard']", function(){

    sharepoint_utilities.hide_fields(["ApplicableStandardOther"])
    sharepoint_utilities.set_fields_as_not_required(["ApplicableStandardOther"])
   
});

$(document).on("change","input[data-sp-element-name='MoneyLaunderingRisk'], select[data-sp-element-name='NASRiskyServices']",function(){

    client_risk_assesments.determine_risk_status()
    
});

$(document).on("change","input[data-sp-element-name='IsNaturalPerson']",function(){   
    client_risk_assesments.check_relevant_source_of_funds();    
});

$(document).on("change","select[data-sp-element-name='SourceOfFunds']",function(){   
    client_risk_assesments.check_relevant_source_of_funds();    
});

$(document).on("change","select[data-sp-element-name='MazarsServiceLine']",function(){

    let selected_value = $(this).val();
    client_risk_assesments.set_client_service_line_field(selected_value)

    let field_properties = sharepoint_utilities.get_field_values(["ClientAcceptanceType"]).meta_package;   
    client_risk_assesments.cascade_list_of_services(field_properties.ClientAcceptanceType,selected_value);
    client_risk_assesments.giac_form_validation();
    client_risk_assesments.business_sustainablity_form_rules();
    client_risk_assesments.check_if_rely_comply_assesment_is_required();

    
});


$(document).on("change","input[data-sp-element-name='IsKYCClient']",function(){

    let current_value = $(this).val();
    if(current_value == "No" || current_value == "N/A"){
         $("li[data-link-id='Know your client (KYC) procedures performed']").addClass("nav-item-disabled");
    }else{
        $("li[data-link-id='Know your client (KYC) procedures performed']").removeClass("nav-item-disabled");
    }
});


$(document).on("click","#Left-sticky-menu li[title='Client Acceptance and Continuance']",function(){

    //clear the breadcrumb
    client_risk_assesments.reset_form();

    if(!main["system_click"]){
        setTimeout(function(){        
            client_risk_assesments.render_risk_assesment_search();
        },500); 
    }    
});



$(document).on("change","select[data-sp-element-name='temp-assesment-search']",function(){

    client_risk_assesments.render_selected_client_acceptance_continuance($(this).val());
});

$(document).on("change","select[data-sp-element-name='temp-assesment-search-by-code']",function(){

    client_risk_assesments.render_selected_client_acceptance_continuance($(this).val());
});


$(document).on("change","input[data-sp-element-name='subcontractors']",function(){

    client_risk_assesments.render_subcontractor_conditional() 
});


$(document).on("change","div[form-navigation-target='Business Sustainability'] input[data-sp-element-name='IsIndependant']",function(){

    client_risk_assesments.business_sustainablity_form_rules() 
});

client_risk_assesments.business_sustainablity_form_rules 

client_risk_assesments.lockdown_sync_client_details = function(){

    let field_properties = sharepoint_utilities.get_field_values(["ClientTaskCode","ClientName","AuditSoftwarePackageUsed","ClientIndustry"]);    
    let reference_id = main["selected_client_risk_data"].Id

    let meta_package = {
        "ClientName":field_properties.meta_package["ClientName"],
        "TaskCode":sharepoint_utilities.check_for_null(field_properties.meta_package["ClientTaskCode"],"Not Applicable"),
        "IndustryType":field_properties.meta_package["ClientIndustry"],
        "AuditSoftwarePackageUsed":field_properties.meta_package["AuditSoftwarePackageUsed"]
    }

    if(reference_id){

        let check_for_lockdown_item = sharepoint_utilities.get_list_items_by_title
            (
                app_configuration.site_context, 
                "Id",
                "QRMACReference eq '"+reference_id +"'",
                app_configuration.lockdown_list_name,
                "Id desc"
            )
        $.when(check_for_lockdown_item).
        done(function(item_results){

            //logic with results
            if(item_results.length > 0){
                //update the existing lockdown form with the new task code and client name
                let update_item = sharepoint_utilities.update_item 
                    (
                        app_configuration.lockdown_list_name,
                        app_configuration.site_context,
                        meta_package,
                        item_results[0].Id
                    )
                $.when(update_item)
                    .done(function(){
                    
                });
            }
            
        });   
    }

}

client_risk_assesments.render_data_from_email = function(request_meta){

    $(".assesment-drop-down-container").addClass("hide");   

    let action_element = $("<i></i>");
    action_element.attr("data-itemid",request_meta.item_id)
    action_element.attr("title","View the current submission");
    action_element.attr("data-action-type",request_meta.acceptance_or_continuance);
    action_element.attr("data-source-type","current");
    
    client_risk_assesments.handle_table_action_buttons(action_element);    
    
}

client_risk_assesments.handle_table_action_buttons = function(action_element){

    //hack fix to stop the search box from flashing
    main["system_click"] = false;

    setTimeout(function(){
        let submission_data = {
            "item_id":action_element.attr("data-itemid"),
            "action_type":action_element.attr("data-action-type"),
            "data_source_type":action_element.attr("data-source-type"),
            "form_type":action_element.attr("data-action-type"),
            "form_status":"existing"
        }      

        client_risk_assesments.action_element_status = action_element.attr("title")

        switch(action_element.attr("title")){

            case "Create new continuance":
                client_risk_assesments["new_continuance_form"] = "yes";
                //we adjust the form lookup in this function below
                client_risk_assesments.get_continuance_form(action_element);
               
            break;

             case "Resign from engagement":                     

                supporting_documents.quick_action_resignation(submission_data);

            break;

            case "View the current submission":
                if(submission_data.data_source_type == "archives"){
                    list_name = app_configuration.archive_list_name;
                    list_context = app_configuration.archive_ac_submission_site_context;
            
                    //redirect user to the old site to complete it there first.
                    let archive_site_url = app_configuration.ac_archive_link_url +"/EditForm.aspx?ID="+submission_data.item_id+
                    "&Source="+app_configuration.mazars_intranet;
                    window.open(archive_site_url,"_blank");
                }else
                if(submission_data.action_type== "Acceptance"){
                    client_risk_assesments.render_acceptance_form_html(submission_data); 
                }else{      
                    client_risk_assesments.render_continuance_form_html(submission_data);                      
                } 
            break;

            case "Reset the current submission back into progress":

                custom_options = {
                    "Yes":continue_to_reset,
                    "No":function(){}
                }
            
                sharepoint_utilities.render_confirmation_box("Reset Submission",
                    "Are you sure you want to reset this submission? <br/>" +
                    "This will reset the form and remove all approvers.<br/> "+
                    "This is required when you have made a mistake and wish to correct it whilst its under approval | declined or it has been cancelled.",
                    custom_options,"50%"
                );
            
                function continue_to_reset(){
                    client_risk_approvals.create_notification(_spPageContextInfo.userId,"Workflow handled","ResetSubmission",submission_data.item_id);	
                    sharepoint_utilities.render_notification("Resetting Submission","Please wait while we reset your submission, you will receive an email confirmation when the process has completed.","Info");
                    setTimeout(function(){
                        //refresh the table
                        client_risk_assesments.render_selected_client_acceptance_continuance($("select[data-sp-field-name='temp-assesment-search']").val())
                    },2000)
                } 
            break;
            
            case "Cancel the current submission":

                custom_options = {
                    "Yes":continue_to_cancel,
                    "No":function(){}
                }
            
                sharepoint_utilities.render_confirmation_box("Cancelling Submission","Are you sure you want to cancel this submission",custom_options,"50%");
            
                function continue_to_cancel(){
                    client_risk_approvals.create_notification(_spPageContextInfo.userId,"Workflow handled","CancelSubmission",submission_data.item_id);	
                    sharepoint_utilities.render_notification("Cancelling Submission","Please wait while we cancel your submission","Info");
                    setTimeout(function(){
                        //refresh the table
                        client_risk_assesments.render_selected_client_acceptance_continuance($("select[data-sp-field-name='temp-assesment-search']").val())
                    },2000)
                }       
                
            break;

            case "Download the pdf":
                //creates a new continuance based on the last record found
                client_risk_assesments.download_pdf(action_element)
            break;
        }
    },500)

}


client_risk_assesments.reset_form = function(){
    $("#main-canvas-container div.bread-crumb").html(null);
    $("#main-canvas-container div.page-section-header").html(null);

    $(".right-help-comments-section-panel").addClass("hide");
    $("#main-canvas-container").removeClass("col-5");
    $("#main-canvas-container").addClass("col-8");
    $(".right-help-comments-content").html(null);

    sharepoint_utilities.field_comments_list = null
    warning_controller["warning_cache"] = null

}

client_risk_assesments.rule_engine = function(){
   
    var ServiceType = $("select[data-sp-element-name='ClientAcceptanceType']").val();   
    
    /* default sections to hide that depend on the selection types - these are dynamic sections */    
    $("li[data-link-id='S90 Calculator']").addClass("nav-item-disabled"); 
    $("li[data-link-id='S90 Considerations']").addClass("nav-item-disabled");   
    $("li[data-link-id='Fee Considerations']").addClass("nav-item-disabled");
    
    $("li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
    $("li[data-link-id='EQR Calculator']").addClass("nav-item-disabled");
    $("li[data-link-id='Business Sustainability']").addClass("nav-item-disabled");


    $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Transnational Calculator']").addClass("nav-item-disabled");
    $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Appendix D']").addClass("nav-item-disabled");  
    $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='1. Assessment of compliance with Independence rules']").addClass("nav-item-disabled");  

    let assurance_field_set = [
        "FinancialReportingFramework", "SPACEngagment", "IPOEngagment","IsCarlPartner", "significantVariation","SignificantVariationComments",
        "recoveryOrWriteOff","StatusPerformed", "eqrCalculator", "nonAssuranceServicePerformed", 
        "Q1IsTransnational","EngagementPartnerComm","s90Calculator","SpecialistsRequired","percentageCoverGroup","IsConcurringReviewPartner",
        "PreviousFirmAppointed","group-engagement-schedule-placeholder","FinancialYearEnd","ExpectedSigningDate","Q8Independence","PreviousAuditSignOff",
        "AuditTakeover","IsTransnational","ApplicableStandard", "feeConsiderations", "NonAssuranceFeesJSON","AuditSoftwarePackageUsed"
    ]     
    sharepoint_utilities.hide_fields(assurance_field_set);
    sharepoint_utilities.set_fields_as_not_required(assurance_field_set)
    
    if(ServiceType == "Assurance" ){

        sharepoint_utilities.show_fields(assurance_field_set)
        sharepoint_utilities.set_fields_as_required(assurance_field_set)
        $("li[data-link-id='S90 Calculator']").removeClass("nav-item-disabled"); 
        $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Transnational Calculator']").removeClass("nav-item-disabled");  
        assurance_functions.general_rules(); 
        supporting_documents.append_to_current_document_required("Annual Financial Statements");     

    }   
    

    let shared_nas_fields = ["NASReport","PeriodYearEnd","NASRiskyServices"]   

    sharepoint_utilities.hide_fields(shared_nas_fields);
    sharepoint_utilities.set_fields_as_not_required(shared_nas_fields)
    //non assurance specific rules
    let non_assurance_fields = ["Q7Independence","C7Independence","IsTransnational"]
    sharepoint_utilities.hide_fields(non_assurance_fields);
    sharepoint_utilities.set_fields_as_not_required(non_assurance_fields);    

    if(ServiceType == "Non-Assurance"){    
        sharepoint_utilities.show_fields(non_assurance_fields)
        sharepoint_utilities.show_fields(shared_nas_fields)

        sharepoint_utilities.set_fields_as_required(shared_nas_fields);
        sharepoint_utilities.set_fields_as_required(non_assurance_fields);
        non_assurance_functions.general_rules();
        
        $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Transnational Calculator']").removeClass("nav-item-disabled"); 
    }   

    //appendix D Stuff
    let appendix_d_fields = ["AuditCommiteeApproval", "OtherServicesProposedFee","IsListedInUSA","IsSelfInterestThreat",
        "IsKYCClient","LeadAuditPartnerId","feeConsiderations"];
    sharepoint_utilities.hide_fields(appendix_d_fields);
    sharepoint_utilities.set_fields_as_not_required(appendix_d_fields)

    if(ServiceType == "Non assurance service on existing assurance client (Appendix D)"){
        
        $("li[data-link-id='Fee Considerations']").removeClass("nav-item-disabled");
        $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Appendix D']").removeClass("nav-item-disabled");  
        $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='1. Assessment of compliance with Independence rules']").removeClass("nav-item-disabled");  
    
        sharepoint_utilities.show_fields(appendix_d_fields);
        sharepoint_utilities.set_fields_as_required(appendix_d_fields);   

        sharepoint_utilities.show_fields(shared_nas_fields);
        sharepoint_utilities.set_fields_as_required(shared_nas_fields);  
       
        $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Appendix A Clients']").addClass("nav-item-disabled");
        //disabled entire section
        $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Appendix A Clients']").next("ul").find("li").addClass("nav-item-disabled");
       
        $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Appendix B Engagements']").addClass("nav-item-disabled");
        $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Appendix B Engagements']").next("ul").find("li").addClass("nav-item-disabled");

       // $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Appendix C Money Laundering']").addClass("nav-item-disabled");
       // $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Appendix C Money Laundering']").next("ul").find("li").addClass("nav-item-disabled");

        non_assurance_on_existing_assurance_client_functions.general_rules();
    } 
  
    //General rules that run for both NAS and NON-AS
    client_risk_assesments.cascade_service_type(ServiceType);

    client_risk_assesments.populate_nas_and_appendix_d_services();

    client_risk_assesments.render_applicable_standard_options();
    client_risk_assesments.render_subcontractor_conditional();
    client_risk_assesments.run_applicable_standard_rules();
    client_risk_assesments.giac_form_validation();
    client_risk_assesments.check_specialist_other();
    client_risk_assesments.carl_partner_validation();  
    client_risk_assesments.general_acceptance_continuance_rules();
    client_risk_assesments.display_conditional_appendix_q11();
    client_risk_assesments.validate_blacklisted();
    client_risk_assesments.is_self_interest_threat();  
    team_information_functions.run_general_rules();
    pie_form.determine_is_crypto_currency();
    client_risk_assesments.global_required_documents();   
    client_risk_assesments.determine_risk_status()
    client_risk_assesments.other_pie_entities_comments_toggle();
    client_risk_assesments.check_if_rely_comply_assesment_is_required();
    client_risk_assesments.check_relevant_source_of_funds();
    client_risk_assesments.business_sustainablity_form_rules();
}




client_risk_assesments.cascade_list_of_services = function(service_type,service_line){   

    
    let get_service_line_details = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "*",
            "ServiceType eq '"+service_type+"' and Title eq '"+service_line+"'",
            "MazarsServiceLines",
            "Title asc"
        )

    $.when(get_service_line_details).
        done(function(get_service_line_details_data){
    

            let service_lines = ""
            let list_of_services_to_display = "";         
          

            //if result found and something assigned show the assigned.
            for (let index = 0; index < get_service_line_details_data.length; index++) {
                const get_service_line_details_data_row = get_service_line_details_data[index];

                    //this cascades the service line under the general section when the servie type is selected
                service_lines +="<option value='"+get_service_line_details_data_row.Title+"'>"+get_service_line_details_data_row.Title+"</option>";    

                let cascade_options = get_service_line_details_data_row.DropDownOptions;
                if(cascade_options){
                    for (let c_index = 0; c_index < cascade_options.length; c_index++) {
                        const element = cascade_options[c_index];
                        list_of_services_to_display +="<option value='"+element+"'>"+element+"</option>";                            
                    }
                }                    
            }       

            $("select[data-sp-element-name='NatureOfServicesDescription']").html(list_of_services_to_display);            
  
        });   
}

client_risk_assesments.populate_nas_and_appendix_d_services = function(){
    
    let field_properties = sharepoint_utilities.get_field_values(["NASServices"]); 
    //get all list of all audit services and remove the options
    let get_services_list = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "*",
            "",
            "MazarsServiceLines",
            "Title asc"
        )
    $.when(get_services_list).
        done(function(get_services_list_data){  
        
            let list_of_non_assurance_and_appendix_d_services = "";
            let list_of_unique_services = [];

            //Get all services logic with results
            for (let index = 0; index < get_services_list_data.length; index++) {
                const item_row = get_services_list_data[index];
            
                let cascade_options = item_row.DropDownOptions;
                if(cascade_options){
                    for (let c_index = 0; c_index < cascade_options.length; c_index++) {
                        const element = cascade_options[c_index];

                        //remove duplicates                     
                        if(list_of_unique_services.indexOf(element) == -1){   
                            if(item_row.ServiceType.indexOf("Non-Assurance") >=0 || item_row.ServiceType.indexOf("Appendix D") >=0){
                                list_of_non_assurance_and_appendix_d_services +="<option value='"+element+"'>"+element+"</option>";  
                            }   
                            list_of_unique_services.push(element)
                        }                       
                    }
                }      
            }  

            list_of_non_assurance_and_appendix_d_services +="<option value='Other'>Other</option>"; 
            //should only display hardcode the non assurnace and appendix D options for assurance selections
            $("select[data-sp-element-name='NASServices']").html(list_of_non_assurance_and_appendix_d_services);
        
            sharepoint_utilities.set_field_value("NASServices",field_properties.meta_package["NASServices"]); 
            $("select[data-sp-element-name='NASServices']").change()
    });
  

     
}

client_risk_assesments.cascade_service_type = function(service_type){ 
     
    let field_properties = sharepoint_utilities.get_field_values(["MazarsServiceLine"]).meta_package; 
   
    let get_service_line_details = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "*",
            "ServiceType eq '"+service_type+"'",
            "MazarsServiceLines",
            "Title asc"
        )    

    $.when(get_service_line_details).
        done(function(get_service_line_details_data){    

            let service_lines = "<option value=''>Please select...</option>";
            let is_found = false;
           //if result found and something assigned show the assigned.
            for (let index = 0; index < get_service_line_details_data.length; index++) {
                const get_service_line_details_data_row = get_service_line_details_data[index];

                if(field_properties.MazarsServiceLine == get_service_line_details_data_row.Title){
                    is_found = true;
                }
                //this cascades the service line under the general section when the servie type is selected
                service_lines +="<option value='"+get_service_line_details_data_row.Title+"'>"+get_service_line_details_data_row.Title+"</option>"; 
                                            
            }        
           
            $("select[data-sp-element-name='MazarsServiceLine']").html(service_lines);
            $("select[data-sp-element-name='ClientServiceLine']").html(service_lines);

            if(is_found){
                sharepoint_utilities.set_field_value("MazarsServiceLine",field_properties.MazarsServiceLine);  
                sharepoint_utilities.set_field_value("ClientServiceLine",field_properties.MazarsServiceLine); 
            }    
    }); 

}

client_risk_assesments.check_relevant_source_of_funds = function(){

    let field_properties = sharepoint_utilities.get_field_values(["IsNaturalPerson","SourceOfFunds"]);      

    sharepoint_utilities.set_fields_as_not_required(["SourceOfFunds","SourceOfFundsOther"]);
    sharepoint_utilities.hide_fields(["SourceOfFunds","SourceOfFundsOther"])
   
    if(field_properties.meta_package["IsNaturalPerson"] == "No"){
        sharepoint_utilities.show_fields(["SourceOfFundsOther"]);
        sharepoint_utilities.set_fields_as_required(["SourceOfFundsOther"])
      
        //reset the source of funds option       
        client_risk_assesments.clear_multi_select_box("SourceOfFunds");

    }else
        if(field_properties.meta_package["IsNaturalPerson"] == "Yes"){
            sharepoint_utilities.show_fields(["SourceOfFunds"]);
            sharepoint_utilities.set_fields_as_required(["SourceOfFunds"])

            if(field_properties.meta_package["SourceOfFunds"]){
                if(field_properties.meta_package["SourceOfFunds"].indexOf("Other") >=0){
                    sharepoint_utilities.show_fields(["SourceOfFundsOther"]);
                    sharepoint_utilities.set_fields_as_required(["SourceOfFundsOther"])
                }
            }
        }
}

client_risk_assesments.clear_multi_select_box = function(sp_field_name){

    $("div[sp-field-name='"+sp_field_name+"'").find("select").next().find(".select2-selection__rendered li").each(function(){

        let remove_item = $(this).find(".select2-selection__choice__remove");
        remove_item.click();
    })
}

client_risk_assesments.set_client_service_line_field = function(service_line_value){

    sharepoint_utilities.set_field_value("ClientServiceLine",service_line_value); 

}

client_risk_assesments.check_if_rely_comply_assesment_is_required = function(){


    if(app_configuration.display_rely_comply_module){

        //display the associated fields
        let rely_comply_assesment_fields = ["ClientServiceLine","ClientAddress","ClientCountry","ClientRegOrTaxNumber","NatureOfClient","ClientServiceType","Q12PartA"];      
        
        //Only when the submission is a Non-Assurance Acceptance 
        //Only when the service lines are corporate finance | tax consulting | company secretarial  
        let field_properties = sharepoint_utilities.get_field_values(["ClientAcceptanceType","AcceptanceOrContinuance","ClientServiceLine","Q12PartA"]); 
        let rely_assesement_required =  false;
        
        //then check for the service lines which doesnt exist yet - need to find this out
        let service_lines_required = ["Corporate Finance", "Tax Consulting","Company Secretarial","Independent Trustee"];        
        
        for (let index = 0; index < service_lines_required.length; index++) {
            const element = service_lines_required[index];
            
            //check if any of the matched services are selected
            if(field_properties.meta_package["ClientServiceLine"]){
                if(field_properties.meta_package["ClientServiceLine"].indexOf(element)>=0){
                    rely_assesement_required = true;
                }
            }
        }       
       

        if(field_properties.meta_package["Q12PartA"] == "Yes"){
            sharepoint_utilities.show_fields(["C12PartA"]);
            sharepoint_utilities.set_fields_as_required(["C12PartA"]);
        }
        
        supporting_documents.append_to_current_document_required("Rely Comply Risk Assesment","remove");
        sharepoint_utilities.hide_fields(["sp-button-nas-rely-comply-assesment-creation"]);
        sharepoint_utilities.hide_fields(rely_comply_assesment_fields);
        sharepoint_utilities.set_fields_as_not_required(rely_comply_assesment_fields)

        if(rely_assesement_required){

            warning_controller.add_new_warning("Rely Comply Risk Assesment","Please create and upload your Rely Comply Risk Assesment for this client under supporting documents","Info")
                
            supporting_documents.append_to_current_document_required("Rely Comply Risk Assesment");

            sharepoint_utilities.show_fields(rely_comply_assesment_fields);
            sharepoint_utilities.set_fields_as_required(rely_comply_assesment_fields)
            sharepoint_utilities.show_fields(["sp-button-nas-rely-comply-assesment-creation"]);
        }else{

            sharepoint_utilities.hide_fields(["C12PartA"]);
            sharepoint_utilities.set_fields_as_not_required(["C12PartA"]);
        }
    }
}

client_risk_assesments.other_pie_entities_comments_toggle = function(){

    let field_properties = sharepoint_utilities.get_field_values(["OtherPieEntities"]); 
     
    let fields_to_toggle = ["PIEclassification"];

    sharepoint_utilities.hide_fields(fields_to_toggle);
    sharepoint_utilities.set_fields_as_not_required(fields_to_toggle)  
    
    if(field_properties.meta_package["OtherPieEntities"] == "Yes"){
        sharepoint_utilities.show_fields(fields_to_toggle);
        sharepoint_utilities.set_fields_as_required(fields_to_toggle)  
    }
}

client_risk_assesments.global_required_documents = function(){ 
    //mandatory supporting documents to be uploaded
    supporting_documents.append_to_current_document_required("Draft Engagement Letter");
    supporting_documents.append_to_current_document_required("WeCheck Report");
    supporting_documents.append_to_current_document_required("KAC report");  
    
    let get_field_properties = sharepoint_utilities.get_field_values(["AcceptanceOrContinuance"]).meta_package
    //only require pong report for acceptance
    if(get_field_properties.AcceptanceOrContinuance != "Continuance"){
        supporting_documents.append_to_current_document_required("PONG Report");
    }else{
        //if the form is continuance and has the pong report requirement already then remove it
        supporting_documents.append_to_current_document_required("PONG Report","remove");
    }
}
    
client_risk_assesments.render_subcontractor_conditional = function(){

    let get_field_properties = sharepoint_utilities.get_field_values(["subcontractors"])
    let field_values = get_field_properties.meta_package;

    let subcontractors = field_values["subcontractors"];
    
    if(subcontractors == 'Yes'){
            sharepoint_utilities.show_fields(["subcontractorsComm"]);
            sharepoint_utilities.set_fields_as_required(["subcontractorsComm"]);
            // append the sub contractors certificate to the reuired documents        
            supporting_documents.append_to_current_document_required("Subcontractor Certificate");
    }else{
            sharepoint_utilities.hide_fields(["subcontractorsComm"]);
            sharepoint_utilities.set_fields_as_not_required(["subcontractorsComm"]);
            //documentsText = documentsText.replace("Subcontractor Certificate", " ");
            supporting_documents.append_to_current_document_required("Subcontractor Certificate", "remove");
    }
}

$(document).on("change",".client-acceptance-general select[data-sp-element-name='ClientName']",function(){

    //reset the task code field
    sharepoint_utilities.set_field_value("ClientTaskCode",""); 
    //then render the componet
    client_risk_assesments.render_task_code_component($(this).val(),"ClientTaskCode");
});


$(document).on("change", "input[data-sp-element-name='nonAssuranceServicePerformed']", function(){
    
    client_risk_assesments.is_self_interest_threat();
});


client_risk_assesments.render_task_code_component= function(client_name,task_code_field_name){   

    let clean_client_name = main.clean_client_name(client_name)

    $.when(
		sharepoint_utilities.get_list_items_by_title(
			app_configuration.client_list_site_context, 
			"TaskCodes",
			"M_ClientName eq '"+clean_client_name+"'",
			app_configuration.client_list_name,
			"Id desc")
		)
	.done(function(task_code_results){
		
        let task_code_options = ["Not Applicable"];

        if(main["selected_client_risk_data"]){
            if(main["selected_client_risk_data"].AcceptanceOrContinuance == "Continuance"){
                task_code_options = [];
            }
        }

        for (let index = 0; index < task_code_results.length; index++) {
            const task_code_field = task_code_results[index].TaskCodes;

            if(task_code_field){
                if(task_code_field.indexOf("|") >= 0){
                   
                    task_code_options = ["Not Applicable"];

                    //ensure that for a continuance the task code not applicable is not available
                    if(main["selected_client_risk_data"]){
                        if(main["selected_client_risk_data"].AcceptanceOrContinuance == "Continuance"){
                            task_code_options = [];
                        }
                    }

                    let list_of_task_codes = task_code_field.split("|");
                    for (let index = 0; index < list_of_task_codes.length; index++) {
                        const task_code = list_of_task_codes[index];
                        task_code_options.push(task_code);
                    }
                }else{
                    task_code_options.push(task_code_field);
                }   
            }
        }

        client_risk_assesments.render_task_codes(task_code_options,task_code_field_name)
	});
}

client_risk_assesments.is_self_interest_threat = function(){

    let nonAssuranceServicePerformed = $("input[data-sp-element-name='nonAssuranceServicePerformed']").val();

    if(nonAssuranceServicePerformed == "Yes"){
        sharepoint_utilities.show_fields(["IsSelfInterestThreat","AppendixDEngagagementPartnersId"])
        sharepoint_utilities.set_fields_as_required(["IsSelfInterestThreat","AppendixDEngagagementPartnersId"])
    } else {
        sharepoint_utilities.hide_fields(["IsSelfInterestThreat","AppendixDEngagagementPartnersId"])
        sharepoint_utilities.set_fields_as_not_required(["IsSelfInterestThreat","AppendixDEngagagementPartnersId"])
    }

}

client_risk_assesments.continuance_lite_risk_rules = function(){

    let is_risky = false;

    let working_fields_kyc = ["Q1ACLiteKYC"]
    let working_fields_money = ["Q1ACLiteMoney","Q2ACLiteMoney"];
    let working_fields_part_a = ["Q1ACLitePartA","Q2ACLitePartA","Q3ACLitePartA","Q4ACLitePartA","Q5ACLitePartA","Q6ACLitePartA"];
    let working_fields_part_b = ["Q1ACLitePartB","Q2ACLitePartB","Q3ACLitePartB"];
    let working_fields_ind = ["Q1ACLiteINDP","Q2ACLiteINDP","Q3ACLiteINDP"];
    let working_fields_ac_lite = ["Q1ACLite","Q2ACLite","Q3ACLite","Q4ACLite","Q5ACLite","Q6ACLite"];

    let working_fields_risk_statuses = ["RiskStatusACLiteKYC","RiskStatusACLiteMoney","RiskStatusACLiteINDP","RiskStatusACLitePartB","RiskStatusACLitePartA","RiskStatusACLite"]

    let working_all_fields = [];

    working_all_fields = working_all_fields.concat(working_fields_kyc, working_fields_money,working_fields_part_a,working_fields_part_b,working_fields_ind,working_fields_ac_lite,working_fields_risk_statuses);

    let get_field_properties = sharepoint_utilities.get_field_values(working_all_fields);
    let get_field_values = get_field_properties.meta_package


    //check money fields
    if(determine_risk_status(working_fields_money,get_field_values,"RiskStatusACLiteMoney")){
        is_risky = true
    }

    //check part a fields
    if(determine_risk_status(working_fields_part_a,get_field_values,"RiskStatusACLitePartA")){
        is_risky = true
    }

    //check part b fields
    if(determine_risk_status(working_fields_part_b,get_field_values,"RiskStatusACLitePartB")){
        is_risky = true
    }

    //check inpendence fields
    if(determine_risk_status(working_fields_ind,get_field_values,"RiskStatusACLiteINDP")){
        is_risky = true
    }

    //check working_fields_ac_lite
    if(determine_risk_status(working_fields_ac_lite,get_field_values,"RiskStatusACLite")){
        is_risky = true
    } 


    sharepoint_utilities.set_field_value("RiskStatusACLiteKYC","Allowed");
    if(get_field_values["Q1ACLiteKYC"] == "None of the above"){
        sharepoint_utilities.set_field_value("RiskStatusACLiteKYC","Not Allowed");
        is_risky = true;
    }  


    sharepoint_utilities.set_field_value("RiskStatus","Not Risky");
    if(is_risky){

        sharepoint_utilities.set_field_value("RiskStatus","Risky");
        //display full version pop up box

        // since there is no alternative outcome to action, we could potentially display one modal action button - "close" and remove the back + continue btn
        let outcome_options = {
            "Continue":function(){

                let submission_data = {
                    "item_id":main["selected_client_risk_data"]["Id"],
                    "action_type":"continuance",
                    "data_source_type":"current",
                    "form_type":"continuance",
                    "form_status":"existing"
                }  

                client_risk_assesments.render_continuance_form_html(submission_data); 
                //update the form and remove the ac lite status
                sharepoint_utilities.update_item(
                    app_configuration.ac_submission,
                    app_configuration.site_context,
                    {"ACLiteVersion":"no"},
                    parseInt(main["selected_client_risk_data"]["Id"])
                    )

            }
        }
        sharepoint_utilities.render_confirmation_box("Client Identified as Risky",
            //"Due you your selections, you cannot continue for the Continunace List Form. Select yes to continue or Back to adjust your answers",
            "Selecting 'Yes' indicates that the client is considered risky, and you will not be able to proceed with the Continuance Lite Form.",
            outcome_options,
            "60%"
            
        )

        $("input[name='Q1ACLite'][value='yes']").prop("checked", false);
    }
    
    function determine_risk_status(field_set,field_set_values,sp_risk_field_name){

        let is_risky = false;
        sharepoint_utilities.set_field_value(sp_risk_field_name,"Allowed");
        for (let index = 0; index < field_set.length; index++) {
            const field_value = field_set_values[field_set[index]];  
            if(field_value == "Yes"){
                sharepoint_utilities.set_field_value(sp_risk_field_name,"Not Allowed");
                is_risky = true;
            }    
        }

        return is_risky

    }

}

client_risk_assesments.render_task_codes = function(list_of_client_codes,task_code_field_name){

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
     
    
   
}
client_risk_assesments.run_applicable_standard_rules = function(){

    //reset the fields
    let applicable_field_options = ["ApplicableStdModified","ApplicableStandardOther","AUPPolicy","AUPClient"]
    sharepoint_utilities.hide_fields(applicable_field_options)
    sharepoint_utilities.set_fields_as_not_required(applicable_field_options)    
    
    assurance_functions.validate_other_selected();
    assurance_functions.validate_isa_705_rule();       
    non_assurance_functions.validate_isrs4400_rule();    

}
client_risk_assesments.render_applicable_standard_options = function(){
   
    var ServiceType = $("select[data-sp-element-name='ClientAcceptanceType']").val();    

    $("div[sp-field-name='ApplicableStandard'] .select2-container").remove();
    let get_field_property = global_field_set_navigation.general_section[12];
    get_field_property["additional_filters"] = "ServiceType eq '"+ServiceType+"'";  
       
    $.when(sharepoint_utilities.apply_single_select_drop_down(get_field_property)).done(function(){
         //set the value of the field
        if(main["selected_client_risk_data"]){
            if(main["selected_client_risk_data"].ApplicableStandard){
                setTimeout(function(){
                    sharepoint_utilities.set_select_2_fields_by_value(main["selected_client_risk_data"].ApplicableStandard, $("select[data-sp-element-name='ApplicableStandard']"));	
                    
                },1500)
            }
        }
        if(ServiceType == "Assurance"){
            $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='Appendix D']").addClass("nav-item-disabled");        
            $('[data-link-id="Appendix D"]').attr('title', "Appendix D is only applicable when selecting the 'Non-Assurance on Existing' Client via the service type").addClass("tooltip-disabled");
        }       
    });   
}

client_risk_assesments.render_risk_assesment_search = function(){

    let assesment_lookup_component = 
    {    
        
        "assesment_lookup": 
        [
            {
                "Title":"Search Type",
                "Description":"Select whether you would like to find the client by name or code",
                "sp_field_name":"temp-client-search-type",
                "sp_field_type":"input",
                "field_width":"full-width",
                "field_validate":true,
                "sp_additional_properties":"radio-buttons-own-values",
                "own_values":["Client Name","Client Code"],
                "field_icon":"ProductionFloorManagement" 
            },
            {
                "Title":"Search for your assesments via Client Name",
                "Description":"Please select your client name",
                "sp_field_name":"temp-assesment-search",          
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
                "Title":"New Acceptance",
                "Description":"Click to create your new acceptance form",
                "sp_field_name":"new-acceptance-action-button",
                "sp_field_type":"button",
                "field_width":"half-width",
                "field_validate":false,
                "sp_additional_properties":"exclude-from-meta hide-details"
            },                           
            {
                "Title":"Assesment table history",
                "Description":"Assesment table history",
                "sp_field_name":"temp-assesment-table-history",          
                "sp_field_type":"placeholder",
                "field_width":"full-width",
                "field_validate":false,
                "sp_additional_properties":"placeholder exclude-from-meta hide-details"                
            }
        ]
    }

    $("#additional-component-placeholders").html(sharepoint_utilities.create_container_form(
        assesment_lookup_component.assesment_lookup,
        "assesment-drop-down-container form-basic")
    );    



    $("li[data-link-id='Client Acceptance']").addClass("nav-item-disabled");
    $("li[data-link-id='Client Continuance']").addClass("nav-item-disabled");
    $("li[data-link-id='Client Continuance Lite']").addClass("nav-item-disabled");

    sharepoint_utilities.apply_form_plugins( assesment_lookup_component.assesment_lookup);     

    //Set the default value
    sharepoint_utilities.set_radio_value("temp-client-search-type","Client Name")
}

client_risk_assesments.render_selected_client_acceptance_continuance = function(client_name){
  
    let select_fields = "Id,Form_x0020_Status,RiskStatus,ClientName,Modified,AcceptanceOrContinuance,EngagementPartnerId,EngagementPartner/Title,ClientAcceptanceType,ACLiteVersion";
    let expand_fields = "&$expand=EngagementPartner/Title"

    $("div[sp-field-name='temp-assesment-table-history'] .field-component ").html("");
 
    //old archive site
    var archive_site_submissions = sharepoint_utilities.get_list_items_by_title(
        app_configuration.archive_ac_submission_site_context, 
        select_fields+expand_fields,
        "ClientName eq '"+main.clean_client_name(client_name)+"'",
        app_configuration.archive_list_name,
        "Id desc");

    //new site data
    var new_site_submissions = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        select_fields+expand_fields,
        "ClientName eq '"+main.clean_client_name(client_name)+"'",
        "ACSubmissions",
        "Id desc");
    

        //get all the data for the partner and merge the data sets to find which ones are outstanding
        $.when(archive_site_submissions,new_site_submissions).done(function(archive_site_submissions,new_site_submissions){

            let table_html =
            `   
                <table id='client_search_assessents_table' class='table-dashboard accordin-table table' style='width:100%;'>
                    <thead>                      
                        <th>Client Name <i class="menu-icon ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th>
                        <th>Partner <i class="menu-icon ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th>
                        <th>Last Submission <i class="menu-icon ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th> 
                        <th>Service <i class="menu-icon ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th>
                        <th>Type <i class="menu-icon ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th>
                        <th>Status <i class="menu-icon ms-Icon ms-Icon--ChevronUnfold10 sort-icon"></i></th>
                        <th>Actions</th>
                    </thead>
                    <tbody>            
            `

            for (let index = 0; index < archive_site_submissions.length; index++) {
                const archive_row = archive_site_submissions[index];

                table_html += 
                `
                    <tr>                       
                        <td>${archive_row.ClientName}</td>
                        <td>${archive_row.EngagementPartner.Title}</td>
                        <td data-sort='${moment(archive_row.Modified).format("x")}'>${moment(archive_row.Modified).format("ll")}</td>
                        <td>${archive_row.ClientAcceptanceType}</td>
                        <td class="table-type-column"'>${archive_row.AcceptanceOrContinuance}</td>
                        <td>
                            <div class="table-status-container">
                                <div data-client-class='${archive_row.Form_x0020_Status}'></div>
                                ${archive_row.Form_x0020_Status}
                            </div>
                        </td>
                        <td class="table-action-buttons-cell">
                             ${client_risk_assesments.render_action_buttons(archive_row.AcceptanceOrContinuance,"archives",archive_row)}                     
                        </td>
                    </tr>
                `                
            }

            for (let index = 0; index < new_site_submissions.length; index++) {
                const current_site_row = new_site_submissions[index];

                let engagement_partner = "None Selected";
                if(current_site_row.EngagementPartnerId){
                    engagement_partner = current_site_row.EngagementPartner.Title
                }
                table_html += 
                `
                    <tr>                     
                        <td>${current_site_row.ClientName}</td>
                        <td>${engagement_partner}</td>
                        <td>${moment(current_site_row.Modified).format("ll")}</td>
                        <td>${current_site_row.ClientAcceptanceType} <br/> CRA ${current_site_row.Id}</td>
                        <td>${determine_if_continuance_lite(current_site_row.ACLiteVersion, current_site_row.AcceptanceOrContinuance)}</td>
                        <td>
                            <div class="table-status-container">
                                <div data-client-class='${current_site_row.Form_x0020_Status}'></div>
                                ${current_site_row.Form_x0020_Status}
                            </div>
                        </td>
                        <td class="table-action-buttons-cell">
                             ${client_risk_assesments.render_action_buttons(current_site_row.AcceptanceOrContinuance,"current",current_site_row)}                     
                        </td>
                    </tr>
                `                
            }

            table_html +=
            `   
                    </tbody>
                </table
            `

            $("div[sp-field-name='temp-assesment-table-history'] .field-component ").html(table_html);

            $('#client_search_assessents_table').DataTable({
                "pageLength": 10,
                "bLengthChange": false,
                "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "All"] ]
            });

            sharepoint_utilities.show_fields(["new-continuance-action-button"]);

        });

        function determine_if_continuance_lite(ac_lite_status, AcceptanceOrContinuance){

                let status_type = AcceptanceOrContinuance

                if(ac_lite_status == "yes"){
                    status_type = "Continuance Lite"
                }

                return status_type
        }

}


client_risk_assesments.render_action_buttons = function(action_type,data_source_type,record){

    let field_properties =
    `
        data-action-type='${action_type}' 
        data-source-type='${data_source_type}'
        data-itemid='${record["Id"]}'  
        data-service-type='${record["ClientAcceptanceType"]}' 
        data-ac-lite='${record["ACLiteVersion"]}'        
    `  
    
    switch(record.Form_x0020_Status){     

        case "Completed":
            action_buttons =   
            `
                <i title='Download the pdf' class='menu-icon ms-Icon ms-Icon--CloudDownload table-action-button table-action-button' 
                    ${field_properties}                            
                ></i>&nbsp;&nbsp;  
                <i title='Create new continuance' class='menu-icon ms-Icon ms-Icon--Generate table-action-button-cancel table-action-button' 
                    ${field_properties}  
                >
                </i>&nbsp;&nbsp; 
            `          
        break;

        case "Cancelled":

            action_buttons = 
            `  
                <i title='View the current submission' class='menu-icon ms-Icon ms-Icon--View table-action-button table-action-button' 
                    ${field_properties}              
                ></i>&nbsp;&nbsp;       
                <i title='Reset the current submission back into progress' class='menu-icon ms-Icon ms-Icon--SyncFolder table-action-button-reset-form table-action-button' 
                    ${field_properties}              
                ></i>&nbsp;&nbsp;                 
            `
        break;

        case "s90 Cancelled":

            action_buttons = 
            `  
                <i title='View the current submission' class='menu-icon ms-Icon ms-Icon--View table-action-button table-action-button' 
                    ${field_properties}              
                ></i>&nbsp;&nbsp;       
                <i title='Reset the current submission back into progress' class='menu-icon ms-Icon ms-Icon--SyncFolder table-action-button-reset-form table-action-button' 
                    ${field_properties}              
                ></i>&nbsp;&nbsp;                
            `
        break;

        default:

            action_buttons = 
            `  
                <i title='View the current submission' class='menu-icon ms-Icon ms-Icon--View table-action-button' 
                ${field_properties}    
                data-form-status='existing'              
                >
                </i>&nbsp;&nbsp;       
                <i title='Cancel the current submission' class='menu-icon ms-Icon ms-Icon--DeactivateOrders table-action-button-cancel table-action-button' 
                    ${field_properties}   
                    data-form-status='existing'           
                >
                </i>&nbsp;&nbsp; 
                <i title='Reset the current submission back into progress' class='menu-icon ms-Icon ms-Icon--SyncFolder table-action-button-reset-form table-action-button' 
                    ${field_properties}              
                ></i>&nbsp;&nbsp; 
                <i title='Resign from engagement' class='menu-icon ms-Icon ms-Icon--SignOut table-action-button-resign-from-engagement table-action-button' 
                    ${field_properties}  
                    data-form-status='existing'            
                ></i>&nbsp;&nbsp; 
            `

        break;
    
    }

    return action_buttons
}


client_risk_assesments.render_acceptance_form_html = function(submission_data){

    let canvas =  $(".page-section");   
    canvas.addClass("hide");
    $(".page-loader-header").removeClass("hide");

    //disable all sections by default;
    //render from will check if there is an item that exists and then will enable them
    $("ul[data-app-name='Client Acceptance and Continuance'] > ul li").addClass("nav-item-disabled");
    $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='General']").removeClass("nav-item-disabled");    
   
    $("li[data-link-id='Appendix D']").addClass("nav-item-disabled");

    $("li[data-link-id='Client Continuance']").next().remove();
    $("li[data-link-id='Client Continuance']").remove();

    $("li[data-link-id='Client Continuance Lite']").next().remove();
    $("li[data-link-id='Client Continuance Lite']").remove();


    //create the sections that hide and show based on the navigation item selected
    let section_names = [
            "General",
            "Team Information",
            "EQR Calculator",
            "GIAC Form",
            "Business Sustainability",
            "General Information About the Engagement",
            "PIE",
            "Transnational Calculator",
            "S90 Calculator",
            "S90 Considerations",
            "Fee Considerations",
            "Key Figures - recent financial year",
            "Risk Status",
            "Part A - Risk Considered as Major",
            "Part B - Risk Considered as Normal",       
            //removed as per ticket 842 - 2024-09-05 
            //"Anti-corruption",
            "Acceptance - Independence and other Considerations",
            "Appendix C - Risk Assesment",
            //removed as per ticket 896 - 2024-09-05 
            //"Dummy Entities, Companies or Trusts Other Purpose",
            //"Unusual Operations Regarding the Economic Activities of the Client",
             //"Know your client (KYC) procedures performed",
            "Conclusion",
           
            "1. Assessment of compliance with Independence rules",
            "Approvals",
            "Supporting Documents"
    ]

    canvas.html(client_risk_assesments.create_form_sections(section_names))

    //get a list of all the fields
    //from client_acceptance -> field_set_configuration.js var acceptance_fields

    //render the fields using the framework
    canvas.find("div[form-navigation-target='General']").html(sharepoint_utilities.create_container_form(acceptance_fields.general_section,"client-acceptance-general"));
    canvas.find("div[form-navigation-target='Team Information']").html(sharepoint_utilities.create_container_form(acceptance_fields.team_information,"client-acceptance-team-info"));
    
    canvas.find("div[form-navigation-target='EQR Calculator']").html(sharepoint_utilities.create_container_form(acceptance_fields.eqr_appointment_form,"client-eqr-appointment-form"));

    canvas.find("div[form-navigation-target='GIAC Form']").html(sharepoint_utilities.create_container_form(global_giac_form_fields.giac_form,"client-giac-form"));

    canvas.find("div[form-navigation-target='Business Sustainability']").html(sharepoint_utilities.create_container_form(global_field_set_navigation.business_sustainability,"client-business-sustainability-form"));

    canvas.find("div[form-navigation-target='General Information About the Engagement']").html(sharepoint_utilities.create_container_form(acceptance_fields.general_overview_fields,"client-acceptance-general-overview"));
    canvas.find("div[form-navigation-target='PIE']").html(sharepoint_utilities.create_container_form(acceptance_fields.PIE,"pie-form"));
    canvas.find("div[form-navigation-target='Key Figures - recent financial year']").html(sharepoint_utilities.create_container_form(acceptance_fields.key_figures,"key-figures"));
    canvas.find("div[form-navigation-target='Transnational Calculator']").html(sharepoint_utilities.create_container_form(acceptance_fields.transnational_calculator,"transnational-calculator-section"));
    canvas.find("div[form-navigation-target='S90 Calculator']").html(sharepoint_utilities.create_container_form(acceptance_fields.s90_calculator,"s90-calculator-section")); //S90 Calculator divided
    canvas.find("div[form-navigation-target='S90 Considerations']").html(sharepoint_utilities.create_container_form(acceptance_fields.s90_considerations,"s90-considerations-section"));
    canvas.find("div[form-navigation-target='Fee Considerations']").html(sharepoint_utilities.create_container_form(acceptance_fields.assurance_non_assurance_calculator,"assurance-vs-non-assurance Calculator"));
    canvas.find("div[form-navigation-target='Risk Status']").html(sharepoint_utilities.create_container_form(acceptance_fields.risk_status,"risk-status-section"));

    canvas.find("div[form-navigation-target='Part A - Risk Considered as Major']").html(sharepoint_utilities.create_container_form(acceptance_fields.appendix_a_part_a_risk_considered_as_major,"appendix-a-part-a"));
    canvas.find("div[form-navigation-target='Part B - Risk Considered as Normal']").html(sharepoint_utilities.create_container_form(acceptance_fields.part_b_risk_considered_normal,"appendix-a-part-b"));
    
    //removed as per ticket 842 2024-09-05
    //canvas.find("div[form-navigation-target='Anti-corruption']").html(sharepoint_utilities.create_container_form(acceptance_fields.anti_corruption,"anti-corruption"));

    canvas.find("div[form-navigation-target='Acceptance - Independence and other Considerations']").html(sharepoint_utilities.create_container_form(acceptance_fields.acceptance_independence_and_other_considerations,"appendix-b-acceptance"));

    //remove as per ticket 896
    canvas.find("div[form-navigation-target='Appendix C - Risk Assesment']").html(sharepoint_utilities.create_container_form(acceptance_fields.appendix_c,"appendix-c-risk-assessment"));
    //canvas.find("div[form-navigation-target='Dummy Entities, Companies or Trusts Other Purpose']").html(sharepoint_utilities.create_container_form(acceptance_fields.dummy_entities_companies_trust,"appendix-c-dummy-entities"));
    //canvas.find("div[form-navigation-target='Unusual Operations Regarding the Economic Activities of the Client']").html(sharepoint_utilities.create_container_form(acceptance_fields.unusual_operations_regarding_economic_activites,"appendix-c-unusual-operations"));
    //canvas.find("div[form-navigation-target='Know your client (KYC) procedures performed']").html(sharepoint_utilities.create_container_form(acceptance_fields.kyc_procedures_performed,"appendix-c-kyc"));

    
    canvas.find("div[form-navigation-target='Conclusion']").html(sharepoint_utilities.create_container_form(acceptance_fields.conclusion,"appendix-c-conclusion"));
    
    canvas.find("div[form-navigation-target='1. Assessment of compliance with Independence rules']").html(sharepoint_utilities.create_container_form(acceptance_fields.appendix_d_assessment_of_compliance,"appendix-d-assesment"));


    canvas.find("div[form-navigation-target='Approvals']").html(sharepoint_utilities.create_container_form(acceptance_fields.approvals,"approvals-section"));
    canvas.find("div[form-navigation-target='Supporting Documents']").html(sharepoint_utilities.create_container_form(acceptance_fields.supporting_documents,"supporting-documents-section"));


    let apply_plugin_fields = sharepoint_utilities.consolidate_fields(acceptance_fields)
    //apply any plugins
    sharepoint_utilities.apply_form_plugins(apply_plugin_fields);  
    sharepoint_utilities.apply_form_plugins(global_giac_form_fields.giac_form);  

    setTimeout(function(){
       
        client_risk_assesments.render_selected_form_data(submission_data);  
        
    },3000);
}

client_risk_assesments.render_continuance_form_html = function(submission_data){

          
    let canvas =  $(".page-section");   
        canvas.addClass("hide");
        $(".page-loader-header").removeClass("hide");

        //disable all sections by default;
        //render from will check if there is an item that exists and then will enable them
        $("ul[data-app-name='Client Acceptance and Continuance'] > ul li").addClass("nav-item-disabled");
        $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='General']").removeClass("nav-item-disabled");

        $("li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
        $("li[data-link-id='EQR Calculator']").addClass("nav-item-disabled");  

        $("li[data-link-id='Client Acceptance']").next().remove();
        $("li[data-link-id='Client Acceptance']").remove();

        $("li[data-link-id='Client Continuance Lite']").next().remove();
        $("li[data-link-id='Client Continuance Lite']").remove(); 

        //create the sections that hide and show based on the navigation item selected
        let section_names = [
            "General",
            "Team Information",
            "EQR Calculator",
            "GIAC Form",
            "Business Sustainability",
            "General Information About the Engagement",
            "PIE",
            "Transnational Calculator",
            "S90 Calculator",
            "S90 Considerations",
            "Fee Considerations",
            "Key Figures - recent financial year",
            "Risk Status",
            "Part A - Risk Considered as Major",
            "Part B - Risk Considered as Normal",   
            //removed as per ticket 842 2024-09-05       
            //"Anti-corruption",
            "Continuance - Independence and other Considerations",
            "Appendix C - Risk Assesment",
            
            //removed as per ticket 869
            //"Dummy Entities, Companies or Trusts Other Purpose",
            //"Unusual Operations Regarding the Economic Activities of the Client",
            //"Know your client (KYC) procedures performed",

            "Conclusion",           
            "1. Assessment of compliance with Independence rules",
            "Approvals",
            "Supporting Documents"
        ]

        canvas.html(client_risk_assesments.create_form_sections(section_names))

        //render the fields using the framework
        canvas.find("div[form-navigation-target='General']").html(sharepoint_utilities.create_container_form(continuance_fields.general_section,"client-continuance-general"));
        canvas.find("div[form-navigation-target='Team Information']").html(sharepoint_utilities.create_container_form(continuance_fields.team_information,"client-continuance-team-info"));

        canvas.find("div[form-navigation-target='EQR Calculator']").html(sharepoint_utilities.create_container_form(continuance_fields.eqr_appointment_form,"client-eqr-appointment-form"));

        canvas.find("div[form-navigation-target='GIAC Form']").html(sharepoint_utilities.create_container_form(global_giac_form_fields.giac_form,"client-giac-form"));
        canvas.find("div[form-navigation-target='Business Sustainability']").html(sharepoint_utilities.create_container_form(global_field_set_navigation.business_sustainability,"client-business-sustainability-form"));

        canvas.find("div[form-navigation-target='General Information About the Engagement']").html(sharepoint_utilities.create_container_form(continuance_fields.general_overview_fields,"client-continuance-general-overview"));
        canvas.find("div[form-navigation-target='PIE']").html(sharepoint_utilities.create_container_form(continuance_fields.PIE,"pie-form"));
        canvas.find("div[form-navigation-target='Key Figures - recent financial year']").html(sharepoint_utilities.create_container_form(continuance_fields.key_figures,"key-figures"));

        canvas.find("div[form-navigation-target='Transnational Calculator']").html(sharepoint_utilities.create_container_form(continuance_fields.transnational_calculator,"transnational-calculator-section"));
        canvas.find("div[form-navigation-target='S90 Calculator']").html(sharepoint_utilities.create_container_form(acceptance_fields.s90_calculator,"s90-calculator-section")); //S90 Calculator divided
        canvas.find("div[form-navigation-target='S90 Considerations']").html(sharepoint_utilities.create_container_form(continuance_fields.s90_considerations,"s90-considerations-section"));
        canvas.find("div[form-navigation-target='Fee Considerations']").html(sharepoint_utilities.create_container_form(acceptance_fields.assurance_non_assurance_calculator,"fee-considerations-section"));
   
        canvas.find("div[form-navigation-target='Risk Status']").html(sharepoint_utilities.create_container_form(continuance_fields.risk_status,"risk-status-section"));
        
        canvas.find("div[form-navigation-target='Part A - Risk Considered as Major']").html(sharepoint_utilities.create_container_form(continuance_fields.appendix_a_part_a_risk_considered_as_major,"appendix-a-part-a"));
        canvas.find("div[form-navigation-target='Part B - Risk Considered as Normal']").html(sharepoint_utilities.create_container_form(continuance_fields.part_b_risk_considered_normal,"appendix-a-part-b"));
        
        //removed as per ticket 842 2024-09-05
        //canvas.find("div[form-navigation-target='Anti-corruption']").html(sharepoint_utilities.create_container_form(continuance_fields.anti_corruption,"anti-corruption"));

        canvas.find("div[form-navigation-target='Continuance - Independence and other Considerations']").html(sharepoint_utilities.create_container_form(continuance_fields.continuance_independence_and_other_considerations,"appendix-b-continuance"));

        canvas.find("div[form-navigation-target='Appendix C - Risk Assesment']").html(sharepoint_utilities.create_container_form(continuance_fields.appendix_c,"appendix-c-risk-assessment"));
        
        //removed as per ticket 869 2024-09-05
        //canvas.find("div[form-navigation-target='Dummy Entities, Companies or Trusts Other Purpose']").html(sharepoint_utilities.create_container_form(continuance_fields.dummy_entities_companies_trust,"appendix-c-dummy-entities"));
        //canvas.find("div[form-navigation-target='Unusual Operations Regarding the Economic Activities of the Client']").html(sharepoint_utilities.create_container_form(continuance_fields.unusual_operations_regarding_economic_activites,"appendix-c-unusual-operations"));
        //canvas.find("div[form-navigation-target='Know your client (KYC) procedures performed']").html(sharepoint_utilities.create_container_form(continuance_fields.kyc_procedures_performed,"appendix-c-kyc"));

        
        canvas.find("div[form-navigation-target='Conclusion']").html(sharepoint_utilities.create_container_form(continuance_fields.conclusion,"appendix-c-conclusion"));
        
        canvas.find("div[form-navigation-target='1. Assessment of compliance with Independence rules']").html(sharepoint_utilities.create_container_form(continuance_fields.appendix_d_assessment_of_compliance,"appendix-d-assesment"));


        canvas.find("div[form-navigation-target='Approvals']").html(sharepoint_utilities.create_container_form(continuance_fields.approvals,"approvals-section"));
        canvas.find("div[form-navigation-target='Supporting Documents']").html(sharepoint_utilities.create_container_form(continuance_fields.supporting_documents,"supporting-documents-section"));


        let apply_plugin_fields = sharepoint_utilities.consolidate_fields(continuance_fields)
        //apply any plugins
        sharepoint_utilities.apply_form_plugins(apply_plugin_fields);  
        sharepoint_utilities.apply_form_plugins(global_giac_form_fields.giac_form);  
        sharepoint_utilities.apply_form_plugins(global_field_set_navigation.business_sustainability); 

        setTimeout(function(){               
            //wait for the plugins to render before adding the data
            client_risk_assesments.render_selected_form_data(submission_data);    
        },3000);    

}

client_risk_assesments.render_continuance_lite_form_html = function(record_properties){

    let canvas =  $(".page-section");   
    canvas.addClass("hide");
    $(".page-loader-header").removeClass("hide");

    //disable all sections by default;
    //render from will check if there is an item that exists and then will enable them
      //disable all sections by default;
    //render from will check if there is an item that exists and then will enable them
    $("ul[data-app-name='Client Acceptance and Continuance'] > ul li").addClass("nav-item-disabled");
    $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='General']").removeClass("nav-item-disabled");

    $("li[data-link-id='EQR Calculator']").addClass("nav-item-disabled");   
    $("li[data-link-id='S90 Considerations']").addClass("nav-item-disabled");   

    $("li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
    $("li[data-link-id='Appendix D']").addClass("nav-item-disabled");

    $("li[data-link-id='Client Acceptance']").next().remove();
    $("li[data-link-id='Client Acceptance']").remove();

    $("li[data-link-id='Client Continuance']").addClass("nav-item-disabled");


    //create the sections that hide and show based on the navigation item selected
    let section_names = [
            "General",

            "General Information About the Engagement",
            "PIE",         
            "Key Figures - recent financial year",
            
            "LITE",
            "Part A - Risk Considered as Major",
            "Part B - Risk Considered as Normal",
            "Indpendence and other considerations",
            "Assessment of the risk of money laundering and terrorist financing acts",
            "Know your client (KYC) procedures performed",

            "Risk Status",
            "Approvals",
            "Supporting Documents",       
    ]

    canvas.html(client_risk_assesments.create_form_sections(section_names))

    //get a list of all the fields

    //render the fields using the framework
    canvas.find("div[form-navigation-target='General']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.general_section,"client-continuance-general "));
    canvas.find("div[form-navigation-target='General Information About the Engagement']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.general_overview_fields,"ac-lite-general"));
    
    canvas.find("div[form-navigation-target='PIE']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.PIE,"pie-form"));
    //canvas.find("div[form-navigation-target='Transnational Calculator']").html(sharepoint_utilities.create_container_form(acceptance_fields.transnational_calculator,"transnational-calculator-section"));
    canvas.find("div[form-navigation-target='Key Figures - recent financial year']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.key_figures,"key-figures"));
    
    canvas.find("div[form-navigation-target='LITE']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.ac_lite,"lite-form custom-lite-form-answers"));

    canvas.find("div[form-navigation-target='Part A - Risk Considered as Major']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.part_a_risk_considered_as_major,"part-a-risk-considered-as-major custom-lite-form-answers"));
    canvas.find("div[form-navigation-target='Part B - Risk Considered as Normal']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.part_b_risk_considered_as_normal,"part-b-risk-considered-as-normal custom-lite-form-answers"));
    canvas.find("div[form-navigation-target='Indpendence and other considerations']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.independence_and_other_considerations,"independence-and-other-consideration custom-lite-form-answers"));
    canvas.find("div[form-navigation-target='Assessment of the risk of money laundering and terrorist financing acts']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.a_and_c_lite_assessment_of_risk,"lite-assessment-of-risk custom-lite-form-answers"));
    canvas.find("div[form-navigation-target='Know your client (KYC) procedures performed']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.engagement_lite_know_your_client,"engagement-lite-kyc custom-lite-form-answers"));
    canvas.find("div[form-navigation-target='Risk Status']").html(sharepoint_utilities.create_container_form(continuance_fields.risk_status,"risk-status-section"));

    canvas.find("div[form-navigation-target='Approvals']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.approvals,"approvals-section"));
    canvas.find("div[form-navigation-target='Supporting Documents']").html(sharepoint_utilities.create_container_form(continuance_lite_fields.supporting_documents,"supporting-documents-section"));


    let apply_plugin_fields = sharepoint_utilities.consolidate_fields(continuance_lite_fields)
    
    //apply any plugins
    sharepoint_utilities.apply_form_plugins(apply_plugin_fields);  

    setTimeout(function(){
       
        client_risk_assesments.render_selected_form_data(record_properties);  
        
    },3000);

}


client_risk_assesments.create_form_sections = function(array_of_sections){

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

client_risk_assesments.show_section = function(section_name){
    //hide all sections
    $(".page-section-form-container").addClass("hide");
    //display section based on name
    $("#field_section_container div[form-navigation-target='"+section_name+"']").removeClass("hide");
}

client_risk_assesments.get_continuance_form = function(selected_form_properties){

    let submission_data = {
            "item_id":selected_form_properties.attr("data-itemid"),           
            "action_type":"continuance",         
            "data_source_type":selected_form_properties.attr("data-source-type"),
            //"data_source_type":"current",
            "form_type":"continuance",
            "form_status":"new"
        }     

    client_risk_assesments.render_continuance_form_html(submission_data); 
    
}

client_risk_assesments.giac_form_validation = function(){

    let field_properties = sharepoint_utilities.get_field_values(
        ["ClientAcceptanceType","IsListedClient", "CryptoEngagment", "SPACEngagment", "IPOEngagment", 
            "IsTransnational", "OtherPieEntities", "AcceptanceOrContinuance","HasRussianEntities",
            "MazarsServiceLine","HasRiskAppetite"
        ]
);
    let field_values = field_properties.meta_package

    let acceptance_or_continuance = field_values["AcceptanceOrContinuance"]
    let service_type = field_values["ClientAcceptanceType"];
    let listed_entity = field_values["IsListedClient"];
    let transnational_status = field_values["IsTransnational"];
    let crypto_engagement = field_values["CryptoEngagment"];
    let spac_engagement = field_values["SPACEngagment"];
    let ipo_engagement = field_values["IPOEngagment"];
    let other_pie_entities = field_values["OtherPieEntities"];
    let has_russain_entities = field_values["HasRussianEntities"];
    let is_on_watch_list = field_values["HasRiskAppetite"];
    let mazars_service_line = field_values["MazarsServiceLine"]

    $("li[data-link-id='GIAC Form']").removeClass("nav-item-disabled");
    switch (acceptance_or_continuance) {
        case "Acceptance":
            switch (service_type) {
                case "Assurance":
                    if (is_on_watch_list == "Yes" || (other_pie_entities == "Yes" && mazars_service_line == "Audit") || has_russain_entities == "Yes" || listed_entity == "Yes" || crypto_engagement == "Yes" || ipo_engagement == "Yes") {
                                              
                        warning_controller.add_new_warning("GIAC Form", "Please complete the GIAC Form", "Info")
                        //sharepoint_utilities.render_notification("GIAC Form", "Please complete the GIAC Form", "Info");
                    } else {
                        $("li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
                    }
                    break;
                case "Non-Assurance":
                    if (crypto_engagement == "Yes" || is_on_watch_list == "Yes"  ||  has_russain_entities == "Yes") {
                     
                        warning_controller.add_new_warning("GIAC Form", "Please complete the GIAC Form", "Info")
                        //sharepoint_utilities.render_notification("GIAC Form", "Please complete the GIAC Form", "Info");
                    } else {
                        $("li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
                    }
                break;

                case "Non assurance service on existing assurance client (Appendix D)":
                    if (crypto_engagement == "Yes" || is_on_watch_list == "Yes"  ||  has_russain_entities == "Yes") {
                     
                        warning_controller.add_new_warning("GIAC Form", "Please complete the GIAC Form", "Info")
                        //sharepoint_utilities.render_notification("GIAC Form", "Please complete the GIAC Form", "Info");
                    } else {
                        $("li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
                    }
                break;


                default:
                    $("li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
                break;
            }
            break;
            
        case "Continuance":
            switch (service_type) {
                case "Assurance":
                     if (is_on_watch_list == "Yes" || has_russain_entities == "Yes" || crypto_engagement == "Yes" || ipo_engagement == "Yes") {                                      
                        warning_controller.add_new_warning("GIAC Form", "Please complete the GIAC Form", "Info")                    
                    } else {
                        $("li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
                    }
                    break;
                case "Non-Assurance":
                    if (is_on_watch_list == "Yes" || crypto_engagement == "Yes" || has_russain_entities == "Yes") {                     
                        warning_controller.add_new_warning("GIAC Form", "Please complete the GIAC Form", "Info")
                        //sharepoint_utilities.render_notification("GIAC Form", "Please complete the GIAC Form", "Info");
                    } else {
                        $("li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
                    }
                break;

                case "Non assurance service on existing assurance client (Appendix D)":
                    if (crypto_engagement == "Yes" || is_on_watch_list == "Yes"  ||  has_russain_entities == "Yes") {
                     
                        warning_controller.add_new_warning("GIAC Form", "Please complete the GIAC Form", "Info")
                        //sharepoint_utilities.render_notification("GIAC Form", "Please complete the GIAC Form", "Info");
                    } else {
                        $("li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
                    }
                break;


                default:
                    $("li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
                break;
            }
            break;
    }
    
}

client_risk_assesments.render_selected_form_data = function(selected_form_properties){
   

    /*
    data-structure
    submission_data = {
        "item_id":form_properties.Id,
        "action_type":"",
        "data_source_type":"",
        "form_type":"",
        "form_status":""
    }*/

    let item_id = parseInt(selected_form_properties.item_id);
    let action_type = selected_form_properties.action_type;
    let data_source_type = selected_form_properties.data_source_type;
    let form_status = selected_form_properties.form_status;

    let canvas =  $(".page-section"); 
       

    let query_fields = "";
    let consolidate_all_fields = [];
    let appendix_a_major_fields = [];
    let appendix_a_normal_fields = [];

    let appendix_b_indpendence_fields = [];

    let appendix_c_dummy_fields = [];
    let appedix_c_unusual_operations = [];
    let appendix_c_conclusion = [];
    let appendix_c_kyc = []

    let transnational_calculator = [];
    let s90_calculator = [];
    let s90_considerations = [];
    let assurance_non_assurance_calculator = [];

    let appendix_d = [];

    let ac_lite_main_section_fields = [];
    let ac_lite_money_laundering_fields = []

    let giac_query_fields = [];
    

    switch(action_type.toLowerCase()){

        case "acceptance":
            consolidate_all_fields = sharepoint_utilities.consolidate_fields(acceptance_fields);
            query_fields = sharepoint_utilities.generate_query_for_expanded_fields(consolidate_all_fields);  
            giac_query_fields = sharepoint_utilities.generate_query_for_expanded_fields(global_giac_form_fields.giac_form); 

            appendix_a_major_fields = acceptance_fields.appendix_a_part_a_risk_considered_as_major
            appendix_a_normal_fields = acceptance_fields.part_b_risk_considered_normal

            appendix_b_indpendence_fields = acceptance_fields.acceptance_independence_and_other_considerations;

            appendix_c_dummy_fields = acceptance_fields.dummy_entities_companies_trust
            appedix_c_unusual_operations = acceptance_fields.unusual_operations_regarding_economic_activites
            appendix_c_conclusion = acceptance_fields.conclusion
            appendix_c_kyc = acceptance_fields.kyc_procedures_performed;
            appendix_d = acceptance_fields.appendix_d_assessment_of_compliance;

            transnational_calculator = acceptance_fields.transnational_calculator;
            
            s90_calculator = acceptance_fields.s90_calculator;
            s90_considerations = acceptance_fields.s90_considerations;
            assurance_non_assurance_calculator = acceptance_fields.assurance_non_assurance_calculator;
                    
        break;

        case "continuance":
            //change to continuance when the cube is setup
            consolidate_all_fields = sharepoint_utilities.consolidate_fields(acceptance_fields);
            query_fields = sharepoint_utilities.generate_query_for_expanded_fields(consolidate_all_fields);  
            giac_query_fields = sharepoint_utilities.generate_query_for_expanded_fields(global_giac_form_fields.giac_form); 

            appendix_a_major_fields = continuance_fields.appendix_a_part_a_risk_considered_as_major
            appendix_a_normal_fields = continuance_fields.part_b_risk_considered_normal

            appendix_b_indpendence_fields = continuance_fields.continuance_independence_and_other_considerations;

            appendix_c_dummy_fields = continuance_fields.dummy_entities_companies_trust
            appedix_c_unusual_operations = continuance_fields.unusual_operations_regarding_economic_activites
            appendix_c_conclusion = continuance_fields.conclusion
            appendix_c_kyc = continuance_fields.kyc_procedures_performed;
            appendix_d = continuance_fields.appendix_d_assessment_of_compliance;

            transnational_calculator = continuance_fields.transnational_calculator;            
            s90_calculator = continuance_fields.s90_calculator;
            s90_considerations = continuance_fields.s90_considerations;

            assurance_non_assurance_calculator = acceptance_fields.assurance_non_assurance_calculator;
            

        break;

        case "continuance lite":
            //change to continuance lite when the cube is set up
            consolidate_all_fields = sharepoint_utilities.consolidate_fields(continuance_lite_fields);
            query_fields = sharepoint_utilities.generate_query_for_expanded_fields(consolidate_all_fields);  

            giac_query_fields = sharepoint_utilities.generate_query_for_expanded_fields(global_giac_form_fields.giac_form); 

            appendix_a_major_fields = continuance_lite_fields.part_a_risk_considered_as_major
            appendix_a_normal_fields = continuance_lite_fields.part_b_risk_considered_as_normal

            appendix_b_indpendence_fields = continuance_lite_fields.independence_and_other_considerations;           
            appendix_c_kyc = continuance_lite_fields.engagement_lite_know_your_client;           

            transnational_calculator = continuance_lite_fields.transnational_calculator;            
            s90_calculator = continuance_lite_fields.s90_calculator;

            ac_lite_main_section_fields = continuance_lite_fields.ac_lite
            ac_lite_money_laundering_fields = continuance_lite_fields.a_and_c_lite_assessment_of_risk


    }

    //just do the switching when using the relavant datasources
    let list_name = app_configuration.ac_submission;
    let list_context = app_configuration.site_context;   
    
    if(data_source_type == "archives"){
        //switch the context to retieve the data from the archives to use in the new continunace
        list_name = app_configuration.archive_list_name;
        list_context = app_configuration.archive_ac_submission_site_context;
    }


    //if there is already and in progress ac form; they need to complete it in that system first.
    if(data_source_type == "archives" && form_status == "existing"){
         //redirect user to the old site to complete it there first.
         let archive_site_url = "https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices/Lists/Client%20Information/EditForm.aspx?ID="+item_id+"&Source="+
         "https://mazarsglobalcloud.sharepoint.com/sites/ZAF-Mazars/SitePages/Mazars.aspx"
         window.open(archive_site_url,"_blank");
    }
    else{   

        var get_all_ac_data = sharepoint_utilities.get_list_items_by_title(
            list_context, 
            query_fields,
            "Id eq " + item_id,
            list_name,
            "Id desc");

        var get_giac_form_data = sharepoint_utilities.get_list_items_by_title(
            app_configuration.site_context, 
            giac_query_fields,
            "QRMACReference eq '"+item_id.toString()+"'",
            "GIAC Form",
            "Id desc");

        var supporting_questions_data = sharepoint_utilities.get_list_items_by_title(
            app_configuration.site_context, 
            "*",
            "QRMACReference eq '"+item_id.toString()+"'",
            "SupportingQuestions",
            "Id desc");

        var eqr_data = sharepoint_utilities.get_list_items_by_title(
            app_configuration.site_context, 
            "*",
            "QRMACReference eq '"+item_id.toString()+"'",
            "EQRAppointmentForm",
            "Id desc")

        var business_sustainability_data = sharepoint_utilities.get_list_items_by_title(
            app_configuration.site_context, 
            "*",
            "QRMACReference eq '"+item_id.toString()+"'",
            app_configuration.business_sustainability_list_name,
            "Id desc")
        


        $.when(get_all_ac_data,
                get_giac_form_data,
                   supporting_questions_data,
                        eqr_data,
                            business_sustainability_data)
                .done(function(get_all_ac_data_results,
                                    get_giac_form_data_results,
                                        supporting_questions_data_results,
                                            eqr_data_results,
                                                get_business_sustainability_data_results){

            main["selected_client_risk_data"] = get_all_ac_data_results[0];                   
           
                if(get_all_ac_data_results.length > 0){
                    //use that cube to display the relavant fields
                    sharepoint_utilities.display_saved_list_fields(
                        get_all_ac_data_results,
                        consolidate_all_fields,
                        null
                    );                    
                }    

                //render business sustainability form values
                if(get_business_sustainability_data_results.length >0){
                    client_risk_assesments.render_business_sustainability_form(
                        get_business_sustainability_data_results,
                        global_field_set_navigation.business_sustainability
                    )
                }

                //render the giac form values associated if available
                if(get_giac_form_data_results.length > 0){                 
                    giac_form.render_form_value(get_giac_form_data_results,global_giac_form_fields.giac_form);
                }
                if(supporting_questions_data_results.length > 0){
                    //render the appendix a form values
                    appendix_a_form.render_form_value(supporting_questions_data_results,appendix_a_major_fields);
                    appendix_a_form.render_form_value(supporting_questions_data_results,appendix_a_normal_fields);

                    //the rest of the supporting questions, appendix b - independance, kyc etc
                    supporting_questions.render_form_value(supporting_questions_data_results,appendix_b_indpendence_fields);
                    supporting_questions.render_form_value(supporting_questions_data_results,appendix_c_dummy_fields)
                    supporting_questions.render_form_value(supporting_questions_data_results,appedix_c_unusual_operations)
                    supporting_questions.render_form_value(supporting_questions_data_results,appendix_c_conclusion)
                    supporting_questions.render_form_value(supporting_questions_data_results,appendix_c_kyc)
                    supporting_questions.render_form_value(supporting_questions_data_results,appendix_d)
                    supporting_questions.render_form_value(supporting_questions_data_results,transnational_calculator)
                    supporting_questions.render_form_value(supporting_questions_data_results,s90_calculator);
                    supporting_questions.render_form_value(supporting_questions_data_results,s90_considerations);
                    supporting_questions.render_form_value(supporting_questions_data_results,assurance_non_assurance_calculator);
                
                }
                
                if(eqr_data_results.length > 0){
                     //render the eqr values from the data source onto the form
                    eqr_appointment_form.render_form_value(eqr_data_results,global_field_set_navigation.eqr_appointment_form);
                }
               
                if(form_status == "new"){
                    //if its a new form the show the create button by default
                    sharepoint_utilities.set_field_value("Form_x0020_Status","Not Started");
                    $(".header-right-container-container").html("<div class='reference-id client-reference-id'>Waiting for submission</div>");

                }else{

                    //otherwise if its an existing from show the next button to update the date
                    sharepoint_utilities.hide_fields(["client-risk-assessments-create-button"]);
                    sharepoint_utilities.show_fields(["client-assessment-general-next"]);   

                    let client_form_description = "CRA " + get_all_ac_data_results[0].Id + " - " + sharepoint_utilities.check_for_null(get_all_ac_data_results[0].ClientTaskCode,"N/A")
                    $(".header-right-container-container").html("<div class='reference-id client-reference-id'>"+client_form_description+"</div>");  
                    //check for service type
                    $("ul[data-app-name='Client Acceptance and Continuance'] > ul li").removeClass("nav-item-disabled");
                    
                }

                if(get_all_ac_data_results.length > 0){  
                   
                    //run all hide how rules
                                 

                    sharepoint_utilities.hide_fields(
                        ["btn-query-approver-configuration","btn-approve-approval-task-request","btn-decline-approval-task-request",
                        "current-approval-progress-section-placeholder","btn-start-approval-process","preview-approval-section-placeholder"
                    ]);
 
                    /* default fields to disable when the form has been created for the first time */
                    let default_disabled_fields = ["ClientName","ClientTaskCode","AcceptanceOrContinuance","RequestOffice","ClientAcceptanceType"]
                    sharepoint_utilities.disable_fields(default_disabled_fields);           

                    let field_properties = sharepoint_utilities.get_field_values(["Form_x0020_Status","ClientName"]);                      
                    
                    switch(field_properties.meta_package["Form_x0020_Status"]){

                        case "Not Started":
                            sharepoint_utilities.show_fields(["btn-query-approver-configuration"]);
                            sharepoint_utilities.show_fields(["preview-approval-section-placeholder"])
			                sharepoint_utilities.show_fields(["btn-start-approval-process"]);   
                            sharepoint_utilities.enable_fields(default_disabled_fields); 
                            client_risk_assesments.render_task_code_component(field_properties.meta_package["ClientName"],"ClientTaskCode");

                        break;

                        case "In Progress":
                            sharepoint_utilities.show_fields(["btn-query-approver-configuration"]);
                            sharepoint_utilities.show_fields(["preview-approval-section-placeholder"])
			                sharepoint_utilities.show_fields(["btn-start-approval-process"]);
                            sharepoint_utilities.enable_fields(default_disabled_fields); 
                            client_risk_assesments.render_task_code_component(field_properties.meta_package["ClientName"],"ClientTaskCode");
                        break;

                        case "Changes Requested":
                            sharepoint_utilities.show_fields(["btn-query-approver-configuration"]);
                            sharepoint_utilities.show_fields(["preview-approval-section-placeholder"])
			                sharepoint_utilities.show_fields(["btn-start-approval-process"]);
                            sharepoint_utilities.enable_fields(default_disabled_fields); 
                            client_risk_assesments.render_task_code_component(field_properties.meta_package["ClientName"],"ClientTaskCode");
                        break;

                        

                        case "s90 Cancelled":
                            client_risk_assesments.lock_down_form();  
                        break;

                        case "Cancelled":                           
                            client_risk_assesments.lock_down_form();  
                        break;

                        case "Declined":                           
                            client_risk_assesments.lock_down_form();                             
                        break;

                        case "Resigned":                           
                            client_risk_assesments.lock_down_form();               
                        break;

                        case "Waiting on Approval":
                            client_risk_assesments.lock_down_form();  
                            sharepoint_utilities.show_fields(["btn-approve-approval-task-request","btn-decline-approval-task-request","current-approval-progress-section-placeholder"]);
                    
                        break;

                        case "Completed":
                            client_risk_assesments.lock_down_form();  
                        break;                      
                        
                    }
                }
                                   
                switch(action_type.toLowerCase()){
                    
                    case "acceptance":
                           //navigate the user to the acceptance section                   
                           sharepoint_utilities.set_select_2_fields_by_value("Acceptance",$("select[data-sp-element-name='AcceptanceOrContinuance']"));  
                            
                           $("li[data-link-id='Client Acceptance']").removeClass("nav-item-disabled");
                           $("li[data-link-id='Client Acceptance']").click();
                       break;
   
                       case "continuance":
                           //navigate the user to the continuance section                           
                            sharepoint_utilities.set_select_2_fields_by_value("Continuance",$("select[data-sp-element-name='AcceptanceOrContinuance']"));  
                            sharepoint_utilities.disable_fields(["ClientName"])
                            
                            sharepoint_utilities.set_select_2_fields_by_value("Already proposed and won",$("select[data-sp-element-name='StatusPerformed']")); 
                            sharepoint_utilities.hide_fields(["StatusPerformed"])

                            $("li[data-link-id='Client Continuance']").removeClass("nav-item-disabled");
                            $("li[data-link-id='Client Continuance']").click();                        
                                                        
                       break;

                       case "continuance lite":

                            if(supporting_questions_data_results.length > 0){
                                supporting_questions.render_form_value(supporting_questions_data_results,ac_lite_main_section_fields)
                                supporting_questions.render_form_value(supporting_questions_data_results,ac_lite_money_laundering_fields);
                            }
    
                            //navigate the user to the continuance section                           
                            sharepoint_utilities.set_select_2_fields_by_value("Continuance",$("select[data-sp-element-name='AcceptanceOrContinuance']"));  
                            $("li[data-link-id='Client Continuance Lite']").removeClass("nav-item-disabled");
                            $("li[data-link-id='Client Continuance Lite']").click();
                            
                                                        
                       break;                      
               } 

            setTimeout(function(){
              
                canvas.removeClass("hide");
                $(".page-loader-header").addClass("hide");
                //show the first section
                canvas.find("div[form-navigation-target]:first-child").removeClass("hide");            
                if(get_all_ac_data_results.length > 0){
                    comments_controller.get_all_comments(get_all_ac_data_results[0].Id,app_configuration.ac_comments_list_name)
                }

                 //check to see if the form status is a new continuance
                 if(client_risk_assesments["new_continuance_form"] == "yes"){
                    sharepoint_utilities.set_select_2_fields_by_value("Continuance",$("select[data-sp-element-name='AcceptanceOrContinuance']"));
                    client_risk_assesments["new_continuance_form"] = "done";                      
                    
                    $("select[data-sp-element-name='ClientName']").prop("disabled",true);

                    client_risk_assesments.render_task_code_component(get_all_ac_data_results[0].ClientName,"ClientTaskCode");
                }
                
                client_risk_assesments.rule_engine();                   
                

            },1000)           
        
        });
    }
}


client_risk_assesments.lock_down_form = function(){

    sharepoint_utilities.hide_fields(
        ["btn-approve-approval-task-request","btn-decline-approval-task-request",
            "btn-resign-from-engagement","sp-temp-bulk-mark-risks-part-a","sp-temp-bulk-mark-risks-part-b",
        ]);
                          
    $("input[value='Next']").parent().addClass("hide");
    $("input[value='Back']").parent().addClass("hide");

    $("div[app-name='Client Acceptance and Continuance'] input").prop("disabled",true);
    $("div[app-name='Client Acceptance and Continuance'] select").prop("disabled",true);
    $("div[app-name='Client Acceptance and Continuance'] textarea").prop("disabled",true);
    $("div[app-name='Client Acceptance and Continuance'] .radio-button-component").prop("disabled",true);
    $("div[app-name='Client Acceptance and Continuance'] .radio-button-component").css("pointer-events","none");  
    $(".add-new-repeating-table-row").addClass("hide")

    //allow field commenting
    $("div[sp-additional-properties*='display-field-commenting']").find("div.field-commenting-container textarea").prop("disabled",false);
   
}

client_risk_assesments.mark_all_risks_in_bulk = function(section_name,selected_value){

    section_name.find("div.form-row[sp-additional-properties='radio-buttons-own-values']").each(function(){

        let sp_field_name = $(this).attr("sp-field-name");              
        if(sp_field_name.indexOf("temp-bulk") == -1){
            sharepoint_utilities.set_radio_value(sp_field_name,selected_value);              
        }
    });

    client_risk_assesments.determine_risk_status();
}

client_risk_assesments.determine_risk_status = function(){

    var TotalMediumRisks = 0;
	var TotalHighRisks = 0;
	
	var TotalMajorRisksHigh = 0;
	var TotalMajorRisksMedium = 0;

    var risk_outcome = "Not Risky";

    $("div[form-navigation-target='Part A - Risk Considered as Major'] input[data-sp-element-name *='PartA']").each(function(){

        switch($(this).val()){

            case "Medium":
                TotalMajorRisksMedium += 1;
            break;

            case "High":
                TotalMajorRisksHigh += 1;
            break
        }       

    });

    $("div[form-navigation-target='Part B - Risk Considered as Major'] input[data-sp-element-name *='PartB']").each(function(){

        switch($(this).val()){

            case "Medium":
                TotalMediumRisks += 1;
            break;

            case "High":
                TotalHighRisks += 1;
            break
        }
    });

    //-------------------------risk rules
    //one major risk (in bold characters) is assessed as high
    if(TotalMajorRisksHigh >= 1){risk_outcome = "Risky"}
    //two major risks are assessed as medium
    if(TotalMajorRisksMedium >= 2){risk_outcome = "Risky"}
    //three risks are assessed as medium which one is major
    if(TotalMajorRisksMedium >= 1 && TotalMediumRisks >= 2 ){risk_outcome = "Risky"}
    //two risks are assessed as high and one risk  as medium
    if(TotalHighRisks >= 2 && TotalMediumRisks >= 1){risk_outcome = "Risky"}	
    //One risk is assed as hisgh and two risks as medium
    if(TotalHighRisks >= 1 && TotalMediumRisks >= 2){risk_outcome = "Risky"}	
	
    let crypro_engagement_value = $("input[data-sp-element-name='CryptoEngagment']").val();
    if(crypro_engagement_value == 'Yes'){
        risk_outcome = "Risky";     
    }

    //Check PIE Fields for additional risky calculations
    let field_properties = sharepoint_utilities.get_field_values(["HasRussianEntities","HasRiskAppetite","MoneyLaunderingRisk","NASRiskyServices"]).meta_package; 
    
    if(field_properties.HasRussianEntities == "Yes" || field_properties.HasRiskAppetite == "Yes" || field_properties.MoneyLaunderingRisk == "High"){
        risk_outcome = "Risky"; 
    } 

    //if there are options other than the below that was selected the form is set to risk
    if(field_properties.NASRiskyServices){
        if(field_properties.NASRiskyServices.indexOf("None") == -1 || field_properties.NASRiskyServices.indexOf("") == -1){
            risk_outcome = "Risky"; 
        }
    }


    if(risk_outcome == "Risky"){
        sharepoint_utilities.set_fields_as_required(["RiskDescription"]);
    }else{
        sharepoint_utilities.set_fields_as_not_required(["RiskDescription"]);
    }
	//------------------------------------------
    sharepoint_utilities.set_field_value("RiskStatus",risk_outcome); 
    

}


client_risk_assesments.download_pdf = function(submission_data){


    let item_id = parseInt(submission_data.attr("data-itemid"));
    let action_type = submission_data.attr("data-action-type");
    let data_source_type = submission_data.attr("data-source-type");
    let data_service_type = submission_data.attr("data-service-type")

     //just do the switching when using the relavant datasources
     let library_name = app_configuration.ac_current_supporting_documents_library;
     let list_context = app_configuration.site_context;
 
     if(data_source_type == "archives"){
         library_name = app_configuration.ac_archive_supporting_documents_library;
         list_context = app_configuration.archive_ac_submission_site_context;
         data_service_type = "Client Acceptance and Continuance (A to C)";
     }

     var get_form_reference = sharepoint_utilities.get_list_items_by_title(
         list_context, 
         "Id,FileRef,FileLeafRef",
         "ReferenceID eq '" + item_id + "' and DocumentType eq '"+data_service_type+"'",
         library_name,
         "Id desc&$top=1");     
 
     $.when(get_form_reference).done(function(document_properties){       

        if(document_properties.length > 0){
            sharepoint_utilities.download_file(list_context,document_properties[0].FileRef,document_properties[0].FileLeafRef);
        }else{
            sharepoint_utilities.render_notification("Download PDF","Cannot find PDF to download in the "+ data_source_type +" system","Warning");
            if(data_source_type == "archives"){
                    window.open(app_configuration.archive_ac_submission_site_context+"/Lists/Client%20Information/EditForm.aspx?ID="+ item_id +
                            "&Source="+app_configuration.mazars_intranet,"blank")
            }
        }
     });
}

client_risk_assesments.prompt_new_acceptance_record = function(){

    let box_options = {
        "Yes":function(){
            client_risk_assesments.create_new_acceptance_record();
        },
        "No":function(){}
    }
    //add the are you sure pop up box
    sharepoint_utilities.render_confirmation_box("Creating a new client acceptance",
        "You are about to create a new client acceptance form. Are you sure you want to do this",box_options,"95%");  
}

client_risk_assesments.create_new_acceptance_record = function(){  
    
    sharepoint_utilities.hide_fields(["client-risk-assessments-create-button"]);  
    //this checks all the properties of the configured fields and returns and obj of all the values and validation status etc.
   
    let get_meta_package = sharepoint_utilities.create_meta_package($("div[form-navigation-target='General'] .client-acceptance-general"));

    if(!get_meta_package.IsValid){

        sharepoint_utilities.render_notification("Error",get_meta_package.validation_message,"Warning");  
        sharepoint_utilities.show_fields(["client-risk-assessments-create-button"]);    

    }else{      
     
        get_meta_package["Form_x0020_Status"] = "In Progress";

        sharepoint_utilities.vaildate_meta_package(
            get_meta_package,
            app_configuration.site_context,
            app_configuration.ac_submission,
            function commit_success(data){       

                sharepoint_utilities.render_notification("Creating your acceptance form","Busy creating your acceptance form","Info");    
                main["selected_client_risk_data"] = data;
                main["has_source_data"] = true; 
                $(".third-level-navigation[data-history-index='[2,0,1]']").click();
                //create the GIAC form record and reference - wont always be used, but we are provisioning it anyways for simplicity
                giac_form.create_new_form(data.Id);
                eqr_appointment_form.create_new_record(data.Id);
                supporting_questions.create_new_record(data.Id);
                client_risk_assesments.create_new_business_sustainability_form(data.Id)
                client_risk_assesments.intiate_lockdown_form(data.Id);

                client_risk_approvals.create_notification(_spPageContextInfo.userId,"Workflow handled","New request submitted",data.Id);	

                
                let client_form_description = "CRA " + data.Id + " - " + sharepoint_utilities.check_for_null(data.ClientTaskCode,"N/A")
                $(".header-right-container-container").html("<div class='reference-id client-reference-id'>"+client_form_description+"</div>");  
                 //Reset all links
                $("ul[data-app-name='Client Acceptance and Continuance'] > ul li").removeClass("nav-item-disabled");
                client_risk_assesments.rule_engine();

                

            },
            function commit_error(){

                main["selected_client_risk_data"] = [];
                main["has_source_data"] = false; 
                sharepoint_utilities.show_fields(["client-risk-assessments-create-button"])
            }
        )
    }
}

client_risk_assesments.prompt_new_continuance_record = function(){

    let box_options = {
        "Yes":function(){
            client_risk_assesments.create_new_continuance_record();
        },
        "No":function(){}
    }
    //add the are you sure pop up box
    sharepoint_utilities.render_confirmation_box("Creating a new client continuance",
        "You are about to start a continuance using the most recent record in the table below. Are you sure you want to do this",box_options,"70%");  
}

client_risk_assesments.create_new_continuance_record = function(){
    
    $("input[data-sp-element-name='client-risk-assessments-create-button']").addClass("hide");  

    
    //this checks all the properties of the configured fields and returns and obj of all the values and validation status etc.
    let general_meta = sharepoint_utilities.create_meta_package($("div[form-navigation-target='General'] > div"));
    let general_information_meta =  sharepoint_utilities.create_meta_package($("div[form-navigation-target='General Information About the Engagement'] > div"));
    let team_meta = sharepoint_utilities.create_meta_package($("div[form-navigation-target='Team Information'] > div"));
       
    let pie_meta = sharepoint_utilities.create_meta_package($("div[form-navigation-target='PIE'] > div"));

    let key_figure_meta = sharepoint_utilities.create_meta_package($("div[form-navigation-target='Key Figures - recent financial year'] > div"));

    let new_continuance_record_meta = {}
    let general_meta_properties = general_meta.meta_package;   
    //default set to In Progress when creating the record | First Submission
    general_meta.meta_package["Form_x0020_Status"] = "In Progress";

    if(general_meta_properties.ClientAcceptanceType == "Non-Assurance"){          
        new_continuance_record_meta["ACLiteVersion"] = "yes";
    }



    if(general_meta.IsValid){

        //merge the old data from a previous continunace or acceptance    
        new_continuance_record_meta = {          
            ...general_meta.meta_package,  
            ...general_information_meta.meta_package,
            ...team_meta.meta_package,
            ...pie_meta.meta_package,
            ...key_figure_meta.meta_package            
        }    

        $.when(sharepoint_utilities.save_item(
            app_configuration.ac_submission,
            app_configuration.site_context,
            new_continuance_record_meta
        )).done(function(data){

            sharepoint_utilities.render_notification("Saving your continuance form","Busy saving your continuance form","Info");
            main["selected_client_risk_data"] = data;
            main["has_source_data"] = true; 
            $(".third-level-navigation[data-history-index='[2,0,1]']").click();
            //create the GIAC form record and reference - wont always be used, but we are provisioning it anyways for simplicity
            giac_form.create_new_form(data.Id);
            eqr_appointment_form.create_new_record(data.Id);
            supporting_questions.create_new_record(data.Id);
            client_risk_assesments.create_new_business_sustainability_form(data.Id)

            client_risk_assesments.intiate_lockdown_form(data.Id);

            client_risk_approvals.create_notification(_spPageContextInfo.userId,"Workflow handled","New request submitted",data.Id);	

            $("ul[data-app-name='Client Acceptance and Continuance'] > ul li").removeClass("nav-item-disabled");
            $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='GIAC Form']").addClass("nav-item-disabled");
            $("ul[data-app-name='Client Acceptance and Continuance'] > ul li[data-link-id='EQR Calculator']").addClass("nav-item-disabled");
        })
        .fail(function(){
            main["selected_client_risk_data"] = [];
            main["has_source_data"] = false; 

        });  
    }else{
       sharepoint_utilities.render_notification
           (
               "Cannot continue",
               general_meta.validation_message,
               "Warning"
           )

           $("input[data-sp-element-name='client-risk-assessments-create-button']").removeClass("hide");
    }

}



client_risk_assesments.go_to_next_section = function(){

    let get_current_selected_item = app_configuration["currently-selected-section"];

    if(get_current_selected_item.length != 0){
        client_risk_assesments.identify_sections_to_update(get_current_selected_item,true);
        //check for disabled sections and ensure we dont activate them
        let check_for_sub_link_navigation = get_current_selected_item.nextAll("li").not(".nav-item-disabled").first().find("ul");
        //check to see if the next link is a top level link
        if(check_for_sub_link_navigation.length > 0){
            get_current_selected_item.nextAll("li").not(".nav-item-disabled").first().click()
            get_current_selected_item.nextAll("li").not(".nav-item-disabled").first().next().children("li:first-child").click();    
        }else{
            get_current_selected_item.nextAll("li").not(".nav-item-disabled").first().click();
        } 
        //check for the end of the navigation process     
        // Check if it is the last item
        if(get_current_selected_item.is(':last-child')){
            parent_level = get_current_selected_item.parent();
            parent_level.nextAll("li").not(".nav-item-disabled").first().click()
        }      

    }else{
        warning_controller.add_new_warning("Error","Section "+ get_current_selected_item.attr("data-link-id") +" not saved, Please ensure you have selected a section","Warning")
        sharepoint_utilities.render_notification("Error","Section not saved, Please ensure you have selected a section","Warning")
    }

    //updates validation comments etc in the right panel
    client_risk_approvals.validation_on_all_fields();    
    
}

client_risk_assesments.go_back_to_section = function(){
    
    let get_current_selected_item = app_configuration["currently-selected-section"];
  
    if(get_current_selected_item.length != 0){
        client_risk_assesments.identify_sections_to_update(get_current_selected_item,true);
        //check for disabled sections and ensure we dont activate them
        let check_for_sub_link_navigation = get_current_selected_item.prevAll("li").not(".nav-item-disabled").last().find("ul");

        //check to see if the next link is a top level link
        if(check_for_sub_link_navigation.length > 0){
            get_current_selected_item.prevAll("li").not(".nav-item-disabled").first().click()
            get_current_selected_item.prevAll("li").not(".nav-item-disabled").first().next().children("li:first-child").click();    
        }else{
            get_current_selected_item.prevAll("li").not(".nav-item-disabled").first().click();
        }

         //check for the end of the navigation process     
        // Check if it is the last item
        if(get_current_selected_item.is(':first-child')){
            parent_level = get_current_selected_item.parent();
            parent_level.prevAll("li").not(".nav-item-disabled").first().prev().click();  
        }    

    }else{
        
        warning_controller.add_new_warning("Error","Section "+ get_current_selected_item.attr("data-link-id") + " not saved, Please ensure you have selected a section","Warning")
        sharepoint_utilities.render_notification("Error","Section not saved, Please ensure you have selected a section","Warning")
    }

    //updates validation comments etc in the right panel
    client_risk_approvals.validation_on_all_fields();    
}

client_risk_assesments.identify_sections_to_update = function(current_section_name,include_notifications){

    //GIAC form source = GIAC Form List
    //Supporting Questions source = Supporting Questions list
    //eqr_appointment_form source = EQRAppointmentForm list
    //client_risk_assesments form source = ACSubmissions List

    // this is the unique section name
    let data_link_id = current_section_name.attr("data-link-id")

    let field_properties = sharepoint_utilities.get_field_values(["Form_x0020_Status"]);
    let form_status = field_properties.meta_package.Form_x0020_Status;

    if(form_status == "Not Started" || form_status == "In Progress" || form_status == "Changes Requested" || form_status == "Resigned"){    

        if(include_notifications){
            sharepoint_utilities.render_notification
            (
                "Saving your form",
                "Please wait while we save your selected section",
                "Info"
            )
        }
     
        let associated_source_id = null;
        let source_list_name = "";
        switch(data_link_id){

            case "GIAC Form":

                associated_source_id = main["giac_form_id"]
                source_list_name = app_configuration.giac_list_name                      
            break;

            case "Business Sustainability":

                associated_source_id = main["business_sustainability_form_id"]
                source_list_name = app_configuration.business_sustainability_list_name                      
            break;


            case "EQR Calculator":
                //eqr_appointment_form.update_form_values(data_link_id,include_notifications);   
                associated_source_id = main["eqr_form_id"]
                source_list_name = "EQRAppointmentForm"
            break;

            case "Part B - Risk Considered as Normal":
                //appendix_a_form.update_form_values(data_link_id,include_notifications);

                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
                
            break;

            case "Part A - Risk Considered as Major":
                //appendix_a_form.update_form_values(data_link_id,include_notifications);

                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
            break;       

            case "LITE":
                //supporting_questions.update_form_values(data_link_id,include_notifications)

                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
            break;

            case "Acceptance - Independence and other Considerations":
                //supporting_questions.update_form_values(data_link_id,include_notifications);

                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
            break;

            case "Continuance - Independence and other Considerations":
                //supporting_questions.update_form_values(data_link_id,include_notifications);

                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
            break;

            case "Indpendence and other considerations":
                //supporting_questions.update_form_values(data_link_id,include_notifications);

                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
            break;           

            case "PIE":
                //supporting_questions.update_form_values(data_link_id,include_notifications); 

                associated_source_id = main["selected_client_risk_data"].Id
                source_list_name = app_configuration.ac_submission
            break;

            case "S90 Calculator":
                //client_risk_assesments.update_form_values("PIE",include_notifications)
                //supporting_questions.update_form_values(data_link_id,include_notifications);   
                
                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"

                  //if this is not a bulk save all update
                if(include_notifications){
                    //update the pie section independantly          
                    save_sections.update_data_source(main["selected_client_risk_data"].Id,"PIE",
                        app_configuration.ac_submission,include_notifications)
                }  
            
            break;
            case "S90 Considerations":
                //client_risk_assesments.update_form_values("PIE",include_notifications)
                //supporting_questions.update_form_values(data_link_id,include_notifications);
                
                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"

                //if this is not a bulk save all update
                if(include_notifications){
                    //update the pie section independantly          
                    save_sections.update_data_source(main["selected_client_risk_data"].Id,"PIE",
                        app_configuration.ac_submission,include_notifications)
                }
           
            break;

            case "Transnational Calculator":
                //client_risk_assesments.update_form_values("PIE",include_notifications)
                //supporting_questions.update_form_values(data_link_id,include_notifications);   
                
                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"

                  //if this is not a bulk save all update
                if(include_notifications){
                    //update the pie section independantly          
                    save_sections.update_data_source(main["selected_client_risk_data"].Id,"PIE",
                        app_configuration.ac_submission,include_notifications)
                }
            break;

            case "Fee Considerations":
                //supporting_questions.update_form_values(data_link_id,include_notifications);   
                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"    
            break;
            case "Know your client (KYC) procedures performed":
                //supporting_questions.update_form_values(data_link_id,include_notifications);     
                
                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
            break;

            case "Risk Status":
                //client_risk_assesments.update_form_values(data_link_id,include_notifications)    
                
                associated_source_id = main["selected_client_risk_data"].Id
                source_list_name = app_configuration.ac_submission
            break;        

            case "Dummy Entities, Companies or Trusts Other Purpose":
                //supporting_questions.update_form_values(data_link_id,include_notifications);

                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
            break;

            case "Unusual Operations Regarding the Economic Activities of the Client":
                //supporting_questions.update_form_values(data_link_id,include_notifications);

                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
            break;

            case "Conclusion":
                //supporting_questions.update_form_values(data_link_id,include_notifications);

                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
            break;

            case "1. Assessment of compliance with Independence rules":
                //supporting_questions.update_form_values(data_link_idinclude_notifications,);

                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
            break;        
        
            case "Assessment of the risk of money laundering and terrorist financing acts":
                //supporting_questions.update_form_values(data_link_id,include_notifications);

                associated_source_id = main["supporting_questions_id"]
                source_list_name = "SupportingQuestions"
            break;

            case "Approvals":
                //client_risk_assesments.update_form_values("General",include_notifications);  
                
                associated_source_id = main["selected_client_risk_data"].Id
                source_list_name = app_configuration.ac_submission
            break;

            case "Supporting Documents":
                // client_risk_assesments.update_form_values("General")
                //client_risk_assesments.update_form_values(data_link_id,include_notifications)
           
                associated_source_id = main["selected_client_risk_data"].Id
                source_list_name = app_configuration.ac_submission;

                  //if this is not a bulk save all update
                if(include_notifications){
                    //update the pie section independantly          
                     //update the general section independantly
                    save_sections.update_data_source(associated_source_id,"General",
                        source_list_name,include_notifications)    
                }
                break;        

            default:

                associated_source_id = main["selected_client_risk_data"].Id
                source_list_name = app_configuration.ac_submission
                //all the other sections - uses the original data source link
                //client_risk_assesments.update_form_values(data_link_id,include_notifications);

                if(data_link_id == "General" || data_link_id == "Team Information"){
                    //if the client name changes -> check for a lockdown item and update the lockdown item with the new selected client name
                    client_risk_assesments.lockdown_sync_client_details();
                }
            break;

        }

        save_sections.update_data_source(associated_source_id,data_link_id,source_list_name,include_notifications
        )
    }else{
        sharepoint_utilities.render_notification
        (
            "Saving Prohibited",
            "You can only save values when the form is Not Started | In Progress | Changes Requested | Resigned Status",
            "Info|Warning"
        )
    }  

      
}


client_risk_assesments.update_form_values = function(section_name,include_notifications){

    //get the current section
    let item_id = main["selected_client_risk_data"].Id;
  
    if(item_id){
        //get all fields in the current section
        let get_meta_package = sharepoint_utilities.create_meta_package($("div[form-navigation-target='"+section_name+"'] > div"));   

        if(save_sections.has_data(get_meta_package.meta_package)){
            //once the first update is done - always set the form to In Progress
            let field_properties = sharepoint_utilities.get_field_values(["Form_x0020_Status"]);
            if(field_properties.meta_package["Form_x0020_Status"] == "Not Started"){
                get_meta_package.meta_package["Form_x0020_Status"] = "In Progress";
            }   
            
            //check for a null not required multi select people picker
            if(field_properties.meta_package["AppendixDEngagagementPartnersId"] == "#;"){
                delete field_properties.meta_package["AppendixDEngagagementPartnersId"];
            }

            //update the current secction
            $.when(sharepoint_utilities.update_item(
                app_configuration.ac_submission,
                app_configuration.site_context,
                get_meta_package.meta_package,
                item_id
                ))
            .done(function(response){
                
                //auto close the window
                if(response == "success"){

                    if(include_notifications){
                        warning_controller.add_new_warning(section_name + "form Updated","Your current working form was updated","Info");  
                        //move to the next section of the form
                    }
                            
                }else{

                    if(include_notifications){
                        warning_controller.add_new_warning("Error","Something went wrong while updating your form","Warning");    
                    }       
                }            
            }) ; 
        }else{
            console.log("Nothing to save in " + section_name + ". Nothing has been selected yet")
        }   

    }else{
            sharepoint_utilities.render_notification("Cannot update form","Cannot find the unique form reference for the current submission to update","Warning");
       }
    

}

client_risk_assesments.intiate_lockdown_form = function(qrm_ac_id){

    let field_properties = sharepoint_utilities.get_field_values(
        ["ExpectedSigningDate","ClientName","RequestOffice","EngagementPartnerId",
        "EngagementManagerId","FinancialYearEnd","ClientRegOrTaxNumber","ClientTaskCode","ClientAcceptanceType",
         "AuditSoftwarePackageUsed"       
        ]
    );


    //creates a new form when the QRM form is created for the first time 
    //this checks all the properties of the configured fields and returns and obj of all the values and validation status etc.

    if(field_properties.meta_package["ClientAcceptanceType"] == "Assurance"){
        //calculate the additional fields with pre set dates
        var AssemblyDate = moment(field_properties.meta_package["ExpectedSigningDate"]).add(60,"days").format(app_configuration.date_format);
        var kpi_deadline_date = moment(field_properties.meta_package["ExpectedSigningDate"]).add(45,"days").format(app_configuration.date_format);

        let record_meta = {
            "QRMACReference":qrm_ac_id.toString(),
            "ExpectedSigningDate":field_properties.meta_package["ExpectedSigningDate"],
            "ClientName":field_properties.meta_package["ClientName"],   
            "RegistrationNumber":field_properties.meta_package["ClientRegOrTaxNumber"],    
            "Region":field_properties.meta_package["RequestOffice"],
            "TaskCode":field_properties.meta_package["ClientTaskCode"],
            "AssemblyDeadline":AssemblyDate,
            "MazarsKPIDeadline":kpi_deadline_date,
            "YearEndEngagement":moment(field_properties.meta_package["FinancialYearEnd"]).format(app_configuration.date_format),
            "EngagementPartnerId":parseInt(field_properties.meta_package["EngagementPartnerId"]),
            "EngagementManagerId":parseInt(field_properties.meta_package["EngagementManagerId"]),
            "AuditSoftwarePackageUsed":field_properties.meta_package["AuditSoftwarePackageUsed"]
        }

        $.when(sharepoint_utilities.save_item(
            "Lockdown List",
            app_configuration.site_context,
            record_meta
        ))
        .done(function(response){	
        
        });
    }
}

// is this a group engagment > not specififed if its applicable to non-assurance or assurance
$(document).on("change","input[data-sp-element-name='IsGroupEngagement']",function(){
    client_risk_assesments.display_conditional_appendix_q11()
 })

 // pull this out into a new method
 client_risk_assesments.display_conditional_appendix_q11 = function(){

        
    let value = $("input[data-sp-element-name='IsGroupEngagement']").val();

    if(value == "Yes"){
        sharepoint_utilities.show_fields(["Q11PartA", "C11PartA"])
            sharepoint_utilities.set_fields_as_required(["Q11PartA", "C11PartA"])
        } else {
            sharepoint_utilities.hide_fields(["C11PartA", "Q11PartA"])
            sharepoint_utilities.set_fields_as_not_required(["Q11PartA", "C11PartA"])
    }
 }



 $(document).on("change","input[data-sp-element-name='IsBlackListed']",function(){
    client_risk_assesments.validate_blacklisted()
 })


 // check blacklisted
 client_risk_assesments.validate_blacklisted = function(){

    let value = $("input[data-sp-element-name='IsBlackListed']").val();

    if(value == "Yes"){
        sharepoint_utilities.show_fields(["onlineBlacklisted", "onlineBlacklisted"])
            sharepoint_utilities.set_fields_as_required(["onlineBlacklisted", "onlineBlacklisted"])
            //country risk manager needs to be part of the approvals
        } else {
            sharepoint_utilities.hide_fields(["onlineBlacklisted", "onlineBlacklisted"])
            sharepoint_utilities.set_fields_as_not_required(["onlineBlacklisted", "onlineBlacklisted"])
    }
 }

 $(document).on("change", "select[data-sp-element-name='SpecialistsRequired']", function(){
    client_risk_assesments.check_specialist_other();
});

 client_risk_assesments.check_specialist_other = function(){
        var selectedValues = [];

        //check if there are values already selected upon load
    
        $('.select2-selection__choice').each(function () {
            var value = $(this).text().substring(1).trim();
            selectedValues.push(value);

            if(selectedValues.includes("Other") == true){
                sharepoint_utilities.show_fields(["SpecialistComments"]);
                sharepoint_utilities.set_fields_as_required(["SpecialistComments"]);
            } else {
                sharepoint_utilities.hide_fields(["SpecialistComments"]);
                sharepoint_utilities.set_fields_as_not_required(["SpecialistComments"])
            }

            if (selectedValues.includes('None')) {
                selectedValues = ['None'];
            }
        });
       
 }

 client_risk_assesments.carl_partner_validation = function(){

    let get_field_properties = sharepoint_utilities.get_field_values(["ClientAcceptanceType","IsTransnational","OtherPieEntities","IsListedClient","IsCarlPartner"])
    let field_values = get_field_properties.meta_package;
    //only for assurance
    let ServiceType = field_values["ClientAcceptanceType"];
	let TransnationalStatus = field_values["IsTransnational"];
	let IsOtherPie = field_values["OtherPieEntities"];
	let IsListed = field_values["IsListedClient"];

	let carl_status = field_values["IsCarlPartner"];

	let check_if_PIE_client = client_risk_approvals.check_for_pie_client(IsOtherPie,IsListed);

	if(check_if_PIE_client){
        sharepoint_utilities.set_fields_as_required(["IsCarlPartner"])  
        sharepoint_utilities.show_fields(["IsCarlPartner"]);
        sharepoint_utilities.set_field_value("Q1ClientCalc","Yes"); 

		if(ServiceType == "Assurance"){		            
            if(carl_status == "No"){
                warning_controller.add_new_warning("CEO Approval for non-CARL partner required","Please upload your CEO and Country Risk Manager Approval for this client under supporting documents","Info")
                //sharepoint_utilities.render_notification("CEO Approval Required","Please upload your CEO and Country Risk Manager Approval for this client under supporting documents","Info")
                //add to the list of required documents that they need to upload CEO approval under supporting documents
                supporting_documents.append_to_current_document_required("CEO/CRM Approval of a non-CARL Partner");
            }else{
                supporting_documents.append_to_current_document_required("CEO/CRM Approval of a non-CARL Partner","remove");
            }         
		}
	}else{     
    
        //we need to clear the value of the field
        sharepoint_utilities.set_radio_value("IsCarlPartner","");
        //hide hte Carl Partner Question and Set to not required
        sharepoint_utilities.hide_fields(["IsCarlPartner"]);
        sharepoint_utilities.set_fields_as_not_required(["IsCarlPartner"]);      
        
        sharepoint_utilities.set_field_value("Q1ClientCalc","No"); 
       
    }
}

client_risk_assesments.general_acceptance_continuance_rules = function(){

    let field_properties = sharepoint_utilities.get_field_values(["ClientAcceptanceType","AcceptanceOrContinuance"]).meta_package; 
    
    let acceptance_or_continuance = field_properties["AcceptanceOrContinuance"]
    let assurance_or_non_assurance = field_properties["ClientAcceptanceType"]     

    let assurance_specific_fields = ["IsNewClient"]    
    sharepoint_utilities.hide_fields(assurance_specific_fields)
    sharepoint_utilities.set_fields_as_not_required(assurance_specific_fields);   

    let continuance_specific_fields = ["NewEngagementUtilized"]

    switch(acceptance_or_continuance){

        case "Acceptance":                    
        
            if(assurance_or_non_assurance == "Acceptance"){
                sharepoint_utilities.show_fields(assurance_specific_fields)
                sharepoint_utilities.set_fields_as_required(assurance_specific_fields)            
            }        

        break;

        case "Continuance":

            sharepoint_utilities.show_fields(continuance_specific_fields)
            sharepoint_utilities.set_fields_as_required(continuance_specific_fields)
        
        break;
    }

}


client_risk_assesments.business_sustainablity_form_rules = function(){

/*
    If the team selects business sustainability as a service line (see Ref 1 above) - this section will open and needs to be answered by them.
    Refer to the business sustainability questions tab for the questions that would need to go under this sub-section. I've split it into two sub-sections - Part A: Risks considered major and Part B: Normal risks
    These are risk questions and should have radio buttons for Low/Medium/High Risk.
    All questions should also have mandatory comment boxes for additional documentation.
*/

    let required_fields = [
        "BSPAQ1","BSPAQ2","BSPBQ1","BSPBQ2","BSPBQ3","BSPBQ4","BSPBQ5","BSPBQ6","IsIndependant",
        "BSPAQ1Comments","BSPAQ2Comments","BSPBQ1Comments","BSPBQ2Comments","BSPBQ3Comments","BSPBQ4Comments","BSPBQ5Comments","BSPBQ6Comments"
    ];
    let additional_questions = ["IsGroupEngagementPartner","PreviousAuditorOrIASP"]

    let get_field_properties = sharepoint_utilities.get_field_values(["MazarsServiceLine","IsIndependant"]).meta_package;

    sharepoint_utilities.set_fields_as_not_required(required_fields);
    sharepoint_utilities.set_fields_as_not_required(additional_questions)
    sharepoint_utilities.hide_fields(additional_questions)
    if(get_field_properties["MazarsServiceLine"] == "Advisory - Business Sustainability"){
        //enable form on the left
        $("li[data-link-id='Business Sustainability']").removeClass("nav-item-disabled");      
        sharepoint_utilities.set_fields_as_required(required_fields)

    }else{
        //disable form
        $("li[data-link-id='Business Sustainability']").addClass("nav-item-disabled");
    }

    //rules to hide show sections
    if(get_field_properties["IsIndependant"] == "Yes"){

        sharepoint_utilities.show_fields(additional_questions)
        sharepoint_utilities.set_fields_as_required(additional_questions)
    }

}

client_risk_assesments.create_new_business_sustainability_form = function(qrm_ac_id){

    //creates a new form when the QRM form is created for the first time 
    //this checks all the properties of the configured fields and returns and obj of all the values and validation status etc.
    let record_meta = {
        "QRMACReference":qrm_ac_id.toString()
    }
    $.when(sharepoint_utilities.save_item(
        app_configuration.business_sustainability_list_name,
        app_configuration.site_context,
        record_meta
    ))
    .done(function(response){	
        main["business_sustainability_form_id"] = response.Id
    });

}

client_risk_assesments.render_business_sustainability_form = function(field_results,field_set){

    main["business_sustainability_form_id"] = field_results[0].Id
    //renders existing form values     
    //use that cube to display the relavant fields
    sharepoint_utilities.display_saved_list_fields(
        field_results,
        field_set,
        null
    );    
}