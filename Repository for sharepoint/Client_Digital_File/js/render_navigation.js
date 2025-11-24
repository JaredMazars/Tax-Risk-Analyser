let render_navigation = {}


/*   
    Handles how the navigation is rendered and structured 
    This is like a dependancy library - nothing to edit here

*/
$(document).on('click', '.menu-and-logo .menu', function(){
    let menu_icon = $(".menu-and-logo  .menu-icon");

    if(menu_icon.hasClass("ms-Icon--CollapseMenu")){	
        menu_icon.toggleClass("ms-Icon--CollapseMenu ms-Icon--AddNotes");   	
        $(".navigation-panel").addClass("collapse");
        $(".form-canvas-section").addClass("expand-canvas");
    } else {	
        menu_icon.toggleClass("ms-Icon--AddNotes ms-Icon--CollapseMenu");   	
        $(".navigation-panel").removeClass("collapse");	
        $(".form-canvas-section").removeClass("expand-canvas")	
    }

    render_navigation.calculate_canvas_width();
})

$(document).on("click",".stick-left-navigation-items li.top-level-nav",function(){
    //reset the header html
    $(".page-section-header").html(null);
    

    let currently_selected_item = parseInt($(this).attr("data-navigation-index"))   
    render_navigation.render_full_nav_tree([currently_selected_item],$(this));  

    let currently_selected_item_name = $(this).attr("title")

    $(".stick-left-navigation-items li").removeClass("top-level-nav-selected")	
    $(this).addClass("top-level-nav-selected");
    $(".navigation-panel").removeClass("collapse");	
    $(".form-canvas-section").removeClass("expand-canvas");

    $(".navigation-panel-header").html(currently_selected_item_name);
    $(".page-section").attr("app-name",currently_selected_item_name);
});

$(document).on("click",".navigation-panel-list-items li.panel-navigation-item",function(){  

    render_navigation.render_by_link_click($(this))
});

$(document).on("click",".form-canvas-section .bread-crumb .bread-crumb-item",function(){  
   
    let get_bread_crumb_history = $(this).attr("data-tree-navigation");
    //double click it
    $(".navigation-panel-list-items .panel-navigation-item[data-link-id='"+get_bread_crumb_history+"']").click();
    $(".navigation-panel-list-items .panel-navigation-item[data-link-id='"+get_bread_crumb_history+"']").click();
});


render_navigation.show_section = function(section_name){
    //hide all sections
    $(".page-section-form-container").addClass("hide"); 
    //display section based on name
    $("#field_section_container div[form-navigation-target='"+section_name+"']").removeClass("hide");
}

render_navigation.calculate_canvas_width = function(){
    
    //reset the canvas
    $("#main-canvas-container").removeClass("col-5");
    $("#main-canvas-container").removeClass("col-6");
    $("#main-canvas-container").removeClass("col-8");
    $("#main-canvas-container").removeClass("col-10");
    $("#main-canvas-container").removeClass("col-11");

    let comments_section_status = "open";
    let navigation_panel_status = "";

    let canvas_calculation = 12;
    let navigation_calculation = 4;
    let comments_calculation = 3;
    //check which sections are open
    if($(".right-help-comments-section-panel").hasClass("hide")){
        comments_section_status = "closed"
        comments_calculation = 0;
    }

    //check which sections are open
    if($("#navigation-panel").hasClass("collapse")){
        navigation_panel_status = "closed"
        navigation_calculation = 1
    }

    canvas_calculation = canvas_calculation - navigation_calculation - comments_calculation

    $("#main-canvas-container").addClass("col-"+canvas_calculation);
}

render_navigation.render_by_link_click = function(list_item_element){

     //reset the header html
     $(".page-section-header").html(null);    
     render_navigation.toggle_navigation_sub_links(list_item_element)  
     render_navigation.render_breadcrumb(list_item_element);
     //renders a form or a static page
     render_navigation.render_page_features(list_item_element);
}

