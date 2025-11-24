var non_assurance_functions = {};

$(document).on("change","input[data-sp-element-name='AUPClient']",function(){

    non_assurance_functions.aup_report();
})

$(document).on("change", "input[data-sp-element-name='NASReport']", function(){
    non_assurance_functions.show_applicable_nas_standards();
});

non_assurance_functions.general_rules = function(){ 

    non_assurance_functions.determine_fee_considerations_display();   
    non_assurance_functions.independance_and_other_considerations_rules();  
    non_assurance_functions.show_applicable_nas_standards();
    
}

non_assurance_functions.show_applicable_nas_standards = function(){

    let field_properties = sharepoint_utilities.get_field_values(["NASReport"]); 
    sharepoint_utilities.hide_fields(["ApplicableStandard"]);       

    if(field_properties.meta_package["NASReport"]== "Yes"){
        sharepoint_utilities.show_fields(["ApplicableStandard"]);   
    }  

}

non_assurance_functions.aup_report = function(){
    var AUPReportPublic = $("input[data-sp-element-name='AUPClient']").val()
    // target the radio button yes selection
    if(AUPReportPublic == "Yes"){
        sharepoint_utilities.show_fields(["engagementIsRisky"])
        sharepoint_utilities.render_notification("Engagement Status", "Your engagement has been flagged as risky", "Warning")
    }else{
        sharepoint_utilities.hide_fields(["engagementIsRisky"])
    }
}

non_assurance_functions.validate_isrs4400_rule = function(){

    var validate_isrs4400 = $("select[data-sp-element-name='ApplicableStandard']").val(); 

    let isrs_fields = ["AUPPolicy","AUPClient"];

    if(validate_isrs4400){
        if(validate_isrs4400.indexOf("ISRS 4400") >= 0){
            sharepoint_utilities.show_fields(isrs_fields)
            sharepoint_utilities.set_fields_as_required(isrs_fields)
        }
    }

}

non_assurance_functions.aup_policy = function(){
    var AUPPolicy = $("input[data-sp-element-name='AUPPolicy']").val();
    if(AUPPolicy == "Yes"){
        sharepoint_utilities.show_fields(["engagementIsRisky"])
        sharepoint_utilities.render_notification("Engagement Status", "Your engagement has been flagged as risky", "Warning")
    }else{
        sharepoint_utilities.hide_fields(["engagementIsRisky"])
    }
}



// non-assurance services performed by the firm [E106]
$(document).on("change","select[data-sp-element-name='ClientAcceptanceType']",function(){    
  
     // on load if nas performed was laready selected, the supporting documents list is not set as a required document
     non_assurance_functions.determine_fee_considerations_display() 
})


$(document).on("change","input[data-sp-element-name='nonAssuranceServicePerformed']",function(){
    
    non_assurance_functions.determine_fee_considerations_display()
})

$(document).on("click","input[data-sp-element-name='sp-button-nas-rely-comply-assesment-creation']",function(){
    
    non_assurance_functions.create_rely_comply_assesment();
})


non_assurance_functions.create_rely_comply_assesment = function(){

    let list_of_fields = 
    [
        "M_ClientName","ClientRegOrTaxNumber","ClientAddress","NatureOfServicesDescription","ClientCountry",
        "ClientIndustry","ClientServiceLine","NatureOfClient","ClientServiceType"
    ]
    let get_field_properties = sharepoint_utilities.get_field_values(list_of_fields)

    if(get_field_properties.IsValid){
        sharepoint_utilities.render_notification("Creating Rely Comply Assesment", "You will recieve a confirmation email once completed", "Info")
        client_risk_approvals.create_notification(_spPageContextInfo.userId,"Workflow handled","RelyComplyAssesment",main["selected_client_risk_data"].Id);	        

    }else{
        sharepoint_utilities.render_notification("Rely Comply Assesment", get_field_properties.validation_message, "Warning")
    }
}

non_assurance_functions.determine_fee_considerations_display = function(){

    let get_field_properties = sharepoint_utilities.get_field_values(["nonAssuranceServicePerformed", "ClientAcceptanceType", "ListOfRequiredDocumentsJSON"])
    let field_values = get_field_properties.meta_package;
    
    // 17/11 required this to show on assurance instead of non-assurance
    let nas_performed = field_values["nonAssuranceServicePerformed"];
    let acceptance_type = field_values["ClientAcceptanceType"];       

        if(acceptance_type == "Assurance" && nas_performed =="Yes" ){
            $("li[data-link-id='Fee Considerations']").removeClass("nav-item-disabled");
            supporting_documents.append_to_current_document_required("Greatsoft Report"); 
            sharepoint_utilities.render_notification('Please upload Greatsoft Report', 'Please pull a report from GS and upload it as a supporting document', 'Warning')
            sharepoint_utilities.set_fields_as_required(["feeConsiderations"])

        } else {

            $("li[data-link-id='Fee Considerations']").addClass("nav-item-disabled")   
            supporting_documents.append_to_current_document_required("Greatsoft Report", "remove");
            sharepoint_utilities.set_fields_as_not_required(["feeConsiderations"]);
        }
}

non_assurance_functions.independance_and_other_considerations_rules = function(){

    let get_field_properties = sharepoint_utilities.get_field_values(["ClientAcceptanceType"])
    let field_values = get_field_properties.meta_package;

    let acceptance_type = field_values["ClientAcceptanceType"];  

    let question_set_to_toggle = 
    [
        "Q8Independence","C8Independence","Q9Independence","C9Independence","Q12Independence","C12Independence","Q13Independence","C13Independence",
        "Q14Independence","C14Independence"
    ]

    if(acceptance_type == "Non-Assurance"){

        //hide question 9 / 9 /12 /13 / 14
        //set to not required  
        sharepoint_utilities.set_fields_as_not_required(question_set_to_toggle);
        sharepoint_utilities.hide_fields(question_set_to_toggle);
    }else {

        //showquestion 9 / 9 /12 /13 / 14
        sharepoint_utilities.set_fields_as_required(question_set_to_toggle);
        sharepoint_utilities.show_fields(question_set_to_toggle);
    }

}


non_assurance_functions.independance_and_other_considerations_rules = function(){

    let get_field_properties = sharepoint_utilities.get_field_values(["ClientAcceptanceType"])
    let field_values = get_field_properties.meta_package;

    let acceptance_type = field_values["ClientAcceptanceType"];  

    let question_set_to_toggle = 
    [
        "Q7Independence","C7Independence","C8Independence","Q9Independence","C9Independence","Q12Independence","C12Independence","Q13Independence","C13Independence",
        "Q14Independence","C14Independence"
    ]

    if(acceptance_type == "Non-Assurance"){

        //hide question 7 / 8 / 9 /12 /13 / 14
        //set to not required  
        sharepoint_utilities.set_fields_as_not_required(question_set_to_toggle);
        sharepoint_utilities.hide_fields(question_set_to_toggle);
    }else {

        //showquestion 9 / 9 /12 /13 / 14
        sharepoint_utilities.set_fields_as_required(question_set_to_toggle);
        sharepoint_utilities.show_fields(question_set_to_toggle);
    }

}

non_assurance_functions.appendix_b_continuance_other_considerations = function(){

}


