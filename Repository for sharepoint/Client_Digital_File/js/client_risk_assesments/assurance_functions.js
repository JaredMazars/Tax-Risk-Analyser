var assurance_functions = {};

$(document).on("change","input[data-sp-element-name='PreviousFirmAppointed']",function(){     
    assurance_functions.determine_previous_auditor_questions();
});

$(document).on("change","input[data-sp-element-name *='IsTransnational']",function(){ 
    assurance_functions.determine_is_transnational();
});

$(document).on("change","input[data-sp-element-name *='IsS90Calculator']",function(){  
    assurance_functions.general_rules()
});

$(document).on("change","div[form-navigation-target='Part A - Risk Considered as Major'] input[data-sp-element-name *='PartA'], div[form-navigation-target='Part B - Risk Considered as Major'] input[data-sp-element-name *='PartB']",function(){

    client_risk_assesments.determine_risk_status();   
});

$(document).on("change","input[data-sp-element-name *='s90Consideration']",function(){
    
    assurance_functions.determine_s90_considerations();
    client_risk_assesments.identify_sections_to_update($("li[data-link-id='General']"),true);   
    client_risk_assesments.identify_sections_to_update($("li[data-link-id='S90 Considerations']"),true); 
})

$(document).on("change","input[data-sp-element-name='IsConcurringReviewPartner']",function(){

    assurance_functions.concurring_review_partner_document();
});

$(document).on("change","input[data-sp-element-name='Q1ClientCalc']",function(){
    assurance_functions.general_rules()
});
$(document).on("change","input[data-sp-element-name='Q2ClientCalc']",function(){
    assurance_functions.general_rules()
});
$(document).on("change","input[data-sp-element-name='Q3ClientCalc']",function(){
    assurance_functions.general_rules()
});

$(document).on("change","select[data-sp-element-name='FinancialReportingFramework']",function(){
    assurance_functions.general_rules()
});


$(document).on("change","input[data-sp-element-name='ApplicableStdModified']",function(){
    assurance_functions.general_rules()
})

$(document).on("change", "input[data-sp-element-name='IsListedClient']", function(){
    assurance_functions.general_rules()
});
$(document).on("change", "input[data-sp-element-name='IsSECRegistrant']", function(){
    assurance_functions.general_rules()
});

$(document).on("change","input[data-sp-element-name='eqrCalculatorType']",function(){
    assurance_functions.determine_eqr_type_required()
})
$(document).on("change","input[data-sp-element-name='isEqrOverride']",function(){
    assurance_functions.determine_eqr_type_required()
})

$(document).on("change","input[data-sp-element-name *='EQRAppointment']",function(){ 
    assurance_functions.determine_eqr_type_required()
})
$(document).on("change","input[data-sp-element-name='EQRAppointment8']",function(){ 
    assurance_functions.determine_eqr_type_required()
})
$(document).on("change","input[data-sp-element-name='EQRNotStated']",function(){ 
    assurance_functions.determine_eqr_type_required()
})

$(document).on("change","input[data-sp-element-name *='internalEqrPartner']",function(){ 
    assurance_functions.determine_eqr_type_required()
})

$(document).on("change","input[data-sp-element-name='Q17Independence']",function(){

    var q17_independence = $("input[data-sp-element-name='Q17Independence']").val()

    if(q17_independence == 'Yes'){
        sharepoint_utilities.show_fields(["C18Independence"]);
        sharepoint_utilities.set_fields_as_required(["C18Independence"]);
    } else {
        sharepoint_utilities.hide_fields(["C18Independence"]);
        sharepoint_utilities.set_fields_as_not_required(["C18Independence"]);
    }
    
});

$(document).on("change","div[form-navigation-target='Team Information'] select[data-sp-element-name='ClientIndustry']",function(){

    assurance_functions.run_client_industry_rule();
   
})

$(document).on("change","div[form-navigation-target='General Information About the Engagement'] input[data-sp-element-name='nonAssuranceServicePerformed']",function(){

    assurance_functions.risk_outcome_calculator();
})



