var team_information_functions = {}

$(document).on("change","div[form-navigation-target='Team Information'] input[data-sp-element-name='eqrCalculator']",function(){
    // alert('seleted')
    //team_information_functions.run_eqr_rules();
})

$(document).on("change","div[form-navigation-target='Team Information'] input[data-sp-element-name='SpecialistsRequired']",function(){

    team_information_functions.run_specialist_rules();
});

team_information_functions.run_general_rules = function(){
    
    //team_information_functions.run_eqr_rules();
    team_information_functions.run_specialist_rules(); 
}


team_information_functions.run_specialist_rules = function(){

    var specialistRequired = $("input[data-sp-element-name='SpecialistsRequired']").val();

    if(specialistRequired == "Other"){    
        sharepoint_utilities.show_fields(["SpecialistComments"])
        sharepoint_utilities.set_fields_as_required(["SpecialistComments"])
    }else {
        sharepoint_utilities.hide_fields(["SpecialistComments"]);
        sharepoint_utilities.set_fields_as_not_required(["SpecialistComments"])

    }


}


