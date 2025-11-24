let client_section_functions = {};
client_section_functions = {
    "client_information_cube":[
        {
            "M_ClientCode":null
        }
    ]        
}

$(document).on("change","select[data-sp-element-name='search-client-details-name']",function(){

    client_section_functions.render_client_details($(this).val());
});

$(document).on("click",".navigation-panel-list-items li[data-history-index='[1,0]']",function(){

    client_section_functions.render_client_details(client_section_functions.client_information_cube[0].M_ClientCode);
});


let client_lookup_component = 
{    
     "client_drop_down": 
     [
         {
             "Title":"Client Name",
             "Description":"Please select your client name",
             "sp_field_name":"search-client-details-name",
             "sp_field_type":"select",
             "field_width":"half-width",
             "field_validate":true,
             "sp_additional_properties":"single-select-typeahead exclude-from-meta",
             "additional_filters":"",
             "drop_down_title_field":"M_ClientName",
             "drop_down_value_field":"M_ClientCode",
             "drop_down_order_by":"Title asc",
             "list_name":app_configuration.client_list_name,
             "site_context":app_configuration.client_list_site_context,
             "field_icon":"" 
         }
     ]
}

client_section_functions.render_client_lookup = function(){   
    
     //$(".group-action-buttons").html(sharepoint_utilities.create_container_form(client_lookup_component.client_drop_down,"client-drop-down form-basic"));    
     $(".header-search-box").html(sharepoint_utilities.create_container_form(client_lookup_component.client_drop_down,"client-drop-down form-basic"));    
     sharepoint_utilities.apply_form_plugins(client_lookup_component.client_drop_down);     
   
 }

client_section_functions.render_client_details = function(client_code){

    if(client_code){
        let get_client_details = sharepoint_utilities.get_list_items_by_title(
            app_configuration.client_list_site_context, 
            "*",
            "M_ClientCode eq '"+client_code+"'",
            app_configuration.client_list_name,
            ""
            )   
    
        $.when(get_client_details).done(function(client_data){

            $(".page-section").html(sharepoint_utilities.create_container_form(client_information_fields,"Client-Information-section"));    
            sharepoint_utilities.apply_form_plugins(client_information_fields);

            sharepoint_utilities.display_saved_list_fields(
                client_data,
                client_information_fields,
                ".Client-Information-section"
            );
            client_section_functions.client_information_cube = client_data;
        });
    }    
}

