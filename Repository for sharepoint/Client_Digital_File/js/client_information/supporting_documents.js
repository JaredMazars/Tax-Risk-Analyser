let supporting_documents = {}


$(document).on("click","i[data-help-category]",function(){

    main.render_help_panel($(this).attr("data-help-category"));

});

$(document).on("click",".supporting-document-upload-fake-icon",function(){

    //create a click event on the fake icon to click the actual file input button element
    $("#upload-supporting-documents").click();    

});

$(document).on("click","ul[data-app-name='Client Acceptance and Continuance'] li[data-link-id='Supporting Documents']",function(){  

    client_risk_assesments.rule_engine();
    supporting_documents.convert_older_named_documents();
    supporting_documents.display_all_supporting_documents();

});


$(document).on("click","#qrm-supporting-documents-table .download-supporting-document",function(){

    site_collection_url = app_configuration.site_context;
    relative_file_path = $(this).attr("data-file-ref");
    file_name = $(this).attr("data-file-leaf-ref");
    sharepoint_utilities.download_file(site_collection_url,relative_file_path,file_name);

});


supporting_documents.convert_older_named_documents = function(){

    let get_field_properties = sharepoint_utilities.get_field_values(["ListOfRequiredDocumentsJSON","AcceptanceOrContinuance"])
	//append to the list
	let current_list_of_documents = get_field_properties.meta_package["ListOfRequiredDocumentsJSON"]

    let converted_list = [];
    if(current_list_of_documents){       
        //2 array string variables []
        if(current_list_of_documents.length > 1){
            document_cube = JSON.parse(current_list_of_documents);
            
            for (let index = 0; index < document_cube.length; index++) {
                const row_item = document_cube[index];

                switch(row_item){
                    case "GS Report":
                        converted_list.push("Greatsoft report")
                    break;

                    case "CEO Approval":
                        converted_list.push("CEO/CRM Approval of a non-CARL Partner")
                    break;

                    case "Background Memorandum":
                        converted_list.push("GIAC Background Memorandum")
                    break;

                    default:
                        converted_list.push(row_item)
                    break;
                }
                             
            }

             sharepoint_utilities.set_field_value("ListOfRequiredDocumentsJSON",JSON.stringify(converted_list));   
        }
    }

}

supporting_documents.display_all_supporting_documents = function(){

    let qrm_reference_id = 0;
    if(main["selected_client_risk_data"]){
        qrm_reference_id = main["selected_client_risk_data"].Id
    }
    supporting_documents.render_supporting_documents(qrm_reference_id)
}