assurance_functions.general_rules = function(){  
  

    assurance_functions.determine_significant_variation();
    assurance_functions.assurance_vs_non_assurance_calculator();
    assurance_functions.risk_outcome_calculator()
    assurance_functions.financial_reporting();
    assurance_functions.validate_disclaimer_of_opinion();
   
    assurance_functions.display_s90_considerations();    
    assurance_functions.determine_eqr_type_required();

    assurance_functions.determine_is_transnational();
    assurance_functions.determine_s90_considerations();

    assurance_functions.determine_previous_auditor_questions();
    assurance_functions.run_client_industry_rule();
    
}


assurance_functions.run_client_industry_rule = function(){

    let field_properties = sharepoint_utilities.get_field_values(["ClientIndustry","ClientAcceptanceType","IsListedClient","IsSECRegistrant","OtherPieEntities"]);
    let client_industry_value = field_properties.meta_package["ClientIndustry"]
    let client_acceptance_type = field_properties.meta_package["ClientAcceptanceType"];
   

     //if the industry selected is crpto then set is crypto to yes   
    if(client_industry_value == "Crypto"){
        sharepoint_utilities.set_field_value("CryptoEngagment","Yes");        
    }else{
        sharepoint_utilities.set_field_value("CryptoEngagment","No");
    }
    
    if(client_acceptance_type == "Assurance"){

        $("li[data-link-id='EQR Calculator']").addClass("nav-item-disabled");
        if(client_industry_value){
            let eqr_required = false;

            let list_of_industries_to_validate = 
            ["Financial and insurance activities", "Medical schemes", "Retirement pension & provident funds"]

            for (let index = 0; index < list_of_industries_to_validate.length; index++) {
                const validation_fields = list_of_industries_to_validate[index];
                
                if(client_industry_value == validation_fields){
                    eqr_required = true;
                }
            }
                  
            if(field_properties.meta_package["IsListedClient"] == "Yes" || field_properties.meta_package["IsSECRegistrant"] == "Yes" || field_properties.meta_package["OtherPieEntities"] == "Yes"){        
                eqr_required = true;       
            }      

            if(eqr_required){
                $("li[data-link-id='EQR Calculator']").removeClass("nav-item-disabled");   
            }
            
        }         
        assurance_functions.eqr_partner_rules();
    }       
    
    client_risk_assesments.giac_form_validation(); 
   
}

assurance_functions.determine_previous_auditor_questions = function(){

    let field_properties = sharepoint_utilities.get_field_values(["PreviousFirmAppointed","ClientAcceptanceType","AcceptanceOrContinuance"]).meta_package; 
     
    let field_set = ["PreviousAuditSignOff","AuditTakeover"]
    sharepoint_utilities.hide_fields(field_set);
    sharepoint_utilities.set_fields_as_not_required(field_set);

    if(field_properties.ClientAcceptanceType == "Assurance" && field_properties.AcceptanceOrContinuance == "Acceptance"){

        if(field_properties.PreviousFirmAppointed == "Yes"){
            sharepoint_utilities.show_fields(field_set);
            sharepoint_utilities.set_fields_as_required(field_set)
        }
    }    
}


assurance_functions.assurance_vs_non_assurance_calculator = function(){

    //get the value of the non assurance fees
    //get the value of the assurance fees
    let field_properties = sharepoint_utilities.get_field_values(["Q1ClientCalc","Q2ClientCalc","Q3ClientCalc"]);

    //validate the fees section
    if(field_properties.IsValid){

        let result = parseInt(field_properties.meta_package["Q2ClientCalc"])/parseInt(field_properties.meta_package["Q3ClientCalc"])  
        if(parseInt(field_properties.meta_package["Q3ClientCalc"]) <= 0){
            result = 0
        } 

        let percentage = result * 100;
        sharepoint_utilities.set_field_value("Q4ClientCalc",  parseInt(percentage));
        assurance_functions.risk_outcome_calculator();
        //update the PIE section to save the outcome incase the user closes the screen
        client_risk_assesments.update_form_values("PIE"); 
    }
 
}

