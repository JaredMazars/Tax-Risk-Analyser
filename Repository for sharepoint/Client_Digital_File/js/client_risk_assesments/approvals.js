let client_risk_approvals = {}

client_risk_approvals.fields_to_validate = [
	"IsTransnational","IsListedClient","IsSECRegistrant","OtherPieEntities","AcceptanceOrContinuance","RiskStatus","ClientAcceptanceType","Form_x0020_Status",
	"EngagementPartnerId", "internalEqrPartner"
]


$(document).on("click","ul[data-app-name='Client Acceptance and Continuance'] li[data-link-id='Approvals']",function(){	


	//save everything automatically
	save_sections.save_button();

	// create the loader after the html has been render by the fields 	
	sharepoint_utilities.create_loader($("div[form-navigation-target='Approvals']"));  
	//run the rule engine check one last time to check for documents and required fields that may have been skipped
	client_risk_assesments.rule_engine();

	let form_field_validation_properties = client_risk_approvals.validation_on_all_fields();
	if(!form_field_validation_properties.validation_status){
			//hide the approval process if the form is invalid
			sharepoint_utilities.hide_fields(["btn-temp-pre-approval"])
			sharepoint_utilities.hide_fields(["btn-start-approval-process"]);		
			$("div[title='Indicates additional information about your submission']").click();
			$(".right-help-comment-tabs-container ul li[data-target-id='2']").click();	
	}else{

		//if the form is in progress or not start
		 let field_properties = sharepoint_utilities.get_field_values(["Form_x0020_Status"]).meta_package; 
		 
		 if(field_properties.Form_x0020_Status == "In Progress" || field_properties.Form_x0020_Status == "Not Started" || field_properties.Form_x0020_Status == "Changes Requested"){
			sharepoint_utilities.show_fields(["btn-start-approval-process"]);
			sharepoint_utilities.show_fields(["btn-temp-pre-approval"])
		 }		
	}	
	
    //handles both acceptance and continuance	
    //clicking on the approvals tab   
    client_risk_approvals.display_approval_tasks(main["selected_client_risk_data"]);
	client_risk_assesments.update_form_values("Supporting Documents");

});

$(document).on("click","input[data-sp-element-name='btn-query-approver-configuration']",function(){

	client_risk_approvals.display_approval_reason();
	
});

$(document).on("click","#client-risk-assesments-in-progress-approvers-table .client-assesment-approval-task-action",function(){
	client_risk_approvals.apply_task_action($(this))
});



$(document).on("click","input[data-sp-element-name='btn-temp-pre-approval']",function(){
	client_risk_approvals.get_pre_approval();
});


$(document).on("click","input[data-sp-element-name='btn-start-approval-process']",function(){

	$(".warnings-section i").removeClass("has-warnings");	
	$(this).css('pointer-events', 'none');

	let form_field_validation_properties = client_risk_approvals.validation_on_all_fields();
	if(form_field_validation_properties.validation_status){

		//check that all supporting documents have been uploaded
		$.when(supporting_documents.validate_all_documents())
		.done(function(validation_outcome){		

			$("#list-of-required-documents-to-upload").html(validation_outcome.validation_message);

			if(!validation_outcome.is_valid){
				sharepoint_utilities.render_notification("Documents Required","Please upload the following documents under the supporting documents section:<br/><br/>" + validation_outcome.validation_message,"Warning")
				//open the button again
				$(this).css('pointer-events', 'auto');				
			}else{				
				client_risk_approvals.start_approval_process();
			}

			setTimeout(function(){
				$("input[data-sp-element-name='btn-start-approval-process']").css('pointer-events', 'auto');	
			},1500)
		})
	}else{
		//display the list of outstanding fields to complete
		sharepoint_utilities.render_notification("Cannot start approval","Please view the validation tab for more information","Warning");			
	}	
		
});


// validation check that all field values have a values before the approval process begins.
client_risk_approvals.validation_on_all_fields = function(){	

	//do not add the rule engine here - cyclic references occurs and then we are fucked

	//reset the warning cache
	warning_controller["warning_validation_cache"] = [];

	let list_of_sections_to_validate = [
		"General","Team Information","EQR Calculator","GIAC Form", "Business Sustainability",
		"General Information About the Engagement", "PIE",
		"Transnational Calculator", "S90 Calculator","S90 Considerations", "Fee Considerations", 
		"Key Figures - recent financial year",
		"Part A - Risk Considered as Major", "Part B - Risk Considered as Normal", "Anti-corruption", "Risk Status", 
		"Acceptance - Independence and other Considerations", 
		"Dummy Entities, Companies or Trusts Other Purpose", "Unusual Operations Regarding the Economic Activities of the Client", 
		"Know your client (KYC) procedures performed",
		"Conclusion", "Continuance - Independence and other Considerations", "1. Assessment of compliance with Independence rules"];

	
	//add logic to check 
	let validation_message = "";
	let validation_status = true;

	for (let index = 0; index < list_of_sections_to_validate.length; index++) {
		const section_name = list_of_sections_to_validate[index];

		//lets check to see if the section is disabled - then skip
		exclude_section = $("#myList li[data-link-id='"+section_name+"']").hasClass("nav-item-disabled");
		if(!exclude_section){

			validate_field_properties = sharepoint_utilities.create_meta_package($("div[form-navigation-target='"+section_name+"']"));
			if(!validate_field_properties.IsValid){
				validation_message += `<b>${section_name} section</b>:<br/>${validate_field_properties.validation_message}`;
				validation_status = false;
				validation_warning_message = `<b>${section_name} section</b>:<br/>${validate_field_properties.validation_message}`;

				warning_controller.add_new_validation_warning(section_name,validation_warning_message,"Validation");				
			}else{
				
			}
		}
	}

	if(validation_status == false){
		$(".warnings-section i").addClass("has-warnings");		
	}
	warning_controller.display_validation_warnings();
	$(".right-help-comment-tabs-container ul li[data-target-id='2']").click();

	return {
		"validation_status":validation_status,
		"validation_message":validation_message
	}

}

