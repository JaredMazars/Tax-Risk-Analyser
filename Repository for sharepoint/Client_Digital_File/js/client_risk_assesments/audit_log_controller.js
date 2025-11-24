let audit_log_controller = {};

$(document).on("click",".right-help-comment-tabs-container ul li[data-target-id='4']",function(){
    //handles the audit log tab on the info panel

    audit_log_controller.display_audit_log(); 
    $(".right-help-comment-tabs-container ul li").removeClass("selected-btn");
    $(this).addClass("selected-btn");
    $(".ms-Icon--FileComment").removeClass("ms-Icon--FileComment").addClass("ms-Icon--AlertSettings");
    

});

audit_log_controller.display_audit_log = function(){

    //displays all general notification changes from the general notification list
    let get_current_app_name = $("#Left-sticky-menu li.top-level-nav-selected").attr("title");
    let list_name = "";
    let audit_log_filter = "";
    let field_description = "";
  

    switch(get_current_app_name){

        case "Business Development":
            list_name = app_configuration.bd_general_notifications
            audit_log_filter = "FormReferenceId eq '" + main["selected_bd_data"][0].Id + "'";          
        break;

        case "Client Acceptance and Continuance":
            list_name = app_configuration.ac_general_notifications;
            audit_log_filter = "AssociatedReferenceID eq '" + main["selected_client_risk_data"].Id + "'";         
        break;

        case "Lockdown":
            list_name = app_configuration.lockdown_general_notifications
            audit_log_filter = "AssociatedReferenceID eq '" + main["selected_lockdown_data"][0].Id + "'";            
        break;
    }

    let get_list_items = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "*,Author/Title,AssignedTo/Title&$expand=Author/Title,AssignedTo/Title",
            audit_log_filter,
            list_name,
            "Id desc"
        )
    $.when(get_list_items).
        done(function(item_results){
    
            //logic with results
            let audit_log_results = "<ul>";
            for (let index = 0; index < item_results.length; index++) {
           
                const audit_log_row = item_results[index];
               
                let notification_type = audit_log_row.NotificationType.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); })

                audit_log_results +=
                `
                    <li>
                        <div class='audit-log-item'>
                            <div class='title'>${audit_log_row.Title}</div>                     
                            <div class='notification-type'>${notification_type}</div>
                            <div class='author'>by ${audit_log_row.Author.Title} on ${moment(audit_log_row.created).format(app_configuration.display_date_format)}</div>
                        </div>
                    </li>
                `
            }

            audit_log_results += "</ul>";
            $(".right-help-comments-content").html(audit_log_results)
        });

}