let warning_controller = {}

$(document).on("click",".warnings-section i",function(){
    //open up the menu  
    if($(".right-help-comments-section-panel").hasClass("hide")){
        $(".right-help-comments-section-panel").removeClass("hide");     
        
    }else{
        $(".right-help-comments-section-panel").addClass("hide");            
    }

    if (!$(".right-help-comments-section-panel").hasClass("hide")) {
        // Open up the menu
        $(".right-help-comment-tabs-container ul li[data-target-id='1']").click();

        // Display warnings
        warning_controller.display_warnings();
    }

    render_navigation.calculate_canvas_width();

});

$(document).on("click",".right-help-comment-tabs-container ul li[data-target-id='1']",function(){


    warning_controller.display_warnings();  
    $(".right-help-comment-tabs-container ul li").removeClass("selected-btn");
    $(this).addClass("selected-btn");
    $(".ms-Icon--FileComment").removeClass("ms-Icon--FileComment").addClass("ms-Icon--AlertSettings");
    

});

$(document).on("click",".right-help-comment-tabs-container ul li[data-target-id='2']",function(){  
    warning_controller.display_validation_warnings();
    $(".right-help-comment-tabs-container ul li").removeClass("selected-btn");
    $(this).addClass("selected-btn");
    $(".ms-Icon--FileComment").removeClass("ms-Icon--FileComment").addClass("ms-Icon--AlertSettings");
});


$(document).on("click",".right-help-comments-content ul li[data-section-name-id]",function(){  
    
    warning_controller.go_to_page_section($(this).attr("data-section-name-id"));    

});



warning_controller.go_to_page_section = function(section_name){

    //check that the parent section is open
    let history_index = JSON.parse($(".navigation-panel-list-items li[data-link-id='"+section_name+"']").attr("data-history-index"));  
    let get_slug = history_index.slice(0, -1).toString();
    $(".panel-navigation-item[data-history-index='["+get_slug+"]']").click();  

    app_configuration["previous-selected-section"] = app_configuration["currently-selected-section"];
    app_configuration["currently-selected-section"] = $(".navigation-panel-list-items li[data-link-id='"+section_name+"']")

    setTimeout(function(){
        $(".navigation-panel-list-items li[data-link-id='"+section_name+"']").click();
    },400)
    
}

warning_controller.display_warnings = function(){

    let get_warnings = warning_controller["warning_cache"]
    let warnings_list_html = "<ul>";
    $(".warnings-section i").removeClass("has-warnings");   

    if(get_warnings){
        for (let index = 0; index < get_warnings.length; index++) {
            const warning_row = get_warnings[index];
            warnings_list_html +=
            `
                <li>
                    <div class='warning-item'>
                        <strong>${warning_row.title}</strong><br/>
                        ${warning_row.description}
                    </div>
                </li>
            `
        }
        if(get_warnings.length > 0){
            $(".warnings-section i").addClass("has-warnings");        
        }
    }
    warnings_list_html += "</ul>";
    $(".right-help-comments-content").html(warnings_list_html);    
};

warning_controller.display_validation_warnings = function(){

    let get_warning_validation_cache = warning_controller["warning_validation_cache"];

    let warnings_list_html = "<ul>";
    if(get_warning_validation_cache){
        for (let index = 0; index < get_warning_validation_cache.length; index++) {
            const warning_row = get_warning_validation_cache[index];
            warnings_list_html +=
            `
                <li data-section-name-id='${warning_row.title}'>
                    <div class='warning-item'>                   
                        ${warning_row.description}                
                    </div>
                </li>
            `
        }
    }else{
        get_warning_validation_cache = [];
    }
    warnings_list_html += "</ul>";
    $(".right-help-comments-content").html(warnings_list_html);

    $(".warnings-section i").removeClass("has-warnings");      
    if(get_warning_validation_cache.length > 0){
        $(".warnings-section i").addClass("has-warnings"); 
    }
};


warning_controller.add_new_validation_warning = function(title,description,type){

    let warning_validation_cache = [];  
    if(warning_controller["warning_validation_cache"]){
        warning_validation_cache = warning_controller["warning_validation_cache"]
    }
    let warning_meta = {
        "title":title,
        "description":description,
        "type":type
    }    
    warning_validation_cache.push(warning_meta);
    warning_controller["warning_validation_cache"] = warning_validation_cache

};

warning_controller.add_new_warning = function(title,description,type){

    let warning_cache = warning_controller["warning_cache"];

    let warning_meta = {
        "title":title,
        "description":description,
        "type":type
    }

    let duplicate_warning = false;

    if(warning_cache){
        for (let index = 0; index < warning_cache.length; index++) {
            const warning_row = warning_cache[index];
            if(warning_row.description == description && warning_row.title == title){
                duplicate_warning = true;
                break;
            }
        }
    }else{
        warning_cache = [];
    }

    if(!duplicate_warning){
        warning_cache.push(warning_meta)
    }
    warning_controller["warning_cache"] = warning_cache
};

warning_controller.remove_warning = function(title,description,type){

    let warning_cache = warning_controller["warning_cache"];
    let new_warning_cache = []

    if(warning_cache){
        for (let index = 0; index < warning_cache.length; index++) {
            const warning_row = warning_cache[index];

            if(warning_row.description == description && warning_row.title == title){
                new_warning_cache = warning_cache.splice(index,1);
                break;
            }
        }
    }
    warning_controller["warning_cache"] = new_warning_cache
};