client_risk_approvals.apply_task_action= function(approval_properties){

	let task_fields = [				
		{
			"Title":"Select a person to re-assign this task to",
			"Description":"",
			"sp_field_name":"temp-re-assign-field",
			"sp_field_type": "select",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "number single-select-typeahead hide-field",        
            "drop_down_title_field":"Title",
            "drop_down_value_field":"Id",
            "list_name": "User Information List",
            "site_context": app_configuration.people_picker_site_context,
            "field_icon": "AccountManagement"
		},
		{
			"Title": "Additional Information",
			"Description": "Please add any additional information you wish to add into the notification",
			"sp_field_name": "temp-additional-information",
			"sp_field_type": "textarea",
			"field_width": "full-width",
			"field_validate": false,
			"sp_additional_properties": "exclude-from-meta"        
		}
	]

	let current_approver_id = parseInt(approval_properties.attr("data-current-approver-id"));	
	let approval_action = approval_properties.attr("data-approval-action");
	//add validation check that the logged in user is the current approver
	if(current_approver_id == _spPageContextInfo.userId){
		//add pop up box
		let approval_butons = {
			"Yes":function(){
				client_risk_approvals.continue_to_action_task(approval_properties,approval_action)
			},
			"Back":function(){}
		}

		let approval_box_message = 
		`
			<div class='content-pop-up-window-content' style='min-height:200px !important;width:100%'>				
				<div class='confirm-box-container'></div>
				Are you ready to continue?
			</div>
		`


		let box_title = approval_action
		switch(approval_action){

			case "ReAssigned":
				box_title = "Re assign"
			break;

			case "ChangesRequested":
				box_title = "Change Requested"
			break;
		}
		
		$.confirm({
			title: box_title + " task action",
			content: approval_box_message,
			titleClass: "confirmation-box_content-title",
			boxWidth: "50%",
			type:"green",
			useBootstrap: false,
			buttons: approval_butons,
			onContentReady: function () {
					
					$(".confirm-box-container").html(sharepoint_utilities.create_container_form(task_fields,"approvals-action-section"));
					sharepoint_utilities.apply_form_plugins(task_fields); 

					if(approval_action == "Declined"){
						let current_row_description = $(".approvals-action-section .row-description").text();						
						$(".approvals-action-section .row-description").html(current_row_description)
					}

					if(approval_action == "ReAssigned" || approval_action == "ChangesRequested"){
						sharepoint_utilities.show_fields(["temp-re-assign-field"]);
					}
			}
		}); 

	}else{
		sharepoint_utilities.render_notification("Approval Action","You cannot action another persons tasks","Warning");
	}
}

client_risk_approvals.continue_to_action_task = function(approval_properties,approval_action){

	let current_task_id = parseInt(approval_properties.attr("data-current-task-id"));
	let next_task_id = parseInt(approval_properties.attr("data-next-task-id"));
	let next_approver_id = parseInt(approval_properties.attr("data-next-approver-id"));
	
	let approver_name = approval_properties.attr("data-approver-name")

	let field_properties = sharepoint_utilities.get_field_values(["AcceptanceOrContinuance","ClientAcceptanceType","ClientName"])
	let field_values = field_properties.meta_package

	let qrm_submission_reference_id = main["selected_client_risk_data"].Id

	//update the task to the status selected
	var task_properties = {};
	
	let notification_message = "";
	let comments = $("textarea[data-sp-element-name='temp-additional-information']").val();
	let new_approver_id = parseInt($("select[data-sp-element-name='temp-re-assign-field']").val());
	let feedback_user_id = parseInt($("select[data-sp-element-name='temp-re-assign-field']").val());

	if(comments){
		comments = 
		`
			<br/>
			Additional comments were left for you:<br/>
			${comments}
		`
	}

	switch(approval_action){

		case "ReAssigned":

		if(new_approver_id){

			//update the task to the new approver and send out a message
			task_properties["AssignedTo"] = parseInt(new_approver_id);
			client_risk_approvals.update_approval_task(current_task_id,task_properties);

			//send an email to the new approver
			client_risk_approvals.create_notification(new_approver_id,comments,"Task Re-Assigned",qrm_submission_reference_id);	
			$("ul[data-app-name='Client Acceptance and Continuance'] li[data-link-id='Approvals']").click();
			sharepoint_utilities.render_notification("Re-assigning","Your task was re-assigned","Info");


		}else{
			sharepoint_utilities.render_notification("Re-assigning approver","Please select an approver first","Warning");
		}		

		break;

		case "ChangesRequested":

			if(comments){
				if(feedback_user_id){
					client_risk_approvals.create_notification(feedback_user_id,comments,"ChangesRequested",qrm_submission_reference_id);	
					sharepoint_utilities.render_notification("Feedback","Your message has been sent","Info");

					sharepoint_utilities.set_field_value("Form_x0020_Status","Changes Requested");
					//update the form status
					client_risk_assesments.update_form_values("General");

					//reset the form
					$("#Left-sticky-menu li[title='Client Acceptance and Continuance']").click();

				}else{
					sharepoint_utilities.render_notification("Feedback","Please ensure you have selected someone to send feedback to.","Warning")
				}
			}else{
				sharepoint_utilities.render_notification("Feedback","Please ensure you have added your comments","Warning");
			}
		break;

		case "Approved":		
		
			update_table_status(approval_properties,approval_action);

			//updates the current task
			task_properties["TaskStatus"] = approval_action;
			client_risk_approvals.update_approval_task(current_task_id,task_properties);			
	
			//send out the notification
			notification_message = 
			`
				<p>
					${approver_name} has signed off the ${field_values.AcceptanceOrContinuance} for ${field_values.ClientName}
					<br/>You have been selected as the next approver. Please follow these steps to approve this request:"+
					<ul>
						<li>1. Click on the approve request button below.</li>
						<li>2. Review the information displayed on the form.</li>
						<li>3. Once you are in agreement , click on the red approvals tab.</li>
						<li>3.1 Click the green approve button to continue the approval process.</li>
						<li>3.2 Click the red decline button to stop this process completely</li>
						<li>4. Wait for the confirmation of approval</li>"+
					</ul>
					You can re-assign your approval request by accessing the form, clicking on approvals section and clicking the 're-assign your approval task button'<br/>
					${comments}
				</p>	
			`

			if(check_if_all_approved()){
				
				//if this is the last task
				//set the form as completed and generate the pdf and send out a notification with the pdf attached
					//save the pdf to the library to be assessable later on
				notification_message = 
				`
					<p>
						${approver_name} has signed off the ${field_values.AcceptanceOrContinuance} for ${field_values.ClientName}
						<br/>Your submission approval has now been completed. Please see attached approval confirmation.						
						${comments}
					</p>	
				`
				next_approver_id = 0;

				sharepoint_utilities.set_field_value("Form_x0020_Status","Completed");
				client_risk_approvals.create_notification(main["selected_client_risk_data"].AuthorId,notification_message,"ApprovalComplete",qrm_submission_reference_id);	
				client_risk_approvals.create_notification(main["selected_client_risk_data"].AuthorId,"Workflow Generaterd","GeneratePDF",qrm_submission_reference_id);	
				//update the form status
				client_risk_assesments.update_form_values("General");

			}else{

				//update the next task to in progress
				task_properties["TaskStatus"] = "In Progress";
				client_risk_approvals.update_approval_task(next_task_id,task_properties)
							
				let next_table_status_element = approval_properties.parent().parent().next();
				update_next_table_status(next_table_status_element,"In Progress");
				client_risk_approvals.create_notification(next_approver_id,notification_message,"ApprovalRequest",qrm_submission_reference_id);	
			}			

			

		break;

		case "Declined":
			
			update_table_status(approval_properties,approval_action);
			//updates the current task
			task_properties["TaskStatus"] = approval_action;
			client_risk_approvals.update_approval_task(current_task_id,task_properties);
			
			client_risk_approvals.create_notification(next_approver_id,comments,"FormDeclined",qrm_submission_reference_id);	
			sharepoint_utilities.set_field_value("Form_x0020_Status","Declined");
			//update the form status
			client_risk_assesments.update_form_values("General");

		break;


	}		


	function update_table_status(approval_element,status){

		approval_element.parent().find("i").addClass("hide");
		approval_element.parent().prev().find(".table-status-container").html(`<div data-client-class='${status}'></div>${status}`)
		approval_element.parent().parent().attr("data-approval-status",status)
	}

	function update_next_table_status(approval_element,status){
	
		approval_element.find(".table-status-container").html(`<div data-client-class='${status}'></div>${status}`)
		approval_element.attr("data-approval-status",status)
	}

	function check_if_all_approved(){

		let is_all_approved = false;

		let number_of_tasks = 0;
		let number_of_approved_tasks = 0
		$("#client-risk-assesments-in-progress-approvers-table tbody tr").each(function(){

			number_of_tasks += 1;
			if($(this).attr("data-approval-status") == "Approved"){
				number_of_approved_tasks +=1;
			}
		});

		if(number_of_tasks == number_of_approved_tasks){
			is_all_approved = true;
		}

		return is_all_approved
	}
}

