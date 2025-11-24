let main = {}

$(document).ready(async function(){

    client_section_functions.render_client_lookup();

    navigation_cube.navigation_set.push(view_dashboard_navigation);
    //display modules based on the configuration
    if(app_configuration.display_bd_module){
        navigation_cube.navigation_set.push(bd_navigation)
    }
    if(app_configuration.display_client_risk_assesment_module){        
        navigation_cube.navigation_set.push(client_risk_assessment)
    }
    if(app_configuration.display_lockdown_module){
        navigation_cube.navigation_set.push(lockdown_navigation)
    }   
    if(app_configuration.display_consultation_module){
        navigation_cube.navigation_set.push(consultations_navigation);
    }
    if(app_configuration.display_client_listening_programme_module){
        let render_clp_navigation = clp_base_navigation

        let permission_properties = await clp_app_main.check_clp_permissions();   

        app_configuration.is_clp_admin = permission_properties.admin
        app_configuration.is_pa_admin = permission_properties.pa_admin
        app_configuration.pa_admin_filter = permission_properties.pa_admin_filter

        if(permission_properties.admin){render_clp_navigation.sub_links[0].sub_links.push({"title":"Removal Requests"});}
        navigation_cube.navigation_set.push(render_clp_navigation)        
    }

    render_navigation.render_side_nav(navigation_cube.navigation_set);    
    $("#Left-sticky-menu li[title='View dashboard']").click();
    $(".version-column").html("v1.3.4.1");
    main.handle_parameter_forms();
});


main.handle_parameter_forms = function(){

    //check if the email link has been used already for this session - stops a page refresh from using the parameters
    let check_if_link_was_used = sessionStorage.getItem("link_used");

    if(check_if_link_was_used != "true"){
        let app_name = sharepoint_utilities.getParameterByName("app_name");
        let form_reference = sharepoint_utilities.getParameterByName("cdfid");
        let ac_type = sharepoint_utilities.getParameterByName("acceptance_or_continuance");

        let request_meta= {
            "item_id":form_reference,
            "data_source_type":"v2",
            "acceptance_or_continuance":ac_type
        }
        switch(app_name){
            case "lockdown":

                $("#Left-sticky-menu li[title='Lockdown']").click();                  
                lockdown.render_data_from_email(request_meta);
            break;

            case "client-risk-assesments":

                main["system_click"] = true;
                $("#Left-sticky-menu li[title='Client Acceptance and Continuance']").click();                   
                client_risk_assesments.render_data_from_email(request_meta);
            break;  
            
            case "consultation-feedback":

                main["system_click"] = true;                               
                consultations_app.render_data_from_email(request_meta);

            break; 

            case "clp":

                main["system_click"] = true;                               
                clp_app_main.render_data_from_email(request_meta);

            break; 
        }
        sessionStorage.setItem("link_used", "true");
    }
    
}

main.clean_client_name = function(client_name){

    let clean_client_name = sharepoint_utilities.fixedEncodeURIComponent(client_name);

    //remove consecutive strings
    clean_client_name = clean_client_name.split("%28").filter(Boolean).join("%28");
    clean_client_name = clean_client_name.split("%29").filter(Boolean).join("%29");  

    return clean_client_name

}

main.render_help_panel = function(category){

    //get list of items

    let get_list_items = sharepoint_utilities.get_list_items_by_title
        (
            app_configuration.site_context, 
            "*",
            "Category eq '"+category+"'",
            app_configuration.help_pop_up_lists,
            "HelpOrder desc"
        )
    $.when(get_list_items).
        done(function(item_results){

            let table_html =
            `
                <table id='${category}-help-table' class='dataTable'>
                    <thead>
                        <tr>
                            <td>Area</td>
                            <td>Description</td>
                        </tr>
                    <thead>
                    <tbody style='vertical-align:top;'>                 
            `    
            //logic with results
            for (let index = 0; index < item_results.length; index++) {
                const item_row = item_results[index];          
                
                //render list of items
                table_html +=
                `
                    <tr>
                        <td>${item_row.Title}</td>
                        <td>${item_row.HelpDescription}</td>
                    </tr>                
                `
            }

            table_html +=
            `
                    </tbody>
                </table>            
            `
            //show in mode
            sharepoint_utilities.render_confirmation_box("Additional Guidance",table_html,{},"70%");
        });
}

main.create_form_sections = function(array_of_sections){

    let section_html = "<div id='field_section_container'>";
    for (let index = 0; index < array_of_sections.length; index++) {
        const section = array_of_sections[index];

        section_html +=
        `
            <div form-navigation-target='${section}' class='page-section-form-container hide'></div>
        `        
    }
    section_html += "</div>"
    return section_html
}


main.add_loader = function(){

    let canvas =  $(".page-section");  
    canvas.addClass("hide");
    $(".page-loader-header").removeClass("hide");

}

main.remove_loader = function(){
    let canvas =  $(".page-section");  
    canvas.removeClass("hide");
    $(".page-loader-header").addClass("hide");
}

main.render_form_reference_number = function(reference_details){

    let reference_id = "<div class='reference-id client-reference-id'>" + reference_details + "</div>";
    //set the reference
    $(".header-right-container-container").html(reference_id);
}