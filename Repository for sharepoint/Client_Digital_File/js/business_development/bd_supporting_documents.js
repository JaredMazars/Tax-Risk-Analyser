let bd_supporting_documents = {}

$(document).on("change","div[app-name='Business Development'] .form-row input[type='file']",function(event){
    
    var file_content = event.target.files; // FileList object	console.log(FileElement);
    let file_document_type = bd_supporting_documents.get_document_type($(this).attr("data-sp-element-name"))
    bd_supporting_documents.upload_file(file_content, file_document_type);

});


$(document).on("click",".table-action-button-delete",function(){

	//this must be a generic click event with the context of bd
	let get_document_id = parseInt($(this).attr("data-itemid"));
	bd_supporting_documents.remove_document(get_document_id)	
});


$(document).on("click",".table-action-button-view",function(){	
    //this must be a generic click event context of bd
	bd_supporting_documents.view_document($(this))	
});


bd_supporting_documents.get_document_type = function(sp_field_name){

    let document_type = ""
    switch(sp_field_name){

        case "intitation-internally-captured-details-upload":
            document_type = "internally captured details";
        break;

        case "evaluation-risk-factors-upload":

            document_type = "risk factors"
        break;

        case "achieve-strategy-upload":

            document_type = "client opportunities"
        break;

        case "reputational-risk-upload":

            document_type = "reputational risk"
        break;

        case "skills-and-resources-upload":

            document_type ="skills and available resources"
        break;

        case "profit-margins-upload":

            document_type = "profitability"
        break;

        case "winning-probability-upload":

            document_type = "tender probability"
        break;

        case "we-check-upload":

            document_type = "independence issues"
        break;

        case "pong-upload":

            document_type = "pong issues"
        break;

        case "hubspot-upload":

            document_type = "hub spot issues"
        break;

        case "qrm-ac-upload":

            documents_type = "qrm acceptance";
        break;
        case "dpa-nda-upload":

            document_type = "dpa and nda"
        break;
    }


    return document_type
}

bd_supporting_documents.upload_file = function(file_content, document_type) {   
  
    let file_meta = {
        "Title":file_content[0].name,
        "DocumentType":document_type,
        "FormReferenceId":app_configuration.form_reference_id.toString()
    }

   var upload_file = sharepoint_utilities.upload_file(
        file_content,
        file_meta,
        app_configuration.site_context,
        app_configuration.bd_supporting_documents_library
    )

    $.when(upload_file).done(function(){
        //render all files that share the same refNUmber
        bd_supporting_documents.display_all_documents(app_configuration.form_reference_id.toString());              
    });
}

bd_supporting_documents.view_document = function(selected_document){   

    sharepoint_utilities.download_file(
        app_configuration.site_context,                
        selected_document.attr("data-relative-url"),
        selected_document.attr("data-file-name")
    );
}

bd_supporting_documents.remove_document = function(document_id){

    var remove_document_confirmation = sharepoint_utilities.remove_item(
        app_configuration.bd_supporting_documents_library,
        app_configuration.site_context,
        document_id
    )      
    $.when(remove_document_confirmation).done(function(document_type){
        
        bd_supporting_documents.display_all_documents(app_configuration.form_reference_id.toString()); 
        sharepoint_utilities.render_notification("Document removal","Your document was removed successfully","Info");
    });  
}

bd_supporting_documents.display_all_documents = function(form_reference_id){

    //gets all documents assigned to the associated form reference
    // identifies the specific sections that the documents are apart of and creates the associates tables

    var get_all_supporting_documents = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "*,FileLeafRef,FileRef",
        "FormReferenceId eq '"+form_reference_id+"'",
        app_configuration.bd_supporting_documents_library,
        "Id desc");

    

    $.when(get_all_supporting_documents).done(function(get_all_supporting_documents_data){    

        app_configuration["bd_supporting_documents_data"] = get_all_supporting_documents_data

        let list_of_document_sections =
        [   
            "internally captured details","risk factors","client opportunities","reputational risk","skills and available resources","profitability","tender probability",
            "independence issues","pong issues","hub spot issues","qrm acceptance","dpa and nda"
        ]

        //for each of the identified sections
        for (let index = 0; index < list_of_document_sections.length; index++) {
            const section_name = list_of_document_sections[index];

            let table_html = `
                <h3>Supporting Documents Uploaded</h3>
                <table id='${section_name.split(" ").join("-")}-supporting-documents-table' class='bd_supporting_documents_table table dataTable' style='width:100%;'>
                    <thead>
                        <tr>
                            <th class='table-header'>Ref Id</th>
                            <th class='table-header'>Type</th>    
                            <th class='table-header'>File Name</th>                            
                            <th class='table-header'>Last Modified</th>
                            <th class='table-header'>Actions</th>
                        </tr>
                    </thead>
                <tbody>
            `   
            for (let index = 0; index < get_all_supporting_documents_data.length; index++) {

                let current_row = get_all_supporting_documents_data[index]
                //only table the specific documents and action buttons per section name
                if(current_row.DocumentType == section_name){

                    let action_buttons = 
                    `
                        <i title='view this file' 
                                class='menu-icon ms-Icon ms-Icon--View remove-supporting-document table-action-button-view'                    
                                data-itemid='${current_row["Id"]}'
                                data-relative-url='${current_row["FileRef"]}'
                                data-file-name='${current_row["FileLeafRef"]}'
                            >
                        </i>
                        <i title='remove this file' 
                                class='menu-icon ms-Icon ms-Icon--Delete remove-supporting-document table-action-button-delete'                    
                                data-itemid='${current_row["Id"]}'
                            >
                        </i>
                                
                    `    
                    table_html +=          
                        `
                            <tr data-document-id='${current_row.Id}'>                     
                                <td>${current_row.Id}</td>
                                <td>${current_row.DocumentType}</td>
                                <td>${sharepoint_utilities.check_for_null(current_row.Title,"")}</td>  
                                <td>${moment(current_row.Modified).format(app_configuration.display_date_format)}</td>                   
                                <td>${action_buttons}</td>
                            </tr>
                        `    
                }  
            }    
    
            table_html +=
            `   
                    </tbody>
                </table
            `

            $("div[sp-field-name='"+section_name.split(" ").join("-")+"-supporting-documents-table']").html(table_html);
                
        }
        
    })

}