client_risk_approvals.update_approval_task = function(task_id,meta_package){

	sharepoint_utilities.update_item(
		"Approval Tasks",
		app_configuration.site_context,
		meta_package,
		task_id
	);
}

client_risk_approvals.check_for_pie_client = function(IsOtherPie,IsListed){

	
	var IsPIEClient = false;
	//ContinuancePIE = SEC == yes and Transnational = yes	
	if(IsListed == "Yes" || IsOtherPie == "Yes"){IsPIEClient = true;}	
	
	main["IsPIEClient"] = IsPIEClient;

	return IsPIEClient 
}

client_risk_approvals.check_for_non_pie_client = function(IsOtherPie,IsListed){

	var IsNonPIEClient = false;

	if(IsOtherPie != "Yes" && IsListed != "Yes"){IsNonPIEClient = true;}	
	
	main["IsNonPIEClient"] = IsNonPIEClient;

	return IsNonPIEClient 
}

client_risk_approvals.get_list_of_approvers = function(){

    //if(qrm_submission_data.Form_x0020_Status == "In Progress"){    

        let get_field_properties = sharepoint_utilities.get_field_values(["RequestOffice","MazarsServiceLine"])

		//get service line leader id
		var get_service_line_leader = sharepoint_utilities.get_list_items_by_title(app_configuration.site_context, 
                "ServiceLineLeader/Id,ServiceLineLeader/Title&$expand=ServiceLineLeader/Id,ServiceLineLeader/Title",            
                "Title eq '"+get_field_properties.meta_package["MazarsServiceLine"]+"'",
                "MazarsServiceLines", "");


        var get_approvers_for_office = sharepoint_utilities.get_list_items_by_title("https://mazarsglobalcloud.sharepoint.com/sites/ZAF-Mazars", 
                "*,ManagingPartner/Title,CountryRiskManager/Title,QualityOfficer/Title"+
                "&$expand=ManagingPartner/Title,CountryRiskManager/Title,QualityOfficer/Title", // filter the eqr partner
                "Title eq '"+get_field_properties.meta_package["RequestOffice"]+"'",
                "Office Contact Info", "");
            
            $.when(get_approvers_for_office,get_service_line_leader).done(function(office_data,service_line_leader_data){
            
				if(office_data.length > 0){
					var row_results = office_data[0];
					client_risk_approvals.approval_cube = row_results;		
					

					let service_line_leader_results = {
						"Id":0,
						"Title":"None"
					}
					if(service_line_leader_data.length > 0){
						
						service_line_leader_results = {
							"Id":service_line_leader_data[0].ServiceLineLeader.Id,
							"Title":service_line_leader_data[0].ServiceLineLeader.Title
						}
					}
					 
					client_risk_approvals.approval_cube["service_line_leader"] = {"id":service_line_leader_results.Id,"Title":service_line_leader_results.Title}			
					//dont create the tasks only preview approvers
					client_risk_approvals.preview_or_start_approval(false);
				}else{
					sharepoint_utilities.render_notification
						(
							"Getting Approvers",
							"Please select and office before send your form for approval",
							"Warning"
						)

					$("ul[data-app-name='Client Acceptance and Continuance'] li[data-link-id='General']").click();
				}

            });
    //}
}

client_risk_approvals.get_pre_approval = function(){

	 let pre_approval_field = [{
        "Title": "Selected Pre-Approver", // this has been moved from general into Teams
		"Description": "Please select the person you would like to send the link to review",
		"sp_field_name": "PreApproverId",
		"sp_field_type": "select",
		"field_width": "half-width",
		"field_validate": true,
		"sp_additional_properties": "number single-select-typeahead",        
		"drop_down_title_field":"Title",
		"drop_down_value_field":"Id",
		"list_name": "User Information List",
		"site_context": app_configuration.people_picker_site_context,
		"field_icon": "AddFriend"          
    }] 

    let container_html = 
    `
        <div>
            <p>You are starting the pre-approval notification process.</p>
            <div id='selected-pre-approver-container'></div>
			<p>Are you ready to proceed?</p>
        </div>
    `


	//ensure that the approval process tasks can only be clicked once
	let box_options = {
		"Yes":function(){
			
			this.$$Yes.prop('disabled', true);
			sharepoint_utilities.render_notification("Sending pre approval","Please wait while we send out a notification with a link to your submission. This dialog will close automatically","Info");
			client_risk_approvals.send_pre_approval_notification();
		},
		"No":function(){}			
	}

	//Get Data from Cube		
	let get_field_properties = sharepoint_utilities.get_field_values(
		client_risk_approvals.fields_to_validate
	)

	if(get_field_properties.IsValid){
		sharepoint_utilities.render_confirmation_box(
			"Send for pre-approval",
			container_html,
			box_options,
			"50%");

			setTimeout(function(){
			//call the specific fields in the cube and render them in the sections above
			//this renders all the fields inside the container
			$("#selected-pre-approver-container").html(
				sharepoint_utilities.create_container_form(
					pre_approval_field,//cube fields json
					"selected-pre-approver-form-fields'" //class to identify
				)
			);  
			//apply the plugins such as dates , drop downs etc 
        	sharepoint_utilities.apply_form_plugins(pre_approval_field);   
    },500)   
	}else{
		sharepoint_utilities.render_notification("Cannot start approval",get_field_properties.validation_message,"Warning");
	}
}

client_risk_approvals.send_pre_approval_notification = function(){

	let field_properties = sharepoint_utilities.get_field_values(["PreApproverId"]); 
	
	if(field_properties.IsValid){

		client_risk_approvals.create_notification(
			field_properties.meta_package["PreApproverId"],
			"Workflow handled",
			"Pre Approval Request",
			main.selected_client_risk_data.Id
		);	

	}else{
		sharepoint_utilities.render_notification
		(
			"Cannot start pre-approval",
			field_properties.validation_message,
			"Warning"
		)
	}
	

}