assurance_functions.risk_outcome_calculator = function(){
    
    let field_properties = sharepoint_utilities.get_field_values(["Q1ClientCalc","Q4ClientCalc", "feeConsiderations","nonAssuranceServicePerformed"]);

    let pie_entity_value = field_properties.meta_package["Q1ClientCalc"]
    let risk_outcome_value = field_properties.meta_package["Q4ClientCalc"]

    let risk_outcome = "Not Applicable";
    if(risk_outcome_value != 0){
        switch (pie_entity_value) {
            case "Yes":
                switch (true) {
                    case risk_outcome_value < 20:
                            risk_outcome =  "Generally considered low risk"
                        break;
                    case risk_outcome_value > 20 && risk_outcome_value < 40:               
                            risk_outcome =  "Generally considered increased risk"
                        break;
                    case risk_outcome_value > 40:               
                            risk_outcome =  "Generally considered high risk"
                        break;
                    default:
                        break;
                }
                break;

            case "No":
                switch (true) {
                    case risk_outcome_value < 30:                   
                            risk_outcome =  "Generally considered low risk"
                        break;
                    case risk_outcome_value > 30 && risk_outcome_value < 60:                  
                            risk_outcome =  "Generally considered increased risk"
                        break;
                    case risk_outcome_value > 60:                
                            risk_outcome =  "Generally considered high risk"
                        break;
                    default:
                        break;
                }
                break;
            default:


                break;
        }
    }

    if(field_properties.meta_package["nonAssuranceServicePerformed"] == "No"){
        risk_outcome = "Not Applicable"
    }

    sharepoint_utilities.set_field_value("feeConsiderations", risk_outcome);
    
}

assurance_functions.eqr_partner_rules = function(){


    let field_properties = sharepoint_utilities.get_field_values(["eqrCalculatorType", "internalEqrPartner"]);
    let field_values = field_properties.meta_package

    let eqr_calculator_type = field_values["eqrCalculatorType"];
    let eqr_partner_value = field_values["internalEqrPartner"];
    
    if(eqr_calculator_type == 'Internal'){
        sharepoint_utilities.show_fields(["internalEqrPartner",])
        sharepoint_utilities.set_fields_as_required(["internalEqrPartner",])

        // check if the value entered is "TBC by CRM Allocation"
        if(eqr_partner_value == "TBC by CRM Allocation"){         
            supporting_documents.append_to_current_document_required("CRM approval of EQR");
        } else{
            supporting_documents.append_to_current_document_required("CRM approval of EQR", "remove");
        }
    } else {
        sharepoint_utilities.hide_fields(["internalEqrPartner"])
        sharepoint_utilities.set_fields_as_not_required(["internalEqrPartner"])
    }
}

assurance_functions.determine_s90_considerations = function(){

    let list_of_fields = ["Q1s90Consideration", "Q2s90Consideration", "Q3s90Consideration", "Q4s90Consideration", "Q5s90Consideration"]
    let get_field_properties = sharepoint_utilities.get_field_values(list_of_fields)
    let field_values = get_field_properties.meta_package
    let must_cancel = false;

    for (let index = 0; index < list_of_fields.length; index++) {
        const field_name = list_of_fields[index];

        if(field_values[field_name] == "Yes"){
            must_cancel = true;
        }
    }    


    let get_field_status = sharepoint_utilities.get_field_values(["Form_x0020_Status"]).meta_package;
    let allowed_form_status = ["Changes Requested","Not Started","In Progress","s90 Cancelled"]
    if(allowed_form_status.indexOf(get_field_status) >=0){

        if(must_cancel) {        
            sharepoint_utilities.set_field_value("Form_x0020_Status", "s90 Cancelled");
            sharepoint_utilities.render_notification("Assurance services may NOT be provided to the client.","A cooling off period of "+
                "5 years from such prohibited services is required before assurance services can be provided. "+
                "You cannot continue with this Acceptance or continuance","Warning");               
        }else{

            if(get_field_status != "Changes Requested"){
                sharepoint_utilities.set_field_value("Form_x0020_Status", "In Progress");
            }
        }
    }
}