render_navigation.toggle_navigation_sub_links = function(current_element){

    //this handles the hiding and showing of sections

    if(current_element.hasClass("currently-open")){
         //then close the structure
         current_element.next("ul").addClass("hide");
         //we change the icon out
         //current_element.find("i").removeClass("ms-Icon--ChevronDown").addClass("ms-Icon--ChevronRightMed");
         current_element.find("i").removeClass("ms-Icon--ChevronDown").addClass("ms-Icon--ChevronRightMed");
         current_element.removeClass("currently-open"); 

    }else{
        //just open it
        $(".panel-navigation-item").removeClass("currently-open");
        current_element.addClass("currently-open"); 
        current_element.next("ul").removeClass("hide");
        //we change the icon out
        current_element.find("i").removeClass("ms-Icon--ChevronRightMed").addClass("ms-Icon--ChevronDown");
    }   
}

render_navigation.render_breadcrumb = function(current_element){

    //read the history cube
    let bread_crumb_array = JSON.parse(current_element.attr("data-bread-crumb-history"));
    //render breadcrumb
    render_navigation.create_bread_crumb(bread_crumb_array);
}


render_navigation.render_side_nav = function(navigation_set){

   //this happens on page load
    let processing_navigation_set = navigation_set;
    let stick_left_navigation_html = "<ul id='Left-sticky-menu' class='stick-left-navigation-items'>";

    for (let index = 0; index < processing_navigation_set.length; index++) {
        const nav_item = processing_navigation_set[index];

        //lets start processing the sticky left nav with icons
        stick_left_navigation_html += 
        `
            <li data-navigation-index='${index}' data-history-index='${JSON.stringify([index])}' class='nav-icon top-level-nav' title='${nav_item.title}'><i class='ms-Icon ms-Icon--${nav_item.icon}'></i></li>
        `        
    }
    stick_left_navigation_html += '</ul>';

    $(".sticky-left-navigation").html(stick_left_navigation_html);
    //remove spinner
    return true    
}

render_navigation.render_full_nav_tree = function(tree_history_json){
   
    let global_navigation = navigation_cube.navigation_set;  
    let canvas =  $(".page-section");
   
    let selected_link_index = tree_history_json[0];

    if(global_navigation[selected_link_index].sub_links){
        navigation_tree_html = render_navigation.render_navigation_tree(
            global_navigation[selected_link_index].sub_links,
            global_navigation[selected_link_index].title,
            selected_link_index
        );
    }    

    let current_selected_item = global_navigation[selected_link_index];

    if(current_selected_item.data_type){
        switch(current_selected_item.data_type){

            case "static_page":
                render_navigation.render_help_file(canvas,current_selected_item.form_data);                
            break;            
        }
    } 

    $(".navigation-panel-list-items").html(navigation_tree_html);    
   
}