supporting_documents.render_supporting_documents = function(qrm_reference_id){  
   
    let current_status = main["selected_client_risk_data"].Form_x0020_Status 

    var get_all_supporting_documents = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "*,FileRef,FileLeafRef",
        "ReferenceID eq '"+qrm_reference_id+"'",
        app_configuration.supporting_documents_library,
        "Id desc");

    let table_html =
        `           
            <div class="bulk-upload-container"  style='display:inline-block;width:70%;'>              
                <div class="bulk-upload-icon" style='display:inline-block;margin-top: 10px;'>
                    <span class="upload-button-label supporting-document-upload-fake-icon">Upload</span>
                    <i title='View this request' class='menu-icon ms-Icon ms-Icon--Upload supporting-document-upload-fake-icon'></i>
                </div>
                <ul class="bulk-upload-list" style='width:100%;list-style:none;'>                 
                    <li>Once uploaded you can assign the correct document to the required Document type field within the consolidated table.
                    <br/><span style='color:#990909'> *Note <span> - Please create a zip file to upload multiple documents to type.</li>
                </ul>   
            </div> 
            
            <div class="list-of-documents-container">
                <p>
                     <div style='display:inline-block;margin-top: 10px;'>
                        <i style='font-size:39px;' title='View additional information' class='menu-icon ms-Icon ms-Icon--Info' data-help-category='ACHelpDocuments'></i> 
                    </div>
                    <div style='display:inline-block;position: absolute;margin-top: 20px;margin-left: 10px;'>
                        <b>List of required documents before approval can continue:</b>
                    </div>
                </p>
                <p id='list-of-required-documents-to-upload'></p>              
            </div>
        
            <div class='hide'>
                <input type='file' id='upload-supporting-documents' name='upload-supporting-documents'>                    
            </div>        
            <table id='qrm-supporting-documents-table' class="table-dashboard accordian-table table dataTable no-footer" >
                <thead>                   
                    <th>QRM Ref ID</th>
                    <th>File name</th>
                    <th class='document-type'>Document Type</th> 
                    <th>Last Modified</th>                   
                    <th>Actions</th>
                </thead>
                <tbody>            
        `

    $.when(get_all_supporting_documents).done(function(get_all_supporting_documents_data){      

        for (let index = 0; index < get_all_supporting_documents_data.length; index++) {

            let current_row = get_all_supporting_documents_data[index]

           let action_buttons = 
           `
                <i title='download this file' 
                        class='menu-icon ms-Icon ms-Icon--CloudDownload download-supporting-document table-action-button'                    
                        data-itemid='${current_row["Id"]}'
                        data-file-leaf-ref='${current_row["FileLeafRef"]}'
                        data-file-ref='${current_row["FileRef"]}'
                    >
                </i>
                <i title='remove this file' 
                        class='menu-icon ms-Icon ms-Icon--Delete remove-supporting-document table-action-button-delete'                    
                        data-itemid='${current_row["Id"]}'
                    >
                </i>
                       
           `
        
           if(current_status == 'Resigned'){
                action_buttons = "";                
           }

            table_html +=          
                `
                    <tr data-document-id='${current_row.Id}'>                     
                        <td>${current_row.ReferenceID}</td>
                        <td>${sharepoint_utilities.check_for_null(current_row.Title,"")}</td>                  
                        <td>${create_dropdown_file_type(current_row.DocumentType)}</td>     
                        <td>${moment(current_row.Modified).format(app_configuration.display_date_format)}</td>                   
                        <td>${action_buttons}</td>
                    </tr>
                `      
        }


        table_html +=
        `   
                </tbody>
            </table
        `

        $("div[app-name='Client Acceptance and Continuance'] div[sp-field-name='supporting-documents-placeholder'] .field-component").html(table_html);

        $.when(supporting_documents.validate_all_documents())
        .done(function(validation_outcome){
            $("#list-of-required-documents-to-upload").html(validation_outcome.validation_message)
        });

        let list_of_statuses = ["Not Started","In Progress","Waiting on Approval","Changes Requested"]

        //allow the uploads of documents if the form is in the above status
        if(list_of_statuses.indexOf(current_status) == -1){
            $(".bulk-upload-container").addClass("hide"); 
            $(".supporting-documents-change").prop("disabled",true);
        }     


        $('#qrm-supporting-documents-table').DataTable({
            "pageLength": 10,
            "bLengthChange": false,
            "lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "All"] ],
            "search":false,
            "paging":false
        });

    });

    function create_dropdown_file_type(current_value){

        let list_of_options = app_configuration.list_of_document_types;
        let drop_down_select_html = 
        `
            <select title='supporting-documents-document-type' class='supporting-documents-change'>
                <option>Please Select...</option>
        `

        let is_found = false
        //otherwise select the options
        for (let index = 0; index < list_of_options.length; index++) {
            const option = list_of_options[index];       
            
            selected_option = "";
            if(current_value == option){
                selected_option = "selected='selected'";
                is_found = true;
            }

            drop_down_select_html += 
            `
                <option ${selected_option} value='${option}'>${option}</option>
            `
        }    

        if(is_found == false && current_value != ""){
             drop_down_select_html += 
            `
                <option selected='selected' value='${current_value}'>${current_value}</option>
            `
        }

        drop_down_select_html += "</select>";
        
        
        return drop_down_select_html;
    }     

}

$(document).on("click","#qrm-supporting-documents-table .remove-supporting-document",function(){
	
	let get_document_id = parseInt($(this).attr("data-itemid"));
	supporting_documents.remove_document(get_document_id)
	
});

supporting_documents.remove_document = function(document_id){

    //if the form is not under review, then you can delete the document
    if(document_id){

        var remove_document_confirmation = sharepoint_utilities.remove_item(
            app_configuration.supporting_documents_library,
            app_configuration.site_context,document_id
        )
      
        $.when(remove_document_confirmation).done(function(){

            sharepoint_utilities.render_notification("Document removal","Your document was removed successfully","Info")
            $("ul[data-app-name='Client Acceptance and Continuance'] li[data-link-id='Supporting Documents']").click();
        });
    }else{
        sharepoint_utilities.render_notification("Document removal Error","Your document not removed successfully","Warning")    
    }

}

supporting_documents.append_to_current_document_required = function(required_document, action_type){
 
	//current current list of documents
	let get_field_properties = sharepoint_utilities.get_field_values(["ListOfRequiredDocumentsJSON","AcceptanceOrContinuance"])
	//append to the list
	let current_list_of_documents = get_field_properties.meta_package["ListOfRequiredDocumentsJSON"]

    let document_cube = [];
    //save the new item as json string to the list
    if(current_list_of_documents){       
        //2 array string variables []
        if(current_list_of_documents.length > 1){
            document_cube = JSON.parse(current_list_of_documents);
            switch(action_type){
                case "remove": 
                    let index = document_cube.indexOf(required_document);
                    if(index != -1){
                        document_cube.splice(index, 1)
                    }
                    
                break;

                default:  
                    if(document_cube.indexOf(required_document) == -1){
                        document_cube.push(required_document);
                    }
                break;
            }
        }else{
            document_cube.push(required_document);
        }
    }else{
        document_cube.push(required_document);
    }

    sharepoint_utilities.set_field_value("ListOfRequiredDocumentsJSON",JSON.stringify(document_cube));   
    warning_controller.display_warnings();  
    
}