client_risk_approvals.start_approval_process = function(){

	//ensure that the approval process tasks can only be clicked once
	let box_options = {
		"Yes":function(){
			
			this.$$Yes.prop('disabled', true);
			sharepoint_utilities.render_notification("Sending for approval","Please wait while we send out notifications and create your approval tasks. This dialog will close automatically","Info");
								
			client_risk_approvals.preview_or_start_approval(true);	
		},
		"No":function(){}			
	}

	//Get Data from Cube		
	let get_field_properties = sharepoint_utilities.get_field_values(
		client_risk_approvals.fields_to_validate
	)
	if(get_field_properties.IsValid){
		sharepoint_utilities.render_confirmation_box(
			"Send for approval",
			"You are about to start the approval process. Are you sure you want to continue",
			box_options,
			"50%");
	}else{
		sharepoint_utilities.render_notification("Cannot start approval",get_field_properties.validation_message,"Warning");
	}
		

}

//creates the approval tasks
client_risk_approvals.preview_or_start_approval = function(StartApprovalProcess){	


	// get all the approvers in the cain and thier Ids
	//var EngagementManagerId = client_risk_approvals.get_user_id(engagement_manager_display_name);
	//var get_quality_officer_id = client_risk_approvals.get_user_id(client_risk_approvals.approval_cube.QualityOfficer.Title); //no longer needed
	var get_managing_partner_id = client_risk_approvals.get_user_id(client_risk_approvals.approval_cube.ManagingPartner.Title);
	var get_country_risk_manager_id = client_risk_approvals.get_user_id(client_risk_approvals.approval_cube.CountryRiskManager.Title);
	

	//extract the selectable approvers
	let internal_eqr_partner_display_name = $("div[sp-field-name='internalEqrPartner'] select option:selected").text();
	let engagement_partner_display_name = $("div[sp-field-name='EngagementPartnerId'] select option:selected").text();
    let lead_audit_partner_display_name = $("div[sp-field-name='LeadAuditPartnerId'] select option:selected").text();
   

	var get_internal_eqr_partner_id = client_risk_approvals.get_user_id(internal_eqr_partner_display_name);
	var get_engagement_partner_id = client_risk_approvals.get_user_id(engagement_partner_display_name);
	var get_lead_audit_partner_id = client_risk_approvals.get_user_id(lead_audit_partner_display_name);		

	$.when(get_managing_partner_id,			
					get_country_risk_manager_id,
						get_internal_eqr_partner_id,
							get_engagement_partner_id,
								get_lead_audit_partner_id)
	.done(function(managing_partner_id,
						country_risk_manager_id,
							internal_eqr_partner_id,
								engagement_partner_id,							
									 	lead_audit_partner_id){	

		let approvers_properties= {
				"EngagementManagerId":0,
				//"QualityOfficerId":quality_officer_id, //this is now the service line leader
				"ManagingPartnerId":managing_partner_id,
				"CountryRiskManagerId":country_risk_manager_id,
				"EngagementPartnerId":engagement_partner_id,
				"LeadAuditPartnerId":lead_audit_partner_id,
				"InternalEQRPartnerId":internal_eqr_partner_id,
				"ServiceLineLeaderId":client_risk_approvals.approval_cube.service_line_leader.id //this one come directly off the qrm site collection so not lookup needed
		}
		
		//Get Data from Cube -these are the required fields		
		let get_field_properties = sharepoint_utilities.get_field_values(
			client_risk_approvals.fields_to_validate
		)

		var TransnationalStatus = get_field_properties.meta_package["IsTransnational"]  
		//Check if PIE Client
		var IsListed = get_field_properties.meta_package["IsListedClient"]  
		var IsOtherPie = get_field_properties.meta_package["OtherPieEntities"]  
		
		var ServiceSubType =get_field_properties.meta_package["AcceptanceOrContinuance"]  	
		var RiskStatus = get_field_properties.meta_package["RiskStatus"]  
		
		var ClientAcceptanceType = get_field_properties.meta_package["ClientAcceptanceType"] 		
	
		///---- Approver rules------///		
		var approval_html = 
		`
			<table id='client-risk-assesments-preview-approvers-table' class="table-dashboard accordian-table table dataTable no-footer"  style='width:100%;'>
				<thead>
					<th>Role</th>
					<th>Name</th>
					<th></th>
					<th>Status</th>
				</thead>
			<tbody>
		`
		switch (ServiceSubType){
		
			case "Continuance":
				approval_html += client_risk_approvals.continuance_approval_rules(RiskStatus,IsOtherPie,IsListed,ClientAcceptanceType,StartApprovalProcess,approvers_properties);
			break;
			
			case "Acceptance":
				approval_html += client_risk_approvals.acceptance_approval_rules(RiskStatus,TransnationalStatus,IsOtherPie,IsListed,ClientAcceptanceType,StartApprovalProcess,approvers_properties);
			break;	
		}	

		approval_html += 
		`
			</tbody>
				</table>
		`
		
		$("div[sp-field-name='preview-approval-section-placeholder'] .field-component").html(approval_html);
		$("#client-risk-assesments-preview-approvers-table").DataTable({       
			"bLengthChange": false,
			"bSort":false      
		});	

		
		if(StartApprovalProcess){
			
			sharepoint_utilities.set_field_value("Form_x0020_Status","Waiting on Approval");
			client_risk_assesments.update_form_values("General");
			setTimeout(function(){
				//go and grab the new tasks and display			
				$("#Left-sticky-menu li[title='Client Acceptance and Continuance']").click();				
			},1500)			
		}				
	
		
		//and then remove after the fields values have been called within the timer
		sharepoint_utilities.remove_loader($("div[form-navigation-target='Approvals']"));  
		
	});

	
}