render_navigation.render_navigation_tree = function(list_of_sub_links,bread_crumb_selection,side_panel_index){

    let tree_structure = `<ul class='tree-group' data-tree-level='second-level-navigation' data-app-name='${bread_crumb_selection}'>`;    
 
    for (let second_index = 0; second_index < list_of_sub_links.length; second_index++) {      
                
            const second_nav_item = list_of_sub_links[second_index]

            tree_structure += render_navigation.create_tree_html(
                    second_index,
                    second_nav_item,
                    "second-level-navigation",
                    [side_panel_index,second_index],
                    [bread_crumb_selection,second_nav_item.title]
                )

            //check for third level sub links
            if(render_navigation.validate_sub_link(second_nav_item)){

                tree_structure += `<ul class='tree-group hide' data-tree-level='third-level-navigation'>`; 

                for (let third_index = 0; third_index < second_nav_item.sub_links.length; third_index++) {
                    const third_nav_item = second_nav_item.sub_links[third_index];
                    
                    tree_structure += render_navigation.create_tree_html(
                            third_index,
                            third_nav_item,
                            "third-level-navigation",
                            [side_panel_index,second_index,third_index],
                            [bread_crumb_selection,second_nav_item.title,third_nav_item.title]
                        );
                    //check for fourth level sub links
                    if(render_navigation.validate_sub_link(third_nav_item)){

                        tree_structure += `<ul class='tree-group hide' data-tree-level='fourth-level-navigation'>`; 

                        for (let fourth_index = 0; fourth_index < third_nav_item.sub_links.length; fourth_index++) {
                            const fourth_nav_item = third_nav_item.sub_links[fourth_index];                                        

                            tree_structure += render_navigation.create_tree_html(
                                fourth_index,
                                fourth_nav_item,
                                "fourth-level-navigation",
                                [side_panel_index,second_index,third_index,fourth_index],
                                [bread_crumb_selection,second_nav_item.title,third_nav_item.title,fourth_nav_item.title]
                            );

                            //check for fifth sub link
                            if(render_navigation.validate_sub_link(fourth_nav_item)){

                                tree_structure += `<ul class='tree-group hide' data-tree-level='fifth-level-navigation'>`; 

                                for (let fifth_index = 0; fifth_index < fourth_nav_item.sub_links.length; fifth_index++) {
                                    const fifth_nav_item = fourth_nav_item.sub_links[fifth_index];                                   

                                        tree_structure += render_navigation.create_tree_html(
                                            fifth_index,
                                            fifth_nav_item,
                                            "fifth-level-navigation",
                                            [side_panel_index,second_index,third_index,fourth_index,fifth_index],
                                            [bread_crumb_selection,second_nav_item.title,third_nav_item.title,fourth_nav_item.title,fifth_nav_item.title]
                                    );
                                }

                                tree_structure += "</ul>";

                            }
                        }

                        tree_structure += "</ul>";
                    }
                }

                tree_structure += "</ul>";
            }
    }

    tree_structure += "</ul>";

    return tree_structure

}

render_navigation.validate_sub_link = function(row_item){

    let is_valid = false;

    if(row_item){
        if(row_item.sub_links){
            if(row_item.sub_links.length > 0){
                is_valid = true;
            }
        }
    }

    return is_valid
}

render_navigation.create_tree_html = function(index,row_item,navigation_pointer,history_index,create_bread_crumb_array){

    let row_item_html = "";

    if(row_item){

        if(row_item.sub_links){
            
            row_item_html += 
            `
                <li class='list-item panel-navigation-item ${navigation_pointer}' data-bread-crumb-history='${JSON.stringify(create_bread_crumb_array)}' 
                    data-history-index='${JSON.stringify(history_index)}' 
                    data-navigation-index='${index}' 
                    data-link-id='${row_item.title}'>
                    <div class="navigation-item-title-group"><i class='ms-Icon ms-Icon--ChevronRightMed'></i><span>${row_item.title}</span></div>
                </li>
            ` 
        }else{
            //not icon needed
            row_item_html += 
            `
                <li class='list-item panel-navigation-item ${navigation_pointer}' data-bread-crumb-history='${JSON.stringify(create_bread_crumb_array)}' 
                    data-history-index='${JSON.stringify(history_index)}' 
                    data-navigation-index='${index}' 
                    data-link-id='${row_item.title}'>
                    
                    <div class="navigation-item-title-group"><span>${row_item.title}</span></div>
                </li>
            ` 
        }
         
    }

    return row_item_html
}


render_navigation.render_page_features = function(current_element){

    let canvas =  $(".page-section");   
    
    // render the form data
    let get_tree_history = JSON.parse(current_element.attr("data-history-index"));
    let tree_properties = render_navigation.find_tree_position(get_tree_history);
    let current_tree_position = tree_properties.current_position;

    if(current_tree_position.data_type){
        switch(current_tree_position.data_type){
          
            case "static_page":
                 //show loader and hide the rendering
                canvas.addClass("hide");
                $(".page-loader-header").removeClass("hide");
                render_navigation.render_help_file(canvas,current_tree_position.form_data);    
                setTimeout(function(){
                    canvas.removeClass("hide");
                    $(".page-loader-header").addClass("hide");
                },1000);                            
            break;

            case "next_link_selection":
                //get the first child link to link
                if(current_tree_position.sub_links){   
                    setTimeout(() => { 

                       $("#myList li[data-history-index='["+get_tree_history+",0]']").click();

                    }, 150);                    
                   
                }                                            
            break;   
            
            case "href":
                    window.open(current_tree_position.href,"_blank")
            break
        }
    }    
}

