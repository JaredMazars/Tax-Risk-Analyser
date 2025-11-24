let save_sections = {}

$(document).on("click",".save-current-section",function(){

    save_sections.save_button();     
    //updates validation comments etc in the right panel
    client_risk_approvals.validation_on_all_fields();    

});

save_sections.save_button = async function(){

    //find the selected form type;
    let currently_selected_app = $("#Left-sticky-menu").find("li.top-level-nav-selected").attr("title");

    save_sections.refresh_context_token = sharepoint_utilities.RefreshDigest(app_configuration.site_context)
    
    //applly the save feature for that app
    switch(currently_selected_app){

            case "Client Acceptance and Continuance":
                 //let get_current_selected_item = app_configuration["currently-selected-section"];                 
                 //client_risk_assesments.identify_sections_to_update(get_current_selected_item);

                //this must be a save all button not just for the section
                sharepoint_utilities.render_notification
                (                
                    "Saving all sections",
                    "Please wait while we save all the sections in this form",
                    "Info"
                )
                let save_all_sections = save_sections.get_all_sections("Client Acceptance and Continuance")
              
                //save_all_sections = ["Team Information"]
                for (let index = 0; index < save_all_sections.length; index++) {
                    const section_to_update = save_all_sections[index];   
                    client_risk_assesments.identify_sections_to_update($("li[data-link-id='"+section_to_update+"']"),false);
                    //this stops the conflic of updating items too quickly
                    await delay_updates(500);
                }
                 
           
            break;

            case "Lockdown":
                sharepoint_utilities.render_notification("Saving Form","Please wait while we save your form","Info");
                lockdown.update_current_section_data();
            break;
    }

    function delay_updates(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

save_sections.get_all_sections = function(data_app_name){

    let get_all_sections_to_save = [];

    //like top level items etc
    let exclusion_sections = 
    [
        "Client Continuance","Client Acceptance","Client Information","Appendix A Clients",
        "Appendix B Engagements","Appendix C Money Laundering","Appendix D",
    ]

    $(".navigation-panel-list-items ul[data-app-name='"+data_app_name+"'] li[data-link-id]").each(function(){

        let get_setion_name = $(this).attr("data-link-id")
        //exclude certain sections like the headings
        if(exclusion_sections.indexOf(get_setion_name) == -1){
            get_all_sections_to_save.push($(this).attr("data-link-id"));
        }
    });

    return get_all_sections_to_save
}

save_sections.has_data = function(payload){

    let contains_data = true;
    let check = JSON.stringify(payload);
    if(check.length == 2){
        contains_data = false;
    }

    return contains_data
}

save_sections.update_data_source = function(data_source_item_id,section_name,list_name,include_notifications){

    let get_meta_package = sharepoint_utilities.create_meta_package($("div[form-navigation-target='"+section_name+"'] > div"));

    if(data_source_item_id){       

        if(save_sections.has_data(get_meta_package.meta_package)){

             //check for a null not required multi select people picker
            if(get_meta_package.meta_package["AppendixDEngagagementPartnersId"] == "#;"){
                delete get_meta_package.meta_package["AppendixDEngagagementPartnersId"];
            }



            //update the current secction
            $.when(save_sections.update_item_custom(
                list_name,
                app_configuration.site_context,
                get_meta_package.meta_package,
                parseInt(data_source_item_id),
                include_notifications
                ))
            .done(function(response){                    
                //auto close the window
                if(response == "success"){

                    if(include_notifications){
                        warning_controller.add_new_warning(section_name + "form Updated","Your current working form was updated","Info");   
                    }             
                            
                }else{
                    warning_controller.add_new_warning("EQR Form Updated","Something went wrong while updating your form","Warning");
                    //sharepoint_utilities.render_notification("Error","Something went wrong while updating your form","Warning");
                }            
            });     
        }else{
            //console.log("Nothing to save in " + section_name + ". Nothing has been selected yet")
        }
    }else{
        warning_controller.add_new_warning(section_name + "form id not found","The form was not updated","Warning");   
    }
}

save_sections.update_item_custom = function(sp_list_name,sp_list_url,meta_package,item_id,include_notifications){

	var Promise = $.Deferred();

	//used for pre authentication and refreshing of the bearer token
	$.when(sp_custom_auth.get_bearer_token()).done(function(response_token){  

		let headers  = { 
			"content-type": "application/json;odata=nometadata",
			"accept": "application/json;odata=nometadata",			     
			"IF-MATCH": "*",
			"X-HTTP-METHOD":"MERGE"
		}		
		if(response_token){
			headers["Authorization"] = "Bearer " + response_token;
		}else{

            //if this is not a bulk update
            if(include_notifications){
                headers["X-RequestDigest"] =  sharepoint_utilities.RefreshDigest(app_configuration.site_context);
            }else{
                headers["X-RequestDigest"] =  save_sections.refresh_context_token;
            }			
		}
       
		$.ajax
		({
			// _spPageContextInfo.webAbsoluteUrl - will give absolute URL of the site where you are running the code.
			// You can replace this with other site URL where you want to apply the function
			url: sp_list_url + "/_api/web/lists/getByTitle('"+sp_list_name+"')/items("+item_id+")",
			type: "POST",
			headers:headers,
			data: JSON.stringify(meta_package),
			success: function (data, status, xhr) {

				Promise.resolve("success");
			},
			error: function (xhr, status, error) {
			//display failure message
			console.log("Error updating item");
			console.log(meta_package);
			Promise.resolve("failed");
			sharepoint_utilities.render_notification("Error saving item",xhr.responseJSON["odata.error"].message.value,"error");	

			}
		});

	});

	return Promise.promise()
}