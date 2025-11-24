let upload_documents = {}

$(document).on("change","#upload-supporting-documents",function(event){	      

    var ArrayOfFiles = event.target.files;
	upload_documents.UploadSetOfFiles(ArrayOfFiles); 	

});


$(document).on("change","#qrm-supporting-documents-table .supporting-documents-change",function(event){	      

	//get the current item id and update the meta to what is selected in the drop down box
	document_type = $(this).val();
	let file_id = parseInt($(this).parent().parent().attr("data-document-id"));

	if(!check_if_document_type_exists(document_type)){
		//check if this document type already exists
		
		$.when(upload_documents.updateFileMetadata(file_id,null,document_type))
		.done(function(){
			setTimeout(function(){			
				supporting_documents.validate_all_documents()
			},200);		
		});

	}else{
		sharepoint_utilities.render_notification
			(
				"Document type already exists",
				"You cannot upload duplicate document types ("+document_type+")",
				"Warning"
			)
	}


	function check_if_document_type_exists(document_type){

		let already_exists = false;
		//if there are more than 1 occurance - the currently selected one and another one then is a duplicate
		let number_of_occurances = 0;
		//loop through table of documents
		$("#qrm-supporting-documents-table .supporting-documents-change").each(function(){
			//check if someone has already uploaded this type
			let existing_document_type = $(this).val();
			if(document_type == existing_document_type){
				number_of_occurances += 1
			}	
		});

		if(number_of_occurances > 1){
			already_exists = true;
		}

		return already_exists

	}
	
});

//Get All documents from upload
upload_documents.UploadSetOfFiles = function(FilesArray){
	
	//Send documents to portal
	var files = FilesArray;
	var UploadedFileId = [];

	sharepoint_utilities.render_notification(
		"Uploading your files",
		"Please wait while we upload your files. You will get a confirmation once it has uploaded successfully.",
		"Info") 
	
	for (var i = 0; i < files.length; i++) {
	
		
		var file = files[i];
  	 	var fileName = file.name;
  	 		  	 
		var fileUploaded; 
		fileUploaded = uploadDocument(file,fileName);              
			
			$.when(fileUploaded).done(function(FileData) {			
				
				var FileName = FileData.d.Name;
				var FileID = FileData.d.ListItemAllFields.Id;
				UploadedFileId.push(FileID);
					
				upload_documents.updateFileMetadata (FileID,FileName,null);				  	 					
				
				setTimeout(function(){			  	 	
					sharepoint_utilities.render_notification("Uploading documents",FileName + " was uploaded successfully","Info");
					supporting_documents.display_all_supporting_documents();
				},600)
											
			});	
	  	
	}
	
	function uploadDocument(file, fileName) {

		 adjusted_fileName = moment().format("x") + " - " +fileName;

		var url = "";
		  //check if a folder was required to be created in the component	
		url = app_configuration.site_context + "/_api/web/getfolderbyserverrelativeurl('"+app_configuration.supporting_documents_library+"')/files/add(url='"+adjusted_fileName +"',overwrite=true)?$select=*,Id&$expand=ListItemAllFields";	  	 
	
		
		 return $.ajax({
			url: url,
			type: "POST",
			data: file,	
			processData: false,
			headers: {
						"accept": "application/json;odata=verbose",
						"content-type": "application/octet-stream",
						"X-RequestDigest": $("#__REQUESTDIGEST").val()
					},
			success: function(){	
	
				},
			error: function(){}
		});

	}
 
}

upload_documents.updateFileMetadata = function(FileId,FileName,document_type) {
	   
	   
	var restSource= app_configuration.site_context + "/_api/Web/Lists/getByTitle('"+app_configuration.supporting_documents_library+"')/Items("+FileId+")";        
	var itemPayload = {"__metadata": {"type":"SP.Data.AcceptanceContinuanceDocumentsItem"}};    
		  
	itemPayload["ReferenceID"] = main["selected_client_risk_data"].Id.toString();

	if(FileName){
		itemPayload["Title"] = FileName;
	}

	if(document_type){
		itemPayload["DocumentType"] = document_type;
	}
	   
	return $.ajax(
			{
				url: restSource,
				method: "POST",
				contentType: "application/json;odata=verbose",
				data: JSON.stringify(itemPayload),
				headers:
				{
					"Accept": "application/json;odata=verbose",
					"X-RequestDigest": $("#__REQUESTDIGEST").val(),
					"X-HTTP-Method":"MERGE",
					"If-Match": "*"
		
				},
				//
				error: function (xhr, ajaxOptions, thrownError) {
					sharepoint_utilities.render_notification("Error", "Could not upload your documents, please refresh the page", "Warning")
				}
	});
		 
}
