let consultations_app = {}
consultations_app.configurations = {
    "legacy_word_template_data":{}
}

//handles navigation clicks
$(document).on("click", "ul[data-app-name='Consultations'] li", function(){

    let get_section_name = $(this).attr("data-link-id");
    render_navigation.show_section(get_section_name);

});

$(document).on("click","ul[data-app-name='Consultations'] li[data-link-id='Submit your rating feedback']",function(){
   
    //manually opening the selections
    consultations_app.render_form_fields(null);
    $("ul[data-app-name='Consultations'] li[data-link-id='Consultation Feedback']").click();
  
});

$(document).on("click","input[data-sp-element-name='sp-button-submit-consultation-feedback-review']",function(){

    consultations_app.submit_review();
});

$(document).on("change","input[data-sp-element-name='FeedbackType']",function(){

    consultations_app.form_rules();    
});

consultations_app.render_form_fields = function(form_reference_id){

    let canvas =  $(".page-section");   
    main.add_loader();
    //create the sections that hide and show based on the navigation item selected
    let section_names = [
        "Not Available",
        "Consultation Feedback"    
    ]

    canvas.html(main.create_form_sections(section_names))

    canvas.find("div[form-navigation-target='Not Available']").html(
        sharepoint_utilities.create_container_form(
                consultations_fields_configuration.not_available,"consultation-not-available-section"));
    canvas.find("div[form-navigation-target='Consultation Feedback']").html(
        sharepoint_utilities.create_container_form(
            consultations_fields_configuration.team_rating_fields,"consultations-team-feedback-section"));    

    let consolidate_all_fields = sharepoint_utilities.consolidate_fields(consultations_fields_configuration);
    //apply any plugins
    sharepoint_utilities.apply_form_plugins(consolidate_all_fields);  

    
    //render form values
    if(form_reference_id){          
        
        sharepoint_utilities.render_saved_values(
            form_reference_id,
            consultations_fields_configuration,
            app_configuration.consultations_list_name,
            2500,
            function(get_consultations_data){
                //on success
                main["selected_consultation_data"] = get_consultations_data[0];  
                consultations_app.Id = form_reference_id
                consultations_app.form_rules();
                main.remove_loader();
                consultations_app.setup_legacy_template(main["selected_consultation_data"].ConsultationReferenceId)
                
                //set the refernce number
                main.render_form_reference_number("QCF"+ get_consultations_data[0].Id)
            },
            function(){
                //on error
            }
        );  
    }else{
        main.remove_loader();
    }  

}

consultations_app.form_rules = function(){

    let default_fields =  ["ConsultationReferenceId","FeedbackType","AdditionalFeedback"];
    let consultation_team_fields = ["TechnicalQuality","Communication","TimeManagment","Professionalism"];
    let engagement_team_fields = ["Clarity","Relevance","Research","SupportingDocuments"];

    let field_properties = sharepoint_utilities.get_field_values(["FeedbackType","Status"]); 

     //reset field views by hiding all fields
    let feedback_fields = consultation_team_fields.concat(engagement_team_fields);   
    sharepoint_utilities.hide_fields(feedback_fields)
    sharepoint_utilities.set_fields_as_not_required(feedback_fields);   
    
    let fields_to_display = consultations_app.determine_form_field_per_team(field_properties.meta_package["FeedbackType"])  
    
    sharepoint_utilities.show_fields(fields_to_display);
    sharepoint_utilities.set_fields_as_required(fields_to_display)

    // in both cases additional feedback is not a required field
    sharepoint_utilities.set_fields_as_not_required(["AdditionalFeedback"]);
    sharepoint_utilities.disable_fields(["FeedbackType"])

    switch(field_properties.meta_package["Status"]){

        case "Completed":            
            sharepoint_utilities.disable_all_fields_by_section("Consultation Feedback",["input","select","textarea","button"])
            sharepoint_utilities.hide_fields(["sp-button-submit-consultation-feedback-review"]);            
        break;
    }
}

consultations_app.render_data_from_email = function(request_meta){
      
    //open up the navigation path   
    $("#Left-sticky-menu li[title='Consultations']").click();  
    render_navigation.render_by_link_click($("ul[data-app-name='Consultations'] li[data-link-id='Submit your rating feedback']"))  
    render_navigation.render_by_link_click($("ul[data-app-name='Consultations'] li[data-link-id='Consultation Feedback']")) 

    setTimeout(function(){
        consultations_app.render_form_fields(parseInt(request_meta.item_id)); 
        render_navigation.show_section("Consultation Feedback");        
    },500)
     
}