assurance_functions.concurring_review_partner_document = function(){

    let concurringReviewPartnerYes = $("input[data-sp-element-name='IsConcurringReviewPartner']").val();
    if(concurringReviewPartnerYes == 'Yes'){
        sharepoint_utilities.render_notification("Document Download Required","Please complete the downloaded document and upload it once completed","Warning")
        supporting_documents.append_to_current_document_required("CRM Approval of CRP");
    } else {
        supporting_documents.append_to_current_document_required("CRM Approval of CRP", "remove");
    }
}

assurance_functions.display_s90_considerations = function(){

    let field_properties = sharepoint_utilities.get_field_values(
        ["Q1IsS90Calculator","Q2IsS90Calculator","Q3IsS90Calculator","Q4IsS90Calculator","Q5IsS90Calculator","Q6IsS90Calculator"]
    );
   
    let calculator_outcome = "No";

    if(field_properties.IsValid){
        for (let index = 0; index < field_properties.array_of_values.length; index++) {
            const current_value = field_properties.array_of_values[index];        
            if(current_value == "Yes"){
                calculator_outcome = "Yes";
            }
        }        
        if(calculator_outcome == "Yes"){
            $("li[data-link-id='S90 Considerations']").removeClass("nav-item-disabled");  
        }else {
            $("li[data-link-id='S90 Considerations']").addClass("nav-item-disabled");
        }    

        sharepoint_utilities.set_field_value("s90Calculator",calculator_outcome); 
    }
}


assurance_functions.financial_reporting = function(){

    var FinancialReportingFramework = $("select[data-sp-element-name='FinancialReportingFramework']").val()

    if(FinancialReportingFramework == "Other" ){
        sharepoint_utilities.show_fields(["FinancialReportingFrameworkOther"])
        sharepoint_utilities.set_fields_as_required(["FinancialReportingFrameworkOther"])
    } else {
        sharepoint_utilities.hide_fields(["FinancialReportingFrameworkOther"])
        sharepoint_utilities.set_fields_as_not_required(["FinancialReportingFrameworkOther"])      

    }
}

assurance_functions.validate_other_selected = function(){
    var ApplicableStandard = $("select[data-sp-element-name='ApplicableStandard']").val() 

    if(ApplicableStandard){
        if(ApplicableStandard.indexOf("Other") >=0){
            sharepoint_utilities.show_fields(["ApplicableStandardOther"])
            sharepoint_utilities.set_fields_as_required(["ApplicableStandardOther"])
        }
    }
}

assurance_functions.validate_isa_705_rule = function(){

    var validate_isa_705 = $("select[data-sp-element-name='ApplicableStandard']").val()

    if(validate_isa_705){
        if(validate_isa_705.indexOf("ISA 705") >= 0){
            sharepoint_utilities.show_fields(["ApplicableStdModified"])
            sharepoint_utilities.set_fields_as_required(["ApplicableStdModified"])
        }
    }

}

assurance_functions.validate_disclaimer_of_opinion = function(){
 var disclaimer_of_opinion = $("input[data-sp-element-name='ApplicableStdModified']").val()

 if(disclaimer_of_opinion == 'Disclaimer of Opinion'){
    sharepoint_utilities.render_notification("ISA 705","Your engagement cannot be accepted","Warning")
 }
}



assurance_functions.determine_is_transnational = function(){

    sharepoint_utilities.set_field_value("IsTransnational","No");

    $("div[form-navigation-target='Transnational Calculator'] input[data-sp-element-name *='IsTransnational']").each(function(){

        let current_value = $(this).val();
        //skip the first question
        if($(this).attr("data-sp-element-name").indexOf("Q") >= 0){
            if(current_value == "Yes"){
                sharepoint_utilities.set_field_value("IsTransnational","Yes")
            }
        }
    });   
}