render_navigation.find_tree_position = function(history_index){

    let tree_properties = {
        "first_position":[],
        "second_position":[],
        "third_position":[],
        "fourth_position":[],
        "fifth_position":[],
        "current_position":[]
    }

    switch(history_index.length){

        case 1:
            tree_properties.first_position = navigation_cube.navigation_set[history_index[0]];

            tree_properties.current_position = tree_properties.first_position
        break;
        case 2:
            tree_properties.first_position = navigation_cube.navigation_set[history_index[0]];
            tree_properties.second_position = tree_properties.first_position.sub_links[history_index[1]];

            tree_properties.current_position = tree_properties.second_position
        break;
        case 3:
            tree_properties.first_position = navigation_cube.navigation_set[history_index[0]];
            tree_properties.second_position = tree_properties.first_position.sub_links[history_index[1]];
            tree_properties.third_position = tree_properties.second_position.sub_links[history_index[2]];         

            tree_properties.current_position = tree_properties.third_position
        break;
        case 4:
            tree_properties.first_position = navigation_cube.navigation_set[history_index[0]];
            tree_properties.second_position = tree_properties.first_position.sub_links[history_index[1]];
            tree_properties.third_position = tree_properties.second_position.sub_links[history_index[2]];
            tree_properties.fourth_position = tree_properties.third_position.sub_links[history_index[3]];

            tree_properties.current_position = tree_properties.fourth_position
        break;
        case 5:
            tree_properties.first_position = navigation_cube.navigation_set[history_index[0]];
            tree_properties.second_position = tree_properties.first_position.sub_links[history_index[1]];
            tree_properties.third_position = tree_properties.second_position.sub_links[history_index[2]];
            tree_properties.fourth_position = tree_properties.third_position.sub_links[history_index[3]];
            tree_properties.fifth_position = tree_properties.fourth_position.sub_links[history_index[4]];

            tree_properties.current_position = tree_properties.fifth_position
        break;    
    }    

    return tree_properties

}

render_navigation.create_bread_crumb = function(bread_crumb_history){
    
    let bread_crumb_slug = "";  

    for (let index = 0; index < bread_crumb_history.length; index++) {  
        
        bread_crumb_item = bread_crumb_history[index]
        if(bread_crumb_item){
            if(index == bread_crumb_history.length - 1){
                bread_crumb_slug += `<span class='bread-crumb-item last-item' data-tree-navigation='${bread_crumb_item}'>${bread_crumb_item}</span>`
            }else{
                bread_crumb_slug += `<span class='bread-crumb-item' data-tree-navigation='${bread_crumb_item}'>${bread_crumb_item} / </span>`
            }   
        }     
    }

    $(".bread-crumb").html(bread_crumb_slug);
} 

render_navigation.render_help_file = function(canvas_element,help_file_identifier){

    let get_help_file_data = sharepoint_utilities.get_list_items_by_title(
        app_configuration.site_context, 
        "Id,HelpTextHtml, OrderBy",
        "Title eq '"+help_file_identifier +"'",
        app_configuration.help_file_list_name,
        "OrderBy asc"
    )

    $.when(get_help_file_data).done(function(help_results){

        let help_file_text = "";

        for (let index = 0; index < help_results.length; index++) {
            const element = help_results[index];
            help_file_text += element.HelpTextHtml
        }
        canvas_element.html(
            help_file_text +            
            "<div id='additional-component-placeholders' data-section-type='"+help_file_identifier+"'></div>"
        );
    })
    

}