consultations_app.submit_review = function(){
   
    let get_feedback_type = sharepoint_utilities.get_field_values(["FeedbackType"]).meta_package["FeedbackType"];  

    let fields_to_validate = consultations_app.determine_form_field_per_team(get_feedback_type);    
    let field_properties = sharepoint_utilities.get_field_values(fields_to_validate);     
    let rating_message = consultations_app.create_rating_message()
    
    if(field_properties.IsValid){

        //get the consultations details
        //Consultation CreatedById - this is who created the item both these people and the partner then get notified at the end
        let CreatedById = consultations_app.configurations.original_data.AuthorId;
        //QRMConsultantId - this person and the qrm reviwer get notified at the end
        let QRMConsultantId = consultations_app.configurations.original_data.QRMConsultantId;

        //update the form status to completed
        sharepoint_utilities.set_select_2_fields_by_value("Completed",$("select[data-sp-element-name='Status']")); 
        consultations_app.save_or_update_form()
        //business rule - only once the engagement team has rated the form do we generate the PDF
        if(field_properties.meta_package["FeedbackType"] == "Consultation Team"){

            //this is all the notifications for engagement team
            //we create the pdf notification to complete the process
            consultations_app.create_notification_in_legacy_system(
                CreatedById,
                JSON.stringify(consultations_app.configurations.legacy_word_template_data), 
                "Generate Final PDF",
                field_properties.meta_package["ConsultationReferenceId"],
                field_properties.meta_package["FeedbackType"] 
            )

            //stores the message for later to be sent out
            consultations_app.create_notification_in_legacy_system(
                0, //no longer needed
                rating_message,                
                "Feedback Survey Responses",
                field_properties.meta_package["ConsultationReferenceId"],
                field_properties.meta_package["FeedbackType"] 
            )
        }else{

            //this is for all the consultants

            //stores the message for later to be sent out
            consultations_app.create_notification_in_legacy_system(
                CreatedById, //no longer needed
                rating_message,                
                "Feedback Survey Responses",
                field_properties.meta_package["ConsultationReferenceId"],
                field_properties.meta_package["FeedbackType"] 
            )

            //create the next item and send to the engagment team to complete
            consultations_app.create_notification_in_legacy_system(
                CreatedById, //no longer needed
                "",                
                "Requested Engagement Team Feedback Survey",
                field_properties.meta_package["ConsultationReferenceId"],
                field_properties.meta_package["FeedbackType"] 
            )
        }      
    }else{
        sharepoint_utilities.render_notification
            (
                "Survey Submission",
                field_properties.validation_message,
                "Warning"
            )
    }         
}

consultations_app.determine_form_field_per_team = function(feedback_type){

    let default_fields =  ["ConsultationReferenceId","FeedbackType","AdditionalFeedback"];
    let consultation_team_fields = ["TechnicalQuality","Communication","TimeManagment","Professionalism"];
    let engagement_team_fields = ["Clarity","Relevance","Research","SupportingDocuments"];

    let fields_to_display = []
    switch(feedback_type){

        case "Consultation Team":
            fields_to_display = default_fields.concat(consultation_team_fields);
        break;

        case "Engagement Team":
            fields_to_display = default_fields.concat(engagement_team_fields);            
        break;
    } 

    return fields_to_display

}

consultations_app.create_rating_message = function(){

    
    let get_meta_package = sharepoint_utilities.create_meta_package($(".consultations-team-feedback-section"));  

    let consultation_team_fields = ["TechnicalQuality","Communication","TimeManagment","Professionalism"];
    let engagement_team_fields = ["Clarity","Relevance","Research","SupportingDocuments"];

    let consultation_display_names = ["Technical Quality","Communication","Time Managment","Professionalism"];
    let engagement_display_names = ["Clarity","Relevance","Research","Supporting Documents"];

    let rating_message = 
    `
        <table>
            <thead>
                <tr>
                    <th colspan='2'>&nbsp;</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><b>Consultation Reference</b></td>
                    <td>${get_meta_package.meta_package["ConsultationReferenceId"]}</td>
                </tr>
                <tr>
                    <td colspan='2'>&nbsp;</td>                    
                </tr>
                <tr>
                    <td><b>Feedback Type</b></td>
                    <td>Consultation Feedback</td>
                </tr> 
    `

    if(get_meta_package.meta_package["FeedbackType"] == "Consultation Team"){

        for (let index = 0; index < consultation_team_fields.length; index++) {
            const row_data = consultation_team_fields[index];
            rating_message += 
            `
                <tr>
                    <td><b>${consultation_display_names[index]}</b></td>
                    <td>${get_meta_package.meta_package[row_data]}</td>
                </tr>
            `
            
        }
    }

    if(get_meta_package.meta_package["FeedbackType"] == "Engagement Team"){

        for (let index = 0; index < engagement_team_fields.length; index++) {
            const row_data = engagement_team_fields[index];
            
            rating_message += 
            `
                <tr>
                    <td><b>${engagement_display_names[index]}</b></td>
                    <td>${get_meta_package.meta_package[row_data]}</td>
                </tr>
            `
        }

    }


    rating_message += 
    `
                <tr>
                    <td colspan='2'>&nbsp;</td>                    
                </tr>
                <tr>
                    <td colspan='2'><b>Additional Feedback</b></td>                    
                </tr>
                <tr>
                    <td colspan='2'>${sharepoint_utilities.check_for_null(get_meta_package.meta_package["AdditionalFeedback"],"")}</td>                    
                </tr>               
            </tbody>
        </table>
    `

    return rating_message
}