client_risk_approvals.display_approval_tasks = function(qrm_submission_data){


	let list_of_approved_statuses = ["Waiting on Approval","Completed","Cancelled","Declined","Feedback Requested"]

    if(qrm_submission_data.Id){

		//then we show the actuals approvers that we detail when the tasks were submitted and created
        if(list_of_approved_statuses.indexOf(qrm_submission_data.Form_x0020_Status) >= 0){    		

			sharepoint_utilities.hide_fields(["preview-approval-section-placeholder","btn-start-approval-process"])
			sharepoint_utilities.show_fields(["current-approval-progress-section-placeholder"])
			
			
            var GetApprovalTasks = sharepoint_utilities.get_list_items_by_title(
				app_configuration.site_context, 
				"*,AssignedTo/Title&$expand=AssignedTo/Title",
				"ReferenceID eq '"+qrm_submission_data.Id+"'",
				"Approval Tasks", 
				"ApprovalOrder asc");	

			var approval_html = 
			`
				<table id='client-risk-assesments-in-progress-approvers-table' class="table-dashboard accordian-table table dataTable no-footer" style='width:100%;'>
					<thead>
						<th>Role</th>
						<th>Name</th>
						<th>Created</th>
						<th>Modified</th>
						<th>Status</th>
						<th></th>
					</thead>
				<tbody>
			`

            $.when(GetApprovalTasks).done(function(task_data){	            
        
                var task_results = task_data;			 
                
                //if there has been tasks create already	
                var CountApprovals = 0;
                
                for(t=0;task_results.length > t ;t++){

					let task_row = task_results[t]  

					var next_approver_index = t + 1;
					let next_approver_id = "0";
					let next_task_id = "0";		

					if(next_approver_index < task_results.length){
						next_approver_id = task_results[next_approver_index].AssignedToId
						next_task_id = task_results[next_approver_index].Id;
					}

                    approval_html += 
					`
						<tr class='ApprovalTableRows' data-approval-status='${task_row.TaskStatus}'>
							<td>${task_row.Description}</td>
							<td>${task_row.AssignedTo.Title}</td>
							<td>${moment(task_row.Created).format("DD/MM/YYYY")}</td>
							<td>${moment(task_row.Modified).format("DD/MM/YYYY")}</td>
							<td>
								<div class="table-status-container">
									<div data-client-class='${task_row.TaskStatus}'></div>
									${task_row.TaskStatus}
								</div>
							</td>
							<td>
								${client_risk_approvals.display_icon(task_row.TaskStatus,task_row,next_approver_id,next_task_id)}
							</td>
						</tr>
					`;
                    
                }			
                                    
				approval_html += 
				`
						</tbody>
					</table>
				`       
                
				$("div[sp-field-name='current-approval-progress-section-placeholder'] .field-component").html(approval_html);
				$("#client-risk-assesments-in-progress-approvers-table").DataTable({       
					"bLengthChange": false,
					"order": [],
					"searching":false,
					"paging": false,
					"info": false
				});

				//and then remove after the fields values have been called within the timer
				sharepoint_utilities.remove_loader($("div[form-navigation-target='Approvals']"));  
				
                
            });	
        }else{
			//display preview of approvals
			client_risk_approvals.get_list_of_approvers();
		}
    }
}

client_risk_approvals.display_icon = function(task_status,task_row,next_approver_id,next_task_id){

	let action_icons = "";	

	if(task_status == "In Progress"){
		action_icons =
		`
			<i title='Approve this request' class='menu-icon ms-Icon ms-Icon--ActivateOrders client-assesment-approval-task-action table-action-button'
				data-current-task-id='${task_row["Id"]}'
				data-next-approver-id='${next_approver_id}' 
				data-next-task-id='${next_task_id}'  
				data-approver-name='${task_row.AssignedTo.Title}' 
				data-current-approver-id='${task_row.AssignedToId}'
				data-approval-action='Approved'
			>                            
			</i>&nbsp;&nbsp;  
			<i title='Decline this request' class='menu-icon ms-Icon ms-Icon--DeactivateOrders client-assesment-approval-task-action table-action-button'
				data-current-task-id='${task_row["Id"]}'
				data-next-approver-id='${next_approver_id}' 
				data-next-task-id='${next_task_id}'  
				data-approver-name='${task_row.AssignedTo.Title}'  
				data-approval-action='Declined'
				data-current-approver-id='${task_row.AssignedToId}'
			>                            
			</i>&nbsp;&nbsp; 
			<i title='ReAssigned this request' class='menu-icon ms-Icon ms-Icon--FollowUser client-assesment-approval-task-action table-action-button'
				data-current-task-id='${task_row["Id"]}'
				data-next-approver-id='${next_approver_id}' 
				data-next-task-id='${next_task_id}'  
				data-approver-name='${task_row.AssignedTo.Title}'  
				data-approval-action='ReAssigned'
				data-current-approver-id='${task_row.AssignedToId}'
			>                            
			</i>&nbsp;&nbsp;
			<i title='Request changes' class='menu-icon ms-Icon ms-Icon--Feedback client-assesment-approval-task-action table-action-button'
				data-current-task-id='${task_row["Id"]}'
				data-next-approver-id='${next_approver_id}' 
				data-next-task-id='${next_task_id}'  
				data-approver-name='${task_row.AssignedTo.Title}'  
				data-approval-action='ChangesRequested'
				data-current-approver-id='${task_row.AssignedToId}'
			>                            
			</i>&nbsp;&nbsp;
		`
	}

	return action_icons
}

client_risk_approvals.get_user_id = function(userDisplayName){

	var Promise = $.Deferred()

	var UserId = 0;		
	$.ajax({
		async:true,
		url: app_configuration.site_context + "/_api/web/siteusers?&$filter=Title eq '"+userDisplayName+"'",		        
		method: "GET",
		headers: { "Accept": "application/json; odata=nometadata" },
		success:function(data){
			if(data.value.length > 0){
				UserId = data.value[0].Id;
			}   			
			Promise.resolve(UserId);
			
		}
	});
			
	 return Promise.promise()
}

