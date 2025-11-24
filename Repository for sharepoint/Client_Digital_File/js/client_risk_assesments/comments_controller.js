let comments_controller = {}

//save the comments to the AC list
$(document).on("click","div[app-name='Client Acceptance and Continuance'] .add-new-comment-container i",function(){
   
    comments_controller.create_or_update_comments(main["selected_client_risk_data"],app_configuration.ac_comments_list_name);
});

//save the comments to the BD list
$(document).on("click","div[app-name='Business Development'] .add-new-comment-container i",function(){

    comments_controller.create_or_update_comments(main["selected_bd_data"],app_configuration.bd_comments_list_name);
});


//go to the section of the field when clicking on the comments
$(document).on("click",".right-help-comments-section-panel .right-help-comments-content li",function(){

    let sp_field_name = $(this).attr("data-sp-field-name");
    let find_field_in_section = $(".page-section").find("div[sp-field-name='"+sp_field_name+"']");

    let section_name = find_field_in_section.parentsUntil(".page-section-form-container").parent().attr("form-navigation-target");
    if(section_name){
        //check that the parent section is open
        let history_index = JSON.parse($(".navigation-panel-list-items li[data-link-id='"+section_name+"']").attr("data-history-index"));  
        let get_slug = history_index.slice(0, -1).toString();
        $(".panel-navigation-item[data-history-index='["+get_slug+"]']").click();

        $(".field-commenting-container").addClass("hide");
    
        setTimeout(function(){
            $(".navigation-panel-list-items li[data-link-id='"+section_name+"']").click();
            //click and auto open the comments box 
            
            setTimeout(function(){
                $("div[sp-field-name='"+sp_field_name+"']").find(".field-component-comment-icon-container i").click();
                //$("div[sp-field-name='"+sp_field_name+"']").get(0).scrollIntoView();
                $("#main-canvas-container").animate({
                    scrollTop: $("div[sp-field-name='"+sp_field_name+"']").offset().top
                }, 1000);
            
            },100)
        },200)
    }
})

//on click of the comments tab
$(document).on("click",".right-help-comment-tabs-container li[data-target-id='3']",function(){
    
    $(".right-help-comment-tabs-container ul li").removeClass("selected-btn");
    $(".right-help-comments-content ul").html(null);
    $(this).addClass("selected-btn");
    $(".ms-Icon--AlertSettings").removeClass("ms-Icon--AlertSettings").addClass("ms-Icon--FileComment");
     //render all comments from the cube

    let saved_comments = sharepoint_utilities.field_comments_list;
    let comments_html = "";
    
    if(saved_comments){
        for (let index = 0; index < saved_comments.length; index++) {
            const comments_row = saved_comments[index];

            if(comments_row.comments.length > 0){    
                
                last_comment_made = comments_row.comments[comments_row.comments.length -1]
                comments_html+=
                `
                    <li data-sp-field-name='${comments_row.field_name}'>
                        <div class='comments-item'>                   
                            <div class='comment-item'>	                                
                                <div class='comments-field-name'>${comments_row.field_name}</div>
                                <div class='comment'>${last_comment_made.comment}</div>	
                                <div class='comment-meta'>			
                                    <div class='comment-person' data-userId='${last_comment_made.userId}' data-userEmail='${last_comment_made.userEmail}'>${last_comment_made.userDisplayName}</div>
                                    <div class='comment-date'>${last_comment_made.date}</div>                                
                                </div>	

                            </div>	                                       
                        </div>
                    </li>
                `
            }
        }
    }
    $(".right-help-comments-content").html(comments_html);

    $(".ms-Icon--AlertSettings").removeClass("has-warnings");      
    if(saved_comments > 0){
        $(".ms-Icon--AlertSettings").addClass("has-warnings");        
    }
});

comments_controller.get_all_comments = function(form_reference_id,comments_list_name){

    if(form_reference_id){
        $.when(
            sharepoint_utilities.get_list_items_by_title(
                app_configuration.site_context, 
                "*",
                "FormReferenceId eq " + parseInt(form_reference_id),
                comments_list_name,
                "Id desc")
            )
        .done(function(comment_results){

            if(comment_results.length > 0){
                //update the global sharepoint obj that handles the comments
                sharepoint_utilities.field_comments_list = JSON.parse(comment_results[0].CommentsJSON);
                sharepoint_utilities.field_comments_list_Id = comment_results[0].Id
            }
        });
    }
}

comments_controller.create_or_update_comments = function(existing_data_cube,comment_list_name){


    if(existing_data_cube){
        //wait for all the other components to proecss
        setTimeout(function(){
            if(sharepoint_utilities.field_comments_list_Id){
                comments_controller.update_added_comments(sharepoint_utilities.field_comments_list_Id,comment_list_name)
            }else{
                //create new record Id
                comments_controller.save_added_comments(existing_data_cube.Id.toString(),comment_list_name);
            }
        },500); 
    }else{
        $("div[sp-additional-properties*='display-field-commenting']").find("div.comment-item").remove();
        sharepoint_utilities.render_notification("Error","Please create or save the form first before addings comments","Warning");
    }   
}

comments_controller.save_added_comments = function(form_reference_id,comments_list_name){

    if(form_reference_id){
        let meta_package = {
            "CommentsJSON": JSON.stringify(sharepoint_utilities.field_comments_list),
            "FormReferenceId":form_reference_id
        }
        sharepoint_utilities.save_item(
            comments_list_name,
            app_configuration.site_context,
            meta_package
        )
    }else{
        sharepoint_utilities.render_notification("Error","Please create or save the form first before addings comments","Warning");
    }
}

comments_controller.update_added_comments = function(form_reference_id,comments_list_name){

     //update the current secction
     $.when(sharepoint_utilities.update_item(
        comments_list_name,
        app_configuration.site_context,
        {
            "CommentsJSON": JSON.stringify(sharepoint_utilities.field_comments_list)
        },
        form_reference_id
        ))
    .done(function(response){                    
        //auto close the window
        if(response == "success"){
            //refresh the comments component
            $(".right-help-comment-tabs-container ul li[data-target-id='3']").click();            
        }         
    });   

}