assurance_functions.determine_eqr_type_required = function(){

    let field_properties = sharepoint_utilities.get_field_values(["EQRAppointment1", "EQRAppointment2", "EQRAppointment3", "EQRAppointment4", "EQRAppointment5", "EQRAppointment6", "EQRAppointment7", "EQRAppointment8", "EQRNotStated"]);
    let field_values = field_properties.meta_package

    sharepoint_utilities.hide_fields(["isEqrOverride", "eqrCalculatorType", "internalEqrPartner"])
    sharepoint_utilities.set_fields_as_not_required(["isEqrOverride", "eqrCalculatorType", "internalEqrPartner"])

    //check if any of the fields have been selected as yes
    let eqr_approval_required = false;
    let voluntary_eqr_check = false;

    for (let index = 0; index < field_properties.array_of_values.length; index++) {
        const selected_value = field_properties.array_of_values[index];
        
        //if any questions answered was selected as Yes
        if(selected_value == "Yes"){
            eqr_approval_required = true;
        }

        //if any of the questsions had one answers as yes except question 8
        if(selected_value == "Yes" && index != 7){
            voluntary_eqr_check = true
        }
    }

    if(eqr_approval_required){
        sharepoint_utilities.show_fields(["isEqrOverride", "eqrCalculatorType",])
        sharepoint_utilities.set_fields_as_required(["isEqrOverride","eqrCalculatorType",])            
        sharepoint_utilities.set_field_value("eqrIsRequiredStatus", "EQR Approver is required");

        assurance_functions.reason_for_eqr_override();
        assurance_functions.eqr_partner_rules();
    }else{
        sharepoint_utilities.set_field_value("eqrIsRequiredStatus", "EQR Approval is not required")
        sharepoint_utilities.hide_fields(["reasonForEQROverride"])
        sharepoint_utilities.set_fields_as_not_required(["reasonForEQROverride"]);

        //if approval is not required  check if they would like a volunatary check
        
    }         

    //if there was a question answer Yes
    if(voluntary_eqr_check){
        sharepoint_utilities.hide_fields(["EQRAppointment8"])
        sharepoint_utilities.set_fields_as_not_required(["EQRAppointment8"])
    }else{
        sharepoint_utilities.show_fields(["EQRAppointment8"])
        sharepoint_utilities.set_fields_as_required(["EQRAppointment8"])
    } 
    
    
}

assurance_functions.reason_for_eqr_override = function(){
    
    let field_properties = sharepoint_utilities.get_field_values(["isEqrOverride"]);
    let field_values = field_properties.meta_package

    let eqr_override = field_values["isEqrOverride"]

    if(eqr_override == "Yes")
    {
        sharepoint_utilities.show_fields(["reasonForEQROverride",])
        sharepoint_utilities.set_fields_as_required(["reasonForEQROverride",])
    } else {
        sharepoint_utilities.hide_fields(["reasonForEQROverride"])
        sharepoint_utilities.set_fields_as_not_required(["reasonForEQROverride"])
    }
}

assurance_functions.determine_spac_agreement = function(){
    
    // only display this field within the Assurance Condition
    var spac_agreement = $("select[data-sp-element-name='SPACEngagment']").val();
}

$(document).on("change","input[data-sp-element-name='significantVariation']",function(){
    //assurance_functions.determine_is_transnational();   
    assurance_functions.determine_significant_variation();
})

$(document).on("change","div[form-navigation-target='Key Figures - recent financial year'] input[data-sp-element-name='significantVariation']",function(){

    assurance_functions.determine_significant_variation();
})

assurance_functions.determine_significant_variation = function(){

    var significant_variation_question = $("input[data-sp-element-name='significantVariation']").val();

    // if significant variation is Yes, 
    if(significant_variation_question == "Yes"){
        //Display a comment box with the sp_element-name = SignificantVariationComments
        sharepoint_utilities.show_fields(["SignificantVariationComments"])
        sharepoint_utilities.set_fields_as_required(["SignificantVariationComments"])
    }else{
        // otherwise - hide this field
        sharepoint_utilities.hide_fields(["SignificantVariationComments"])
        sharepoint_utilities.set_fields_as_not_required(["SignificantVariationComments"])
    }

}


