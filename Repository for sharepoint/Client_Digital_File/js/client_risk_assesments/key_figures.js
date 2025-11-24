
//temp key figures logic until i can publish file with new extension

let key_figures = {}

//handles when the revenue fields are changed - just formats the numbers to thousand separators
$(document).on("change","#KeyFiguresJSON_table .repeating-section-input",function(){

    sharepoint_utilities.format_thousand_separators($(this).val(),$(this),",");
});

//handles when the revenue fields are changed - just formats the numbers to thousand separators
$(document).on("change","#FeeBudgetJSON_table .repeating-section-input",function(){

    sharepoint_utilities.format_thousand_separators($(this).val(),$(this),",");
});

//handles when the revenue fields are changed - just formats the numbers to thousand separators
$(document).on("change","#NonAssuranceFeesJSON_table .repeating-section-input",function(){

    sharepoint_utilities.format_thousand_separators($(this).val(),$(this),",");
});
