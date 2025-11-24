let bd_independance_rules = {}

bd_independance_rules.validate_uploaded_documents = function(){

    let required_document_types = ["dpa and nda","acceptance | continuance"];
    let validation_count = 0;
    let is_valid = false;

    for (let index = 0; index < app_configuration["bd_supporting_documents_data"].length; index++) {
        const documents_row = app_configuration["bd_supporting_documents_data"][index];

        if (required_document_types.indexOf(documents_row.DocumentType) >= 0) {
            validation_count += 1;
        }        
    }

    if(required_document_types.length == validation_count){
        is_valid = true;
    }
    return {
        "is_valid":is_valid
    }

}