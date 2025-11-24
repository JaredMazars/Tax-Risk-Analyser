// sp_field_name = CryptoEngagment
var pie_form ={}

$(document).on("change", "input[data-sp-element-name='OtherPieEntities']", function(){

    client_risk_assesments.other_pie_entities_comments_toggle();
    client_risk_assesments.giac_form_validation(); 
    client_risk_assesments.carl_partner_validation();
    
});

$(document).on("change", "input[data-sp-element-name='IsListedClient']", function(){

    client_risk_assesments.giac_form_validation(); 
    client_risk_assesments.carl_partner_validation();
    
});

$(document).on("change", "input[data-sp-element-name='IsTransnational'],input[data-sp-element-name='SPACEngagment'],input[data-sp-element-name='IPOEngagment']", function(){
    //for all pie rules
    //for all pie rules
    client_risk_assesments.giac_form_validation(); 

});

$(document).on("change","input[data-sp-element-name='HasRussianEntities']",function(){

    let current_value = $(this).val();
    client_risk_assesments.determine_risk_status();
    if(current_value == "Yes"){
        sharepoint_utilities.render_notification
            (
                "Client Identified as Risky",
                "Your submission has now been identified as risky",
                "Warning"
            )
    }
    //for all pie rules
    client_risk_assesments.giac_form_validation();

})

$(document).on("change","input[data-sp-element-name='HasRiskAppetite']",function(){

    let current_value = $(this).val();
    client_risk_assesments.determine_risk_status(); 
    if(current_value == "Yes"){
        sharepoint_utilities.render_notification
            (
                "Client Identified as Risky",
                "Your submission has now been identified as risky",
                "Warning"
            )
    } 
    //for all pie rules
    client_risk_assesments.giac_form_validation();
})

$(document).on("change","input[data-sp-element-name='CryptoEngagment']",function(){

    pie_form.determine_is_crypto_currency();   
    client_risk_assesments.giac_form_validation()
})

pie_form.determine_is_crypto_currency = function(){
  
    var cryptoEngagement = $("select[data-sp-element-name='CryptoEngagment']").val()

    warning_controller.remove_warning("ISRE Standard", "The Engagement has been flagged as Risky", "Warning")
    // if the YES radio button is selected
    if(cryptoEngagement == "Yes"){
        // the engagmenet should be triggered as a "Risky Engagement"
        warning_controller.add_new_warning("ISRE Standard", "The Engagement has been flagged as Risky", "Warning")
       // sharepoint_utilities.render_notification("ISRE Standard", "The Engagement has been flagged as Risky", "Warning");
    }

}

