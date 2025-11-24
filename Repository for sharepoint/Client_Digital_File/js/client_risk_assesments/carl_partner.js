var carl_partner = {}

carl_partner.run_general_rules = function(){

    // Contained within Client Information > PIE
    var IsCarlPartner = sharepoint_utilities.get_field_values(['IsCarlPartner'])
    
    var countryExecutiveApproval = $("select[data-sp-element-name='sp_country_level_upload-btn']").val()
    // var countryExecutiveApproval = $("input[type='radio'][value='yes']");

    if(IsCarlPartner === "Yes"){
        sharepoint_utilities.show_fields([countryExecutiveApproval])
        sharepoint_utilities.set_fields_as_required([countryExecutiveApproval])     
    } else {
        sharepoint_utilities.show_fields([countryExecutiveApproval]);
        sharepoint_utilities.set_fields_as_not_required([countryExecutiveApproval])
    }

}