client_risk_approvals.continuance_approval_rules = function(RiskStatus,IsOtherPie,IsListed,ClientAcceptanceType,StartApprovalProcess,approver_properties){

	var IsPIEClient = client_risk_approvals.check_for_pie_client(IsOtherPie,IsListed);
	var IsNONPIEClient = client_risk_approvals.check_for_non_pie_client(IsOtherPie,IsListed);
	

	var ListOfApprovers = client_risk_approvals.approval_cube;	

	let engagement_manager_display_name = $("div[sp-field-name='EngagementManagerId'] select option:selected").text();
    let engagement_partner_display_name = $("div[sp-field-name='EngagementPartnerId'] select option:selected").text();
    let lead_audit_partner_display_name = $("div[sp-field-name='LeadAuditPartnerId'] select option:selected").text();
    let internal_eqr_partner_display_name = $("div[sp-field-name='internalEqrPartner'] select option:selected").text();

    let qrm_submission_reference_id = main["selected_client_risk_data"].Id

	
	//var EngagementManagerHtml = "<tr class='ApprovalTableRows'><td>Engagement Manager</td><td>"+sharepoint_utilities.check_for_null(engagement_manager_display_name,"Add your engagement partner")+"</td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";	
	
	var EngagementPartnerHtml = "<tr class='ApprovalTableRows'><td>Engagement Partner</td><td>"+sharepoint_utilities.check_for_null(engagement_partner_display_name,"Add your engagement partner")+"</td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";	
	var LeadAuditPartnerHtml = "<tr class='ApprovalTableRows'><td>Lead Audit Partner</td><td>"+sharepoint_utilities.check_for_null(lead_audit_partner_display_name,"Add your lead audit partner")+"</td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";	
	var InternalEqrPartnerHtml = "<tr class='ApprovalTableRows'><td>Internal EQR Partner</td><td>"+sharepoint_utilities.check_for_null(internal_eqr_partner_display_name,"Add your internal eqr partner")+"</td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";	
	
	//var QualityOfficerHtml = "<tr class='ApprovalTableRows'><td>Quality Officer</td><td>"+ListOfApprovers.QualityOfficer.Title+"</td></td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";				
	var service_line_leader_html = "<tr class='ApprovalTableRows'><td>Service Line Leader</td><td>"+ListOfApprovers.service_line_leader.Title+"</td></td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";				
	
	
	var ManagingPartnerHtml = "<tr class='ApprovalTableRows'><td>Managing Partner</td><td>"+ListOfApprovers.ManagingPartner.Title+"</td></td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";					
	var CountryRiskManagerHtml = "<tr class='ApprovalTableRows'><td>Country Risk Manager</td><td>"+ListOfApprovers.CountryRiskManager.Title+"</td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";
		
	var ApprovalHtml = "";
	
	if(StartApprovalProcess){

		//client_risk_approvals.create_approval_tasks(EngagementManagerId,"Engagement Manager","In Progress",qrm_submission_reference_id,"1");	

		//change this to waiting
		client_risk_approvals.create_approval_tasks(approver_properties.EngagementPartnerId,"Engagement Partner","In Progress",qrm_submission_reference_id,"2");	
		
		if(ClientAcceptanceType == "Non assurance service on existing assurance client (Appendix D)"){	
			
			//LeadAuditPartnerId = client_risk_approvals.get_user_id(lead_audit_partner_display_name);	
			client_risk_approvals.create_approval_tasks(approver_properties.LeadAuditPartnerId ,"Lead Audit Partner","Waiting",qrm_submission_reference_id,"3");
		}
	}else{
		//Engagement partner always first
		//ApprovalHtml += EngagementManagerHtml + EngagementPartnerHtml;	
		ApprovalHtml += EngagementPartnerHtml;	

		if(ClientAcceptanceType == "Non assurance service on existing assurance client (Appendix D)"){
			ApprovalHtml += LeadAuditPartnerHtml;			
		}

	}	



	//first check if the client is not risky
	switch(RiskStatus){		
		case "Risky":
			if(IsPIEClient){			
				//if the client is risky and is PIE evreyone needs to approve regardless of channel						
					if(StartApprovalProcess){	
						client_risk_approvals.create_approval_tasks(approver_properties.ServiceLineLeaderId,"Service Line Leader","Waiting",qrm_submission_reference_id,"4");
						client_risk_approvals.create_approval_tasks(approver_properties.ManagingPartnerId,"Managing Partner","Waiting",qrm_submission_reference_id,"5");
						client_risk_approvals.create_approval_tasks(approver_properties.CountryRiskManagerId,"Country Risk Manager","Waiting",qrm_submission_reference_id,"6");
					}else{
						//Just display the html prveview
						ApprovalHtml += service_line_leader_html; 
						ApprovalHtml += ManagingPartnerHtml; 
						ApprovalHtml += CountryRiskManagerHtml; 
					}
			}else
				if(IsNONPIEClient){				
					//If the client is risky and NONPIE	
					if(StartApprovalProcess){
						client_risk_approvals.create_approval_tasks(approver_properties.CountryRiskManagerId,"Country Risk Manager","Waiting",qrm_submission_reference_id,"4");					
					}else{						
						ApprovalHtml += CountryRiskManagerHtml; 
					}						
				}
			break;	
	
		case "Not Risky":
			
			if(IsPIEClient){					
				
				if(StartApprovalProcess){
						client_risk_approvals.create_approval_tasks(approver_properties.ManagingPartnerId,"Managing Partner","Waiting",qrm_submission_reference_id,"4");
				}else{							
						ApprovalHtml += ManagingPartnerHtml; 
				}				
					
			}else
			 	if(IsNONPIEClient){
					//Client is then NON PIE
					if(ClientAcceptanceType == "Assurance"){
						
						if(StartApprovalProcess){
							//client_risk_approvals.create_approval_tasks(CountryRiskManagerId,"Country Risk Manager","Waiting",getParameterByName("ID"));
						}else{
							//just display the html preview							
							//ApprovalHtml += CountryRiskManagerHtml; 
						}

					}else if(ClientAcceptanceType == "Non-Assurance"){  
						//Country Risk Manager only when risky - taken care by the above risky case check
					}				
				}				
			break;	
			
		case "Not Applicable":
			//for appendix D Non assurance services fro existing assurance clients
			if(IsPIEClient){
				
				if(StartApprovalProcess){
					client_risk_approvals.create_approval_tasks(approver_properties.ServiceLineLeaderId,"Service Line Leader","Waiting",qrm_submission_reference_id,"4");				
				}else{
					//just display the html preview
					ApprovalHtml += service_line_leader_html; 					
				}			
			}			
			break;
	}	


	return ApprovalHtml

}

