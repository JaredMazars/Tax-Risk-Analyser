let template_controller = {}

$(document).on("change","select[data-sp-element-name='template-selector']",function(){

    let selected_template_id = parseInt($(this).val());
    //handles the creation of a new acceptance form
    let record_properties = {
        "item_id":selected_template_id,
        "action_type":"Acceptance",
        "data_source_type":"Current",
        "form_type":"Acceptance",
        "form_status":"new"
    }     
    client_risk_assesments.render_acceptance_form_html(record_properties); 

});