supporting_documents.validate_all_documents = function(){

	var Promise = $.Deferred();

	var get_all_supporting_documents = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "*",
        "ReferenceID eq '"+main["selected_client_risk_data"].Id+"'",
        app_configuration.supporting_documents_library,
        "Id desc");

	$.when(get_all_supporting_documents).done(function(current_uploaded_documents_results){
		
		//get field values
		//current current list of documents
		let get_field_properties = sharepoint_utilities.get_field_values(["ListOfRequiredDocumentsJSON"])
		let current_list_of_documents = get_field_properties.meta_package["ListOfRequiredDocumentsJSON"]   

		let current_required_documents_cube = [];

		let validation_outcome = {
			"is_valid":false,
			"outstanding_documents":[],
			"validation_message":"",
            "found_document":[]
		}

        let number_of_found_documents = 0;
    
        main["current_uploaded_documents"] = current_uploaded_documents_results

		
		//check if there is anything saved in this field
        if(current_list_of_documents){
            if(current_list_of_documents.length > 0){
                //compare and display results
                current_required_documents_cube = JSON.parse(current_list_of_documents);

                for (let index = 0; index < current_required_documents_cube.length; index++) {
                    const required_document_item = current_required_documents_cube[index];				

                    let is_found = false;				
                    for (let uploads_index = 0; uploads_index < current_uploaded_documents_results.length; uploads_index++) {
                        const uploaded_document_item = current_uploaded_documents_results[uploads_index];
                        
                        if(uploaded_document_item.DocumentType){
                            if(required_document_item.toLowerCase() == uploaded_document_item.DocumentType.toLowerCase()){
                                //this indicates that the required document has been uploaded
                                validation_outcome.found_document.push(required_document_item);
                                is_found = true;
                                number_of_found_documents += 1;                          
                            }
                        }
                    }

                    if(!is_found){                        
                       
                        validation_outcome.outstanding_documents.push(required_document_item);
                        validation_outcome.validation_message += "- " + required_document_item + " <br/>"
                    }
                }   
                

                
                if(number_of_found_documents ==  current_required_documents_cube.length){
                    validation_outcome.is_valid = true;
                }

            }
        }else{
            validation_outcome.is_valid = true;
            validation_outcome.validation_message += "None"
        }      
      
        $("#list-of-required-documents-to-upload").html(validation_outcome.validation_message);     
        //returns the validation_outcome obj with many properties list above
		Promise.resolve(validation_outcome);
	});

	return Promise.promise()
	
}

// // ======= resigning from the engagement =======
supporting_documents.resignation_validation = function(submission_data){

    let selectedDocuments = main["current_uploaded_documents"];   
    
    for (let index = 0; index < selectedDocuments.length; index++) {
        const current_document = selectedDocuments[index];

        if(current_document.DocumentType == 'Resignation Letter'){
            
            client_risk_approvals.create_notification(_spPageContextInfo.userId,"Workflow handeled","Resigned",submission_data.item_id);	
            sharepoint_utilities.render_notification("Resign from Engagement","Please wait while we resigned your client from the engagement","Info");

            sharepoint_utilities.set_field_value("Form_x0020_Status", "Resigned");
           
            $("input[data-sp-element-name='btn-resign-from-engagement']").addClass("nav-item-disabled");

            client_risk_assesments.identify_sections_to_update($("li[data-link-id='Supporting Documents']"),true);
            client_risk_assesments.identify_sections_to_update($("li[data-link-id='General']"),true);

            $("li[title='Client Acceptance and Continuance']").click();
        
        }
        
    }
}

supporting_documents.quick_action_resignation = function(submission_data){


    let custom_options = {
        "Yes":continue_to_resign_from_enagagement,
        "No":function(){}
    }

    sharepoint_utilities.render_confirmation_box("Resign from the current engagement","Are you sure you want to resign from this engagement?",custom_options,"50%");

    function continue_to_resign_from_enagagement(){   
        let meta_package = {
            "Form_x0020_Status":"Resigned"
        }
        
        let update_item = sharepoint_utilities.update_item 
            (
                app_configuration.ac_submission,
                app_configuration.site_context,
                meta_package,
                parseInt(submission_data.item_id)
            )
        $.when(update_item)
            .done(function(){
            client_risk_approvals.create_notification(_spPageContextInfo.userId,"Workflow handeled","Resigned",submission_data.item_id);	
            client_risk_assesments.render_selected_client_acceptance_continuance($("select[title='Search for your assesments via Client Name']").val())
        });
     }



    
    
}