client_risk_approvals.acceptance_approval_rules = function(RiskStatus,TransnationalStatus,IsOtherPie,IsListed,ClientAcceptanceType,StartApprovalProcess,approver_properties){

	var IsPIEClient = client_risk_approvals.check_for_pie_client(IsOtherPie,IsListed);
	var IsNONPIEClient = client_risk_approvals.check_for_non_pie_client(IsOtherPie,IsListed);
	let is_blacklisted = sharepoint_utilities.get_field_values(["IsBlackListed"]).meta_package["IsBlackListed"]
	let internal_eqr_partner = sharepoint_utilities.get_field_values(["internalEqrPartner"]).meta_package["internalEqrPartner"]


	var ListOfApprovers = client_risk_approvals.approval_cube;	

	let engagement_manager_display_name = $("div[sp-field-name='EngagementManagerId'] select option:selected").text();
    let engagement_partner_display_name = $("div[sp-field-name='EngagementPartnerId'] select option:selected").text();
    let lead_audit_partner_display_name = $("div[sp-field-name='LeadAuditPartnerId'] select option:selected").text();
    

    let qrm_submission_reference_id = main["selected_client_risk_data"].Id

	var EngagementManagerHtml = "<tr class='ApprovalTableRows'><td>Engagement Manager</td><td>"+sharepoint_utilities.check_for_null(engagement_manager_display_name,"Add your engagement partner")+"</td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";	
	var EngagementPartnerHtml = "<tr class='ApprovalTableRows'><td>Engagement Partner</td><td>"+sharepoint_utilities.check_for_null(engagement_partner_display_name,"Add your engagement partner")+"</td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";		
	var LeadAuditPartnerHtml = "<tr class='ApprovalTableRows'><td>Lead Audit Partner</td><td>"+sharepoint_utilities.check_for_null(lead_audit_partner_display_name,"Add your lead audit partner")+"</td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";	
	var InternalEQRPartnerHtml = "<tr class='ApprovalTableRows'><td>Internal EQR Partner</td><td>"+sharepoint_utilities.check_for_null(internal_eqr_partner,"Add your internal eqr partner")+"</td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";	
	
	//var QualityOfficerHtml = "<tr class='ApprovalTableRows'><td>Quality Officer</td><td>"+ListOfApprovers.QualityOfficer.Title+"</td></td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";				
	var service_line_leader_html = "<tr class='ApprovalTableRows'><td>Service Line Leader</td><td>"+ListOfApprovers.service_line_leader.Title+"</td></td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";				
	
	
	var ManagingPartnerHtml = "<tr class='ApprovalTableRows'><td>Managing Partner</td><td>"+ListOfApprovers.ManagingPartner.Title+"</td></td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";					
	var CountryRiskManagerHtml = "<tr class='ApprovalTableRows'><td>Country Risk Manager</td><td>"+ListOfApprovers.CountryRiskManager.Title+"</td><td></td><td><div class='table-status-container'><div data-client-class='Waiting'></div>Waiting to start</div></td></tr>";
	
	
	var ApprovalHtml = "";	

	//check if blacklisted has been selected	
	if(StartApprovalProcess){

		if(internal_eqr_partner){
			client_risk_approvals.create_approval_tasks(approver_properties.InternalEQRPartnerId,"EQR Partner","In Progress",qrm_submission_reference_id,"1");
			//client_risk_approvals.create_approval_tasks(EngagementManagerId,"Engagement Manager","Waiting",qrm_submission_reference_id,"2");
			client_risk_approvals.create_approval_tasks(approver_properties.EngagementPartnerId,"Engagement Partner","Waiting",qrm_submission_reference_id,"2");
		}else{
			//client_risk_approvals.create_approval_tasks(EngagementManagerId,"Engagement Manager","In Progress",qrm_submission_reference_id,"1");
			//change this to waiting when implemented
			client_risk_approvals.create_approval_tasks(approver_properties.EngagementPartnerId,"Engagement Partner","In Progress",qrm_submission_reference_id,"2");
		}
		
		if(ClientAcceptanceType == "Non assurance service on existing assurance client (Appendix D)"){							
			client_risk_approvals.create_approval_tasks(approver_properties.LeadAuditPartnerId,"Lead Audit Partner","Waiting",qrm_submission_reference_id,"3");			
		}
	
	}else{
		//Engagement partner always first
		//EQR Partner selected within the EQR Calculator
		// get the trigger of entering the EQR person's name and display it within the pre-approvals table
		if(internal_eqr_partner){
			ApprovalHtml += InternalEQRPartnerHtml;
		}

		//ApprovalHtml += EngagementManagerHtml + EngagementPartnerHtml;	
		ApprovalHtml += EngagementPartnerHtml;
		if(ClientAcceptanceType == "Non assurance service on existing assurance client (Appendix D)"){
			ApprovalHtml += LeadAuditPartnerHtml; 			
		}
	}	
	//lets check if the country risk manager is already required
	let has_country_risk_manager =  false;

	//first check if the client is not risky
	switch(RiskStatus){		
		case "Risky":
			if(IsPIEClient){			
				//if the client is risky and is PIE evreyone needs to approve regardless of channel						
					if(StartApprovalProcess){	
						//client_risk_approvals.create_approval_tasks(approver_properties.QualityOfficerId ,"Quality Officer","Waiting",qrm_submission_reference_id,"4");
						client_risk_approvals.create_approval_tasks(approver_properties.ServiceLineLeaderId,"Service Line Leader","Waiting",qrm_submission_reference_id,"4");
						client_risk_approvals.create_approval_tasks(approver_properties.ManagingPartnerId,"Managing Partner","Waiting",qrm_submission_reference_id,"5")
						client_risk_approvals.create_approval_tasks(approver_properties.CountryRiskManagerId ,"Country Risk Manager","Waiting",qrm_submission_reference_id,"6");
						has_country_risk_manager = true;
					}else{
						//Just display the html prveview
						ApprovalHtml += service_line_leader_html; 
						ApprovalHtml += ManagingPartnerHtml; 
						ApprovalHtml += CountryRiskManagerHtml; 
					}
			}else
				if(IsNONPIEClient){				
					//If the client is risky and NONPIE	
					if(TransnationalStatus == "Yes"){
						if(StartApprovalProcess){	
							//client_risk_approvals.create_approval_tasks(approver_properties.QualityOfficerId ,"Quality Officer","Waiting",qrm_submission_reference_id,"4");
							client_risk_approvals.create_approval_tasks(approver_properties.ServiceLineLeaderId,"Service Line Leader","Waiting",qrm_submission_reference_id,"4");
							client_risk_approvals.create_approval_tasks(approver_properties.ManagingPartnerId,"Managing Partner","Waiting",qrm_submission_reference_id,"5")
							client_risk_approvals.create_approval_tasks(approver_properties.CountryRiskManagerId ,"Country Risk Manager","Waiting",qrm_submission_reference_id,"6");
							has_country_risk_manager = true;
						}else{
							//Just display the html prveview
							ApprovalHtml += service_line_leader_html; 
							ApprovalHtml += ManagingPartnerHtml; 
							ApprovalHtml += CountryRiskManagerHtml; 
						}					
					}else
						if(TransnationalStatus == "No"){
							//Applies to both Assurance and Non Assurnace
							if(StartApprovalProcess){								
								client_risk_approvals.create_approval_tasks(approver_properties.CountryRiskManagerId ,"Country Risk Manager","Waiting",qrm_submission_reference_id,"4");
								has_country_risk_manager = true;
							}else{
								//Just display the html prveview
								ApprovalHtml += CountryRiskManagerHtml; 							
							}												
						}						
				}
			break;	
	
		case "Not Risky":
			
			if(IsPIEClient){					
					//applies to both Assurance and non assurance
					if(StartApprovalProcess){							
							client_risk_approvals.create_approval_tasks(approver_properties.ServiceLineLeaderId,"Service Line Leader","Waiting",qrm_submission_reference_id,"4");
							//client_risk_approvals.create_approval_tasks(approver_properties.QualityOfficerId ,"Quality Officer","Waiting",qrm_submission_reference_id,"4");
							client_risk_approvals.create_approval_tasks(approver_properties.ManagingPartnerId,"Managing Partner","Waiting",qrm_submission_reference_id,"5")
							client_risk_approvals.create_approval_tasks(approver_properties.CountryRiskManagerId ,"Country Risk Manager","Waiting",qrm_submission_reference_id,"6");
					}else{
							//Just display the html prveview
							ApprovalHtml += service_line_leader_html; 
							ApprovalHtml += ManagingPartnerHtml; 
							ApprovalHtml += CountryRiskManagerHtml; 
					}	
			}else if(IsNONPIEClient){
					//applies to both Assurance and non assurance
					if(StartApprovalProcess){							
						//client_risk_approvals.create_approval_tasks(QualityOfficerId ,"Quality Officer","Waiting",getParameterByName("ID"));
						//client_risk_approvals.create_approval_tasks(ManagingPartnerId,"Managing Partner","Waiting",getParameterByName("ID") )
						//client_risk_approvals.create_approval_tasks(CountryRiskManagerId ,"Country Risk Manager","Waiting",getParameterByName("ID"));
					}else{
							//Just display the html prveview
							//ApprovalHtml += QualityOfficerHtml; 
							//ApprovalHtml += ManagingPartnerHtml; 
							//ApprovalHtml += CountryRiskManagerHtml;					
					}
			}							
			break;	
			
		case "Not Applicable":
			//for appendix D Non assurance services fro existing assurance clients
			if(IsPIEClient){
				
				if(StartApprovalProcess){
					//client_risk_approvals.create_approval_tasks(QualityOfficerId ,"Quality Officer","Waiting",getParameterByName("ID"));					
				}else{
					//just display the html preview
					//ApprovalHtml += QualityOfficerHtml; 					
				}			
			}			
			break;

	}	
	
	// CountryRiskManager based on is blacklisted yes
	if(is_blacklisted == "Yes" && has_country_risk_manager == false){
		if(StartApprovalProcess){			
			client_risk_approvals.create_approval_tasks(approver_properties.CountryRiskManagerId ,"Country Risk Manager","Waiting",qrm_submission_reference_id,"6");
		}else{
			ApprovalHtml += CountryRiskManagerHtml;	
		}		
	}

	
	return ApprovalHtml

}