consultations_app.save_or_update_form = function(){
  
    let get_meta_package = sharepoint_utilities.create_meta_package($(".consultations-team-feedback-section"));

     let field_properties = sharepoint_utilities.get_field_values(["AdditionalFeedback"]); 
     if(field_properties.IsValid)
    
    if(get_meta_package.IsValid == true){
        if(consultations_app.Id){        

            //update the form
            sharepoint_utilities.vaildate_meta_package_for_updates(
                get_meta_package,
                app_configuration.site_context,
                app_configuration.consultations_list_name,
                consultations_app.Id,
                function(){
                    sharepoint_utilities.render_notification
                        (
                            "Submitting Feedback",
                            "Please wait while we submit your feeback",
                            "Info"
                        )

                        $("#Left-sticky-menu li[title='View dashboard']").click();

                }, //success message
                function(){} //invalid message
            )
        }else{      
            //create a new form
            sharepoint_utilities.vaildate_meta_package(
                get_meta_package,
                app_configuration.site_context,
                app_configuration.vendor_submission_list,
                function(result){
                    consultations_app.form_reference_id = result.Id
                    
                }, //success message
                function(){} //invalid message
            )
        }
    }else{
        sharepoint_utilities.render_notification
            (
                "Submission of consultation feedback",
                get_meta_package.validation_message,
                "Warning"
            )
    }
}

consultations_app.create_notification_in_legacy_system = function(assigned_to_id,message,notification_type,reference_id,NotificationProperties){

    let promise = $.Deferred();

	var meta_package = {};
	meta_package["Title"] = "New Notification";
	meta_package["Message"] = message;
	meta_package["AssignedToId"] = assigned_to_id;	
	meta_package["NotificationType"] = notification_type;
	meta_package["AssociatedReferenceID"] = reference_id;
    meta_package["NotificationProperties"] = NotificationProperties
	
    let create_item = sharepoint_utilities.save_item
        (
            "GeneralNotifications",
            "https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QRM-Consulations/",
            meta_package
        );
    $.when(create_item)
        .done(function(item_id){
            promise.resolve("done")
    });
    
    return promise.promise();
}

consultations_app.setup_legacy_template = function(consultation_reference_id){

    //we set this up at the start as to not have to wait on the submit button
    let get_list_items = sharepoint_utilities.get_list_items_by_title
        (
            "https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QRM-Consulations", 
            "*",
            "Id eq " + consultation_reference_id,
            "QRMConsultations",
            "Id desc"
        )
    $.when(get_list_items).
        done(function(item_results){

            let legacy_consultation_data = item_results[0]
            consultations_app.configurations.original_data = legacy_consultation_data 
            var WordProperties = {};			

            WordProperties["Office"] = legacy_consultation_data.Office;
            WordProperties["MazarsLetterHead"] = legacy_consultation_data.MazarsLetterHead;
            WordProperties["Client"] = legacy_consultation_data.Client;
            WordProperties["Footer"] = legacy_consultation_data.MazarsFooter;

            WordProperties["Priority"] = legacy_consultation_data.Priority;
            WordProperties["YearEnd"] = legacy_consultation_data.Year_x0020_End;

            WordProperties["ChargeCode"] = legacy_consultation_data.ChargeCode;
            WordProperties["DeadlineDate"] = legacy_consultation_data.DeadlineDate;
            WordProperties["ListedCompany"] = legacy_consultation_data.ListedCompany;
            WordProperties["Category"] = legacy_consultation_data.Category;	       

            consultations_app.configurations.legacy_word_template_data = WordProperties
        });    
  
}
