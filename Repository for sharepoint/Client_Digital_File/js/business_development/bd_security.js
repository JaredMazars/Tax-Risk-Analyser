let bd_security = {}

bd_security.apply_role_security = function(){

    //identifies if you can add others
    //otherwise the task allocation security validates if you are the approver for the task - which makes is easy -
    // and will stop anyone from approving tasks that are not assigned to them

    let field_properties = sharepoint_utilities.get_field_values(["RoleDetails","RoleReferenceId"]).meta_package;    
    
    let approval_buttons = 
    [
        "sp-button-approve-and-start-allocation",
        "sp-button-next-to-internally-captured",
        "sp-button-approve-and-start-evaluation"
    ]
    let allocation_buttons = ["sp-button-add-new"];
    //find the current logged in users role and level
    let team_members = JSON.parse(field_properties.RoleDetails);
   
    let list_of_role_permissions = [];

    for (let index = 0; index < team_members.length; index++) {
        const team_member_row = team_members[index];        
        if(team_member_row.user_id == _spPageContextInfo.userId){
            list_of_role_permissions.push(team_member_row.role_permission_id)
        }
    }

    if(list_of_role_permissions.indexOf(1) >=0 || list_of_role_permissions.indexOf(4) >=0){
        //if this is the approver role      
        sharepoint_utilities.show_fields(allocation_buttons);
        $("bd-allocation-team-members tbody tr td i.remove-user").removeClass("hide");

    }else{   
        sharepoint_utilities.hide_fields(allocation_buttons);
        $("bd-allocation-team-members tbody tr td i.remove-user").addClass("hide");
    }  
}


bd_security.create_allocation_table = function(list_of_team_members,field_container_element,render_type){

    let table_html =
    `
        <table id='bd-allocation-team-members-table' class=''>
            <thead>
                <tr>
                    <th>Team Member</th>
                    <th>Member's Role</th>
                    <th>Role Type</th>
    `

    if(render_type != "preview"){
        table_html += `<th>Remove</th>`
    }

    table_html +=
    `                                      
                </tr>
            </thead>
            <tbody>
    `
     //parse the role details field 
     if(list_of_team_members.length > 0){   
    
            for (let index = 0; index < list_of_team_members.length; index++) {
                const role_row = list_of_team_members[index];
                
                table_html +=
                `
                    <tr
                        data-attr-role-id='${role_row.role_id}' 
                        data-attr-bd-user-id='${role_row.user_id}'
                        data-attr-bd-user-name='${role_row.display_name}'
                        data-attr-bd-id='${index}'
                    >
                        <td>${role_row.display_name}</td>
                        <td>${role_row.role_name}</td>   
                        <td>${role_row.role_permission_name}</td> 
                `
                if(render_type != "preview"){
                    table_html += 
                    `
                        <td class=>
                            <i class='menu-icon ms-Icon ms-Icon--Delete remove-user' title='Remove Team Member'></i>                        
                        </td>
                    `
                }                    
                table_html +=
                `       
                    </tr>
                `             
        }                
    }  
 
    table_html +=
    `
            </tbody>
        </table>
    `
 
    field_container_element.html(table_html) 
    field_container_element.find("#bd-allocation-team-members-table").dataTable({searching: false, paging: false, info: false}); 
    
}

// Render Allocation's Team Members Table
bd_security.render_bd_allocation_team_members_table = function(list_of_team_members){

    bd_security.create_allocation_table(
        list_of_team_members, 
        $("div[sp-field-name='bd-allocation-team-members-table-placeholder'] .field-component"),
        "applied"
    )
    bd_security.apply_role_security();       
 }

// Add Team Member
/*
    {
        "role_name":role_name,
        "display_name":approver_name,
        "email":row_data["sp-temp-assigned-approver"],
        "user_id":user_id,                    
        "role_name":role_name,           
        "role_id":row_data["sp-temp-assigned-role"],
        "role_permission_id":row_data["sp-temp-assigned-permission-level"],
        "role_permission_name":permission_name
    }
*/

//creates members id in the role reference field
//Also saves the role details to the field
bd_security.add_team_member = function(list_of_team_members){
   
    let new_role_reference_ids = "";
    if(list_of_team_members){
        for (let index = 0; index < list_of_team_members.length; index++) {
            const team_member_row = list_of_team_members[index];

            //create role reference id fields
            //check if the user has already been profiled for visibility
            if(new_role_reference_ids.indexOf(";" + team_member_row.user_id + ";") == -1){
                new_role_reference_ids += team_member_row.user_id + ";"
            }        
            
            if(index == 0){
                 new_role_reference_ids = ";" + team_member_row.user_id + ";"
            }
        }
    }          

    sharepoint_utilities.set_field_value("RoleReferenceId",new_role_reference_ids); 
    sharepoint_utilities.set_field_value("RoleDetails",JSON.stringify(list_of_team_members));      

    return {
        "new_role_reference_ids":new_role_reference_ids       
    }
    
}

// Remover Team Member
bd_security.remove_team_member = function(index_to_remove){

    let field_properties = sharepoint_utilities.get_field_values(["RoleDetails","RoleReferenceId"]).meta_package;      
    
    //get the current team roles data
    let role_details = JSON.parse(field_properties.RoleDetails);
    let team_member_details = role_details[index_to_remove];

    let new_role_reference_ids = field_properties.RoleReferenceId 
  
    //remove details from cube
    role_details.splice(parseInt(index_to_remove), 1);
    //then reset the new role references
    for (let index = 0; index < role_details.length; index++) {
        const role_row = role_details[index];

        if(new_role_reference_ids.indexOf(";" + role_row.user_id + ";") == -1){
            new_role_reference_ids += role_row.user_id + ";"
        }       
        
        if(index == 0){
             new_role_reference_ids = ";" + role_row.user_id + ";"
        }        
    }

    sharepoint_utilities.set_field_value("RoleDetails",JSON.stringify(role_details)); 
    sharepoint_utilities.set_field_value("RoleReferenceId",new_role_reference_ids); 

    return {
        "team_member_details":team_member_details,
        "new_role_reference_ids":new_role_reference_ids,
        "list_of_team_members":role_details
    }

}

bd_security.update_security_record = function(new_role_reference_ids,new_role_details){

    //if this is an validate json object array then stringifiy it
    if(!valid_stringified_object(new_role_details)){
        new_role_details = JSON.stringify(new_role_details);
    }
    let security_meta_package = {
        "RoleReferenceId":new_role_reference_ids,
        "RoleDetails":new_role_details
    } 

    let update_item = sharepoint_utilities.update_item 
    (
            app_configuration.bd_initiation,
            app_configuration.site_context,
            security_meta_package,
            app_configuration.form_reference_id
    )
    $.when(update_item)
        .done(function(results){
        
            //if this is an validate json object array then stringifiy it
            if(!valid_stringified_object(new_role_details)){
                new_role_details = JSON.stringify(new_role_details);
            }
            //update the cache
            main["selected_bd_data"][0].RoleDetails = new_role_details;
            main["selected_bd_data"][0].RoleReferenceId = new_role_reference_ids

    });


    function valid_stringified_object(json_string){
        if (typeof json_string!=="string"){
            return false;
        }
        try{
            var json = JSON.parse(json_string);
            return (typeof json === 'object');
        }
        catch (error){
            return false;
        }
    }

}