client_risk_approvals.create_approval_tasks = function(AssignedToId,Description,TaskStatus,ReferenceID,approval_order){

	let get_field_properties = sharepoint_utilities.get_field_values(["AcceptanceOrContinuance","ClientName","ClientAcceptanceType"])

	var TaskProperties = {};
	TaskProperties["Title"] = "New Approval Task - " + get_field_properties.meta_package["AcceptanceOrContinuance"] + " " + get_field_properties.meta_package["ClientName"] + " "  + get_field_properties.meta_package["ClientAcceptanceType"] + " ";
	TaskProperties["Description"] = Description;
	TaskProperties["SignatureType"] = Description;
	TaskProperties["AssignedToId"] = AssignedToId;
	//TaskProperties["AssignedToId"] = 9;
	TaskProperties["TaskStatus"] = TaskStatus;
	TaskProperties["ReferenceID"] = ReferenceID.toString();
	TaskProperties["ApprovalOrder"] = approval_order;
	

	
	sharepoint_utilities.save_item("Approval Tasks",app_configuration.site_context,TaskProperties)

	if(Description == "Engagement Partner"){
	
		//send a notification out to the first approver - Engagement Partner
		var Message = 
		"<p>"+
			_spPageContextInfo.userDisplayName + " has requested your approval." + 
				"<br/>Please follow the below steps to complete your approval:"+
				"<ul>"+
					"<li>1. Click on the approve request button below.</li>"+
					"<li>2. Review the information displayed on the form.</li>"+
					"<li>3. Once you are in agreement , click on the red approvals tab.</li>"+
					"<li>3.1 Click the green approve button to continue the approval process.</li>"+	
					"<li>3.2 Click the red decline button to stop this process completely</li>"+
					"<li>4. Wait for the confirmation page to appear</li>"+
				"</ul>"+
			"You can re-assign your approval request by accessing the form, clicking on approvals section and clicking the 're-assign your approval task button' "+						
		"</p>";
								
		client_risk_approvals.create_notification(AssignedToId,Message,"ApprovalRequest",ReferenceID);	
	}

	
}

client_risk_approvals.create_notification = function(AssignedToId,Message,NotificationType,AssociatedReference){

	var NotificationProperties = {};
	NotificationProperties["Title"] = "New Notification";
	NotificationProperties["Message"] = Message;
	NotificationProperties["AssignedToId"] = AssignedToId;
	//NotificationProperties["AssignedToId"] = 9;	
	NotificationProperties["NotificationType"] = NotificationType;
	NotificationProperties["AssociatedReferenceID"] = AssociatedReference.toString();	

	sharepoint_utilities.save_item(app_configuration.ac_general_notifications,app_configuration.site_context,NotificationProperties)
	
}


client_risk_approvals.display_approval_reason = function(){

	var ApprovalReasoning = "Please see below indicators of why the current set of approvers have been selected:<br/><br/>";

	let field_properties = sharepoint_utilities.get_field_values(
		[
			"ClientAcceptanceType","AcceptanceOrContinuance","IsPIEClient","IsNonPIEClient","IsListedClient","CryptoEngagment",
			"SPACEngagment","IPOEngagment","OtherPieEntities","IsTransnational","RiskStatus"
		]	
	)
	
	ApprovalReasoning += 
	`
		<table id='approval-reason-table'>
			<thead>
				<tr>
					<th>Condition</th>
					<th>Selection</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><b>Service type</b></td><td>${sharepoint_utilities.check_for_null(field_properties.meta_package["ClientAcceptanceType"],"None")}</td>
				</tr>
				<tr>
					<td><b>Take on type</b></td><td>${sharepoint_utilities.check_for_null(field_properties.meta_package["AcceptanceOrContinuance"],"None")}</td>
				</tr>
				<tr>
					<td><b>Is Listed Client</b></td><td>${sharepoint_utilities.check_for_null(field_properties.meta_package["IsListedClient"],"None")}</td>
				</tr>
				<tr>
					<td><b>Crypto Engagement</b></td><td>${sharepoint_utilities.check_for_null(field_properties.meta_package["CryptoEngagment"],"None")}</td>
				</tr>

				<tr>
					<td><b>SPAC Engagement</b></td><td>${sharepoint_utilities.check_for_null(field_properties.meta_package["SPACEngagment"],"None")}</td>
				</tr>

				<tr>
					<td><b>IPO Engagement</b></td><td>${sharepoint_utilities.check_for_null(field_properties.meta_package["IPOEngagment"],"None")}</td>
				</tr>
				<tr>
					<td><b>Other PIE Entities</b></td><td>${sharepoint_utilities.check_for_null(field_properties.meta_package["OtherPieEntities"],"None")}</td>
				</tr>
				<tr>
					<td><b>Is Transnational</b></td><td>${sharepoint_utilities.check_for_null(field_properties.meta_package["IsTransnational"],"None")}</td>
				</tr>
				<tr>
					<td><b>Risk Status</b></td><td>${sharepoint_utilities.check_for_null(field_properties.meta_package["RiskStatus"],"None")}</td>
				</tr>
				<tr>
					<td><b>Is PIE Client</b></td><td>${sharepoint_utilities.check_for_null(field_properties.meta_package["IsPIEClient"],"None")}</td>
				</tr>
				<tr>
					<td><b>Is Non PIE Client</b></td><td>${sharepoint_utilities.check_for_null(field_properties.meta_package["IsNonPIEClient"],"None")}</td>
				</tr>
			</tbody>
		</table>		
	`	
	sharepoint_utilities.render_confirmation_box("Approval Indicator",ApprovalReasoning,{},"50%");
	setTimeout(function(){
		$("#approval-reason-table").DataTable({
			"searching": false,
			"lengthChange": false
		});
	},50);		
	
}