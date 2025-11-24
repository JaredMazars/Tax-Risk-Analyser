let clp_survey_results_page = {};


$(document).on("change","input[data-sp-element-name='surveyResultsDropdown']",function(){

    clp_survey_results_page.render_selected_survey_record_from_options($(this).val());
});

/**
 * Sets the values of a select 2 field of a type ahead drop down box
 * @param {original_request_data} json_object json object of the selected survey entry for clients requested to completed
 * @param {survey_data} json_object json object of the selected survey to display
 * @param {all_survey_data} array json objects of all survey responses for the given reference
 * @return {true} Adds the option value to the select 2 drop down
 */

clp_survey_results_page.render_results = function(original_request_data,survey_data,all_survey_data) {

    let parse_response = JSON.parse(survey_data.ResponseJSON)    
    let version_number = clp_survey_results_page.determine_version(parse_response);


    //this is where we setup the field structure
    let field_set_to_use = {}
    switch(version_number){
        case "1":
            //custom survey results are the values
            //parse response is just for the NPS group
            field_set_to_use = clp_survey_results_field_configuration;
        break;

        case "2":
            field_set_to_use = clp_survey_results_field_configuration_v2;
        break
    }

    
    //apply the plugins such as dates , drop downs etc 
    $(".clp-survey-results-container").html(
           sharepoint_utilities.create_container_form(
               field_set_to_use.survey_results_fields,//cube fields json
               "qualtrics-responses" //class to identify
           )
    );    

    //dynamically add the survey record selector options
    let survey_record_selector = [];
    for (let s_index = 0; s_index < all_survey_data.length; s_index++) {
        const row_item = all_survey_data[s_index];

        extract_info = JSON.parse(row_item.ResponseJSON)
        survey_record_selector.push(extract_info.responseId + " - " + moment(extract_info.values.recordedDate).format("DD/MM/YYYY HH:mm:ss"))
        
    }
    
    //render multiple responses as dates and radio buttons   
    field_set_to_use.survey_results_fields[2].own_values = survey_record_selector;

    let all_fields = sharepoint_utilities.consolidate_fields(field_set_to_use)
    sharepoint_utilities.apply_form_plugins(all_fields);   

    //display the original request details only and not the survey response details
    sharepoint_utilities.display_saved_list_fields(
        [original_request_data],
        all_fields,
        null
    );   
 
    //we render all the field values where they match the field ids from qualtrix and our fieldset
    let parse_survey_results = parse_response.labels;
    for (let key in parse_survey_results) {
        if (parse_survey_results.hasOwnProperty(key)) {

            //so we loop through each of the value responses that have the QID as the field name that is mapped above to the actual question name.
            let selected_response_value = parse_survey_results[key]           
            /*
                we skip all fields that have _ in them as they are handled manually
            */
            if(key.indexOf("_") ==-1){       
                //check for an array of values
                //this is for multi select responses
                if(Array.isArray(selected_response_value)){
                    selected_response_value = selected_response_value.join(',');       
                }          
                $("input[data-sp-element-name*='"+key+"']").val(sharepoint_utilities.check_for_null(selected_response_value,"N/A"));   
                $("textarea[data-sp-element-name*='"+key+"']").val(sharepoint_utilities.check_for_null(selected_response_value,"N/A"));                   
            }
        }
    }

    //This is where we add the table and any other custom fields
    //custom setting fields
    let custom_survey_results = parse_response.values   
   
    switch(version_number){
        case "1":
            //custom survey results are the values
            //parse response is just for the NPS group
            clp_survey_results_page.render_version_1_dataset(custom_survey_results,parse_response)
        break;

        case "2":
            clp_survey_results_page.render_version_2_dataset(custom_survey_results,parse_response)
        break
    }


    clp_survey_results_page["cached_survey_responses"] = all_survey_data;
    clp_survey_results_page["cached_original_requests_data"] = original_request_data;   
   
}

clp_survey_results_page.determine_version = function(survey_results){

    let version_number = "";

    if(survey_results.displayedFields[0].indexOf("QID1216") >= 0){
        version_number = "1";
    }else
    if(survey_results.displayedFields[0].indexOf("QID1218") >= 0){
        version_number = "2";
    }
    return version_number
}


clp_survey_results_page.render_version_2_dataset = function(custom_survey_results,parse_response){

 

    /*
        "question-display-QID1218456927_NPS_GROUP": "Based on your overall relationship with us, how likely are you to recommend Forvis Mazars to a friend or colleague? - Group",
        "question-display-QID1218456927": "Based on your overall relationship with us, how likely are you to recommend Forvis Mazars to a friend or colleague?",
        "question-display-QID1218456926_TEXT": "What can we do to improve your experience in future?",
        "question-display-QID1218456925_TEXT": "What can we do differently that would increase your score to a 9 or 10?",
        "question-display-QID1218456924_TEXT": "What specific aspects of our service have you found most valuable?",

        ---table stuff
        "question-display-QID1218456923_1": "How much do you agree or disagree with the following statements: - Forvis Mazars listens to understand my needs.",
        "question-display-QID1218456923_2": "How much do you agree or disagree with the following statements: - Forvis Mazars is very responsive to my requests.",
        "question-display-QID1218456923_3": "How much do you agree or disagree with the following statements: - Forvis Mazars meets my deadlines.",
        "question-display-QID1218456923_4": "How much do you agree or disagree with the following statements: - Forvis Mazars communicates proactively.",
        "question-display-QID1218456923_5": "How much do you agree or disagree with the following statements: - Forvis Mazars provides consistent service across departments and/or geographies.",
        "question-display-QID1218456923_6": "How much do you agree or disagree with the following statements: - Forvis Mazars demonstrates deep industry knowledge.",
        "question-display-QID1218456923_7": "How much do you agree or disagree with the following statements: - Forvis Mazars delivers outstanding quality of service.",
        "question-display-QID1218456923_8": "How much do you agree or disagree with the following statements: - Forvis Mazars focuses on delivering a high-quality audit.",
        "question-display-QID1218456923_9": "How much do you agree or disagree with the following statements: - Forvis Mazars has strong technical expertise.",
        "question-display-QID1218456923_10": "How much do you agree or disagree with the following statements: - Forvis Mazars shows an appropriate level of challenge.",
        "question-display-QID1218456923_11": "How much do you agree or disagree with the following statements: - Forvis Mazars provides adequate geographical coverage.",
        "question-display-QID1218456923_12": "How much do you agree or disagree with the following statements: - Forvis Mazars effectively uses benchmarking to assess our performance.",
        "question-display-QID1218456917_13": "How much do you agree or disagree with the following statements about Forvis Mazars' legal services: - Forvis Mazars is one of my preferred advisors for legal counsel.",
        "question-display-QID1218456917_14": "How much do you agree or disagree with the following statements about Forvis Mazars' legal services: - Forvis Mazars is capable of handling most of my organisation's legal advisory needs.",
        "question-display-QID1218456917_15": "How much do you agree or disagree with the following statements about Forvis Mazars' legal services: - At Forvis Mazars I can contact the right lawyer for specific legal advice whenever needed.",
        
        ---table stuff---

        "question-display-QID1218456921": "Which of the following statements are the most important to you in our service delivery (select up to three):",
        "question-display-QID1218456908": "Overall, how satisfied are you with your experience with Forvis Mazars?",
        "question-display-QID1218456916": "So that we can continue to better serve you, please share what is most important to you when working with a professional services firm (select up to three): - Selected Choice",
        "question-display-QID1218456916_10_TEXT": "So that we can continue to better serve you, please share what is most important to you when working with a professional services firm (select up to three): - Something else (please specify) - Text",
        "question-display-QID1218456910": "Please select the top strategic priorities for you over the next 12 months (select up to three): - Selected Choice",
        "question-display-QID1218456910_10_TEXT": "Please select the top strategic priorities for you over the next 12 months (select up to three): - Other (please specify) - Text",
        "question-display-QID1218456920": "Please select the top strategic priorities for your organisation over the next 12 months (select up to three): - Selected Choice",
        "question-display-QID1218456920_14_TEXT": "Please select the top strategic priorities for your organisation over the next 12 months (select up to three): - Other (please specify): - Text",
        "question-display-QID1218456919": "Would you like your account lead to follow up with you on this?",
        "question-display-QID1218456928": "To help ensure we proactively support your needs, please select any of the following areas in which you would like additional information or guidance (select all that apply): - Selected Choice",
        "question-display-QID1218456928_11_TEXT": "To help ensure we proactively support your needs, please select any of the following areas in which you would like additional information or guidance (select all that apply): - Other (please specify) - Text",
        "question-display-QID1218456918_TEXT": "If you are willing to provide us with a short testimonial of your experience of the work we have done for you that could be used publicly, please detail this below.",
        "question-display-QID1218456915": "Thank you for your testimonial \u2013 we really appreciate you taking the time to share your experience. Please select if you would be happy for your testimonial to appear on the following:",
        "question-display-QID1218456911": "If we share your testimonial, how would you like it to be attributed? - Selected Choice",
        "question-display-QID1218456911_1_TEXT": "If we share your testimonial, how would you like it to be attributed? - Full name - Text",
        "question-display-QID1218456911_2_TEXT": "If we share your testimonial, how would you like it to be attributed? - Job title - Text",
        "question-display-QID1218456911_3_TEXT": "If we share your testimonial, how would you like it to be attributed? - Company - Text"
    */ 

    //create the table for the multi select reponse questions
    //define table structure
    let table_data_set = 
    [
        {
            "title":"Client Needs.",
            "description":"Forvis Mazars listens to understand my needs.",
            "survey_field":"QID1218456923_1"
        },
        {
            "title":"Expertise.",
            "description":"Forvis Mazars is very responsive to my requests.",
            "survey_field":"QID1218456923_2"
        },
        {
            "title":"Project Management.",
            "description":"Forvis Mazars meets my deadlines.",
            "survey_field":"QID1218456923_3"
        },        
        {
            "title":"Responsiveness.",
            "description":" Forvis Mazars communicates proactively.",
            "survey_field":"QID1218456923_4"
        },        
        {
            "title":"Service Quality.",
            "description":"Forvis Mazars provides consistent service across departments and/or geographies.",
            "survey_field":"QID1218456923_5"
        },        
        {
            "title":"Value Add.",
            "description":"Forvis Mazars demonstrates deep industry knowledge.",
            "survey_field":"QID1218456923_6"
        },        
        {
            "title":"Business Understanding.",
            "description":"Forvis Mazars delivers outstanding quality of service.",
            "survey_field":"QID1218456923_7"
        },        
       /* {
            "title":"Devliery.",
            "description":"Forvis Mazars focuses on delivering a high-quality audit..",
            "survey_field":"QID1218456923_8"
        },               
        {
            "title":"Technical Expertise.",
            "description":"Forvis Mazars has strong technical expertise.",
            "survey_field":"QID1218456923_9"
        },        
        {
            "title":"Level of Challenge.",
            "description":"Forvis Mazars shows an appropriate level of challenge.",
            "survey_field":"QID1218456923_10"
        },        
       {
            "title":"Geographical Coverage.",
            "description":"Forvis Mazars provides adequate geographical coverage.",
            "survey_field":"QID1218456923_11"
        },               
        {
            "title":"Performance.",
            "description":"Forvis Mazars effectively uses benchmarking to assess our performance.",
            "survey_field":"QID1218456923_12"
        },        
        {
            "title":"Legal Counsel.",
            "description":"Forvis Mazars is one of my preferred advisors for legal counsel.",
            "survey_field":"QID1218456917_13"
        },        
        {
            "title":"Legal Advisory Needs.",
            "description":"Forvis Mazars is capable of handling most of my organisation's legal advisory needs.",
            "survey_field":"QID1218456917_14"
        },        
        {
            "title":"Legal Advice.",
            "description":"At Forvis Mazars I can contact the right lawyer for specific legal advice whenever needed.",
            "survey_field":"QID1218456917_15"
        }
        */
    ]

    //set default valie of selected survey
    sharepoint_utilities.set_field_value("OutcomeDate",moment(custom_survey_results.recordedDate).format("ll"));  
    sharepoint_utilities.set_field_value("surveyResultsDropdown",parse_response.responseId + " - " + moment(custom_survey_results.recordedDate).format("DD/MM/YYYY HH:mm:ss"));     

    //nps QID1218456927_NPS_GROUP
    //this is the associated wording to that score
    sharepoint_utilities.set_field_value("QID1218456927_NPS_GROUP_Display",parse_response.labels.QID1218456927_NPS_GROUP); 
    //set the score amount - the number
    sharepoint_utilities.set_field_value("QID1218456927",custom_survey_results.QID1218456927); 

    //custom fields
    sharepoint_utilities.set_field_value("QID1218456926_TEXT",sharepoint_utilities.check_for_null(custom_survey_results.QID1218456926_TEXT,"N/A"))
    sharepoint_utilities.set_field_value("QID1218456925_TEXT",sharepoint_utilities.check_for_null(custom_survey_results.QID1218456925_TEXT,"N/A"))
    sharepoint_utilities.set_field_value("QID1218456924_TEXT",sharepoint_utilities.check_for_null(custom_survey_results.QID1218456924_TEXT,"N/A"))

    sharepoint_utilities.set_field_value("QID1218456916_10_TEXT",sharepoint_utilities.check_for_null(custom_survey_results.QID1218456916_10_TEXT,"N/A"))
    sharepoint_utilities.set_field_value("QID1218456928_11_TEXT",sharepoint_utilities.check_for_null(custom_survey_results.QID1218456928_11_TEXT,"N/A"))
    sharepoint_utilities.set_field_value("QID1218456920_14_TEXT",sharepoint_utilities.check_for_null(custom_survey_results.QID1218456920_14_TEXT,"N/A"))
 
   
    $("div[sp-field-name='feedback_ratings'] .field-component").html(clp_survey_results_page.render_feedback_and_ratings_table(table_data_set,parse_response.labels));
    $("div[sp-field-name='feedback_ratings'] .field-component").find("#feedback_ratings_table").dataTable({searching: false, paging: false, info: false});


}

clp_survey_results_page.render_version_1_dataset = function(custom_survey_results,parse_response){

    //this is from thier form on the survey site
    //key:value mapping
    //Qualitrics system field name : the display name 
    /*let qualtrics_field_mappings = {
        "question-display-QID1216014145": "Which of the following topics are the top strategic priorities for your organisation over the next 12 months? Please choose up to three most important.",
        "question-display-QID1216014146": "Which of the following best describes the industry sector your organisation operates within?",
        "question-display-QID1216014147": "When you consider the overall relationship, how do you rate Forvis Mazars on our ability to build strong client relationships? (From 1-10, 1 being terrible and 10 excellent)",
        "question-display-QID1216014148": "What was your organisation's total worldwide revenue in US dollars in its most recently reported financial year?",
        "question-display-QID1216014149_TEXT": "What can we do to improve your experience with Forvis Mazars?",
        "question-display-QID1216014150": "What can we do to ensure your experience with Forvis Mazars is exceptional?",
        "question-display-QID1216014151": "Please rate the service(s) you have received from Forvis Mazars against some specific attributes.",
        "question-display-QID1216014152": "Please confirm the type of service(s) we deliver to you.",
        "question-display-QID1216014154": "Overall, how satisfied were you with the service you received from Forvis Mazars? (From 1-10, 1 being extremely unsatisfied and 10 extremely satisfied)",
        "question-display-QID1216014155": "Is your company (or any company in your group) listed on a recognised stock market?",
        "question-display-QID1216014156": "In what capacity do you use Forvis Mazars' services?",
        "question-display-QID1216014157": "How many employees does your organisation have worldwide?",
        "question-display-QID1216014158": "How likely are you to recommend Forvis Mazars to a friend or colleague?",
        "question-display-QID1216014159": "How do you rate Forvis Mazars in terms of providing value for money? (From 1-10, 1 being terrible and 10 excellent)",
        "question-display-QID1216014161": "Are you interested in learning more about any of the services Forvis Mazars offers?"
    } */   

    sharepoint_utilities.set_field_value("OutcomeDate",moment(custom_survey_results.recordedDate).format("ll"));  
    sharepoint_utilities.set_field_value("QID1216014158_NPS_GROUP_Display",parse_response.labels.QID1216014158_NPS_GROUP); 
    //set the score amount
    sharepoint_utilities.set_field_value("QID1216014158_Value",custom_survey_results.QID1216014158); 

    //Other optional fields
    if(!custom_survey_results.QID1216014153){
        sharepoint_utilities.set_field_value("QID1216014153_Display","N/A");  
    }
    if(!custom_survey_results.QID1216014161){
        sharepoint_utilities.set_field_value("QID1216014161_Display","N/A");  
    }    

    //set default valie of selected survey
    sharepoint_utilities.set_field_value("surveyResultsDropdown",parse_response.responseId + " - " + moment(custom_survey_results.recordedDate).format("DD/MM/YYYY HH:mm:ss")); 

    $("div[sp-field-name='QID1216014150_TEXT_Value'] .field-component").html(sharepoint_utilities.check_for_null(custom_survey_results.QID1216014150_TEXT,"N/A"));
    $("div[sp-field-name='QID1216014149_TEXT_Value'] .field-component").html(sharepoint_utilities.check_for_null(custom_survey_results.QID1216014149_TEXT,"N/A"));    

    //create the table for the multi select reponse questions
    //define table structure
    let table_data_set = 
    [
        {
            "title":"Deadline Adherence",
            "description":"How well we met the project deadlines.",
            "survey_field":"QID1216014151_16"
        },
        {
            "title":"Expertise",
            "description":"Rating on our technical and professional expertise.",
            "survey_field":"QID1216014151_15"
        },
        {
            "title":"Project Management",
            "description":"Feedback on the effectiveness of our project management approach.",
            "survey_field":"QID1216014151_11"
        },        
        {
            "title":"Responsiveness",
            "description":"How promptly our team responded to the client's needs.",
            "survey_field":"QID1216014151_2"
        },        
        {
            "title":"Service Quality",
            "description":"Feedback on the overall quality of our services.",
            "survey_field":"QID1216014151_1"
        },        
        {
            "title":"Value Add",
            "description":"Feedback on the additional value our service delivered.",
            "survey_field":"QID1216014151_3"
        },        
        {
            "title":"Business Understanding",
            "description":"Our grasp of the client's business requirements.",
            "survey_field":"QID1216014151_5"
        },        
        {
            "title":"Industry Insight",
            "description":"Rating on our industry-specific knowledge and insights.",
            "survey_field":"QID1216014151_6"
        }
    ]


    $("div[sp-field-name='feedback_ratings'] .field-component").html(clp_survey_results_page.render_feedback_and_ratings_table(table_data_set,parse_response.labels));
    $("div[sp-field-name='feedback_ratings'] .field-component").find("#feedback_ratings_table").dataTable({searching: false, paging: false, info: false});

}

clp_survey_results_page.render_selected_survey_record_from_options = function(selected_survey_identifier){

    let cached_surveys = clp_survey_results_page.cached_survey_responses;
    let selected_survey_data = {};

    for (let s_index = 0; s_index < cached_surveys.length; s_index++) {
        const row_item = cached_surveys[s_index];

        extract_info = JSON.parse(row_item.ResponseJSON)
        cache_identifier = extract_info.responseId + " - " + moment(extract_info.values.recordedDate).format("DD/MM/YYYY HH:mm:ss")

        if(cache_identifier == selected_survey_identifier){
            selected_survey_data = row_item;
            break;
        }    
    }

    clp_survey_results_page.render_results(
        clp_survey_results_page["cached_original_requests_data"],
        selected_survey_data,
        clp_survey_results_page.cached_survey_responses
    )
}


clp_survey_results_page.render_feedback_and_ratings_table = function(table_data_set,survey_results){

    let table_html = 
    `
        <table id="feedback_ratings_table" class="dataTable no-footer">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Description</th>
                    <th>Rating</th>
                </tr>
            </thead>
            <tbody>   
    `
    for (let index = 0; index < table_data_set.length; index++) {
        const element = table_data_set[index];

        table_html += 
        `
            <tr data-index="5" class="odd">
                <td class="sorting_1">${element.title}</td>
                <td>${element.description}</td>
                <td>${sharepoint_utilities.check_for_null(survey_results[element.survey_field],"N/A")}</td>
            </tr>
        `
        
    }           
                          
    table_html += `
             </tbody>
        </table>          
    `

    return table_html
}




/*

Watch out AI SLOP Below

clp_survey_results_page.render_results = function(surveyResultsData) {
    if (Array.isArray(surveyResultsData)) {
        clp_survey_results_page.allResults = surveyResultsData;
        surveyResultsData = surveyResultsData[0];
    }
    // Ensure the survey results field configuration is loaded.
    // Get field configurations.
    let fieldsConfig = window.clp_survey_results_field_configuration.getFieldConfigurations();
    fieldsConfig = fieldsConfig.map(function(field) {
         if (field.sp_field_name === "Reference") {
             field.additional_filters = "Title eq '" + surveyResultsData.Title + "'";
         }
         return field;
    });
    // Filter out fields with blank values, including specific placeholders, but conditionally include surveyResultsDropdown
    fieldsConfig = fieldsConfig.filter(function(field) {
        const value = surveyResultsData[field.sp_field_name];
        const isBlank = value === null || value === undefined || value === "";
        // Always include 'feedback_ratings', 'AISummary', and submission fields; include 'surveyResultsDropdown' only if more than 1 record
        if (field.sp_field_name === "feedback_ratings" || 
            (field.sp_field_name === "surveyResultsDropdown" && clp_survey_results_page.allResults && clp_survey_results_page.allResults.length > 1) ||
            field.sp_field_name === "AISummary" || 
            field.sp_field_name === "clientName" || 
            field.sp_field_name === "clientContactName" || 
            field.sp_field_name === "clientContactEmail") {
            return true; // Keep these fields regardless of value (or conditionally for surveyResultsDropdown)
        }
        return !isBlank; // Exclude any other field (including placeholders like QID1216014150_TEXT_Value and QID1216014149_TEXT_Value) if blank
    });
    // New robust transformation for feedback_ratings: ensure it's a JSON string representing an array.
    try {
        let temp = (typeof surveyResultsData.feedback_ratings === "string") ? JSON.parse(surveyResultsData.feedback_ratings) : surveyResultsData.feedback_ratings;
        if (!Array.isArray(temp)) {
            temp = [];
        }
        if (temp.length === 0) {
            let rowData = [];
            if (surveyResultsData.QID1216014151_1_Display || surveyResultsData.QID1216014151_2_Display || surveyResultsData.QID1216014151_3_Display || surveyResultsData.QID1216014151_11_Display || surveyResultsData.QID1216014151_16_Display || surveyResultsData.QID1216014151_16_Display || surveyResultsData.QID1216014151_5_Display || surveyResultsData.QID1216014151_6_Display) {
                rowData.push({
                    "Metric": "Service Quality",
                    "Rating": surveyResultsData.QID1216014151_1_Display || "",
                    "Comments": ""
                });
                rowData.push({
                    "Metric": "Responsiveness",
                    "Rating": surveyResultsData.QID1216014151_2_Display || "",
                    "Comments": ""
                });
                rowData.push({
                    "Metric": "Value Add",
                    "Rating": surveyResultsData.QID1216014151_3_Display || "",
                    "Comments": ""
                });
                rowData.push({
                    "Metric": "Business Understanding",
                    "Rating": surveyResultsData.QID1216014151_5_Display || "",
                    "Comments": ""
                });
                rowData.push({
                    "Metric": "Industry Insight",
                    "Rating": surveyResultsData.QID1216014151_6_Display || "",
                    "Comments": ""
                });
                rowData.push({
                    "Metric": "Project Management",
                    "Rating": surveyResultsData.QID1216014151_11_Display || "",
                    "Comments": ""
                });
                rowData.push({
                    "Metric": "Expertise",
                    "Rating": surveyResultsData.QID1216014151_15_Display || "",
                    "Comments": ""
                });
                rowData.push({
                    "Metric": "Deadline Adherence",
                    "Rating": surveyResultsData.QID1216014151_16_Display || "",
                    "Comments": ""
                });
            }
            temp = rowData;
        }
        surveyResultsData.feedback_ratings = JSON.stringify(temp);
    } catch(e) {
        console.error("Error processing feedback_ratings:", e);
        surveyResultsData.feedback_ratings = JSON.stringify([]);
    }
    if (window.clp_field_configuration && window.clp_field_configuration.survey_form) {
         let additionalFields = window.clp_field_configuration.survey_form.filter(function(field) {
              return field.sp_field_name === "clientName" || field.sp_field_name === "clientContactName" || field.sp_field_name === "clientContactEmail";
         });
         fieldsConfig = additionalFields.concat(fieldsConfig);
    }
    
    // Create the survey results form using the framework's utility function.
    let container_html = sharepoint_utilities.create_container_form(fieldsConfig, "survey-results-section");
    
    // Insert the container into the designated area, prepending dropdown if available.
    let dropdownHtml = "";
    if (clp_survey_results_page.allResults && clp_survey_results_page.allResults.length > 1) {
        dropdownHtml += `<div class="field-component padding-adjustment-for-icons">`;
        dropdownHtml += `<div class="radio-button-component" style="height: auto;">`;
        clp_survey_results_page.allResults.forEach(function(record, index) {
            let checked = (record.Id === surveyResultsData.Id) ? "checked" : "";
            let isSelectedClass = (record.Id === surveyResultsData.Id) ? "radio-button-group-container-is-selected" : "";
            let isSelectedLabelClass = (record.Id === surveyResultsData.Id) ? "radio-label-is-selected" : "";
            let isSelectedSpanClass = (record.Id === surveyResultsData.Id) ? "" : "hide";
            
            dropdownHtml += `<div class="radio-button-group-container ${isSelectedClass}">`;
            dropdownHtml += `<input class="radio-button-component-input" type="radio" id="survey-results-${index}" name="survey-results-radio" value="${index}" ${checked}>`;
            dropdownHtml += `<span class="radio-button-is-selected ${isSelectedSpanClass}"><i class="ms-Icon ms-Icon--CheckMark"></i></span>`;
            dropdownHtml += `<label class="radio-button-component-label ${isSelectedLabelClass}" for="survey-results-${index}">${record.OutcomeDate ? moment(record.OutcomeDate).format('DD MMM YYYY (HH:mm)') : 'No Date'}</label>`;
            dropdownHtml += `</div>`;
        });
        dropdownHtml += `</div>`;
        dropdownHtml += `</div>`;
    }
    $(".clp-survey-results-container").html(container_html);
    if(dropdownHtml){
        $("div[sp-field-name='surveyResultsDropdown'] .field-component").html(dropdownHtml);
        // Remove any existing change listeners to prevent stacking
        $("input[name='survey-results-radio']").off("change").on("change", function(){
            let selectedIndex = parseInt($(this).val(), 10);
            clp_survey_results_page.render_results(clp_survey_results_page.allResults[selectedIndex]);
        });
    }
    
    // Merge corresponding client details from the submissions record if missing.
    if (!surveyResultsData.clientName || !surveyResultsData.clientContactName || !surveyResultsData.clientContactEmail) {
        let submissionQuery = "Title eq '" + surveyResultsData.Title + "'";
        $.when(sharepoint_utilities.get_list_items_by_title(app_configuration.site_context, "*", submissionQuery, app_configuration.clp_list_name, "Id asc"))
        .done(function(submissionData) {
            if (submissionData.length > 0) {
                surveyResultsData.clientName = submissionData[0].clientName || "";
                surveyResultsData.clientContactName = submissionData[0].clientContactName || "";
                surveyResultsData.clientContactEmail = submissionData[0].clientContactEmail || "";
            }
            // Rebuild container with filtered fields
            let updated_container_html = sharepoint_utilities.create_container_form(fieldsConfig, "survey-results-section");
            $(".clp-survey-results-container").html(updated_container_html);
            if(dropdownHtml){
                $("div[sp-field-name='surveyResultsDropdown'] .field-component").html(dropdownHtml);
                // Remove any existing change listeners to prevent stacking
                $("input[name='survey-results-radio']").off("change").on("change", function(){
                    let selectedIndex = parseInt($(this).val(), 10);
                    clp_survey_results_page.render_results(clp_survey_results_page.allResults[selectedIndex]);
                });
            }
            // Populate the form with the updated survey results data, excluding placeholders
            let nonPlaceholderFields = fieldsConfig.filter(function(field) { return field.sp_field_type !== "placeholder"; });
            sharepoint_utilities.display_saved_list_fields([surveyResultsData], nonPlaceholderFields, ".clp-survey-results-container");
            sharepoint_utilities.apply_form_plugins(fieldsConfig);
            if(surveyResultsData.OutcomeDate){
                sharepoint_utilities.set_field_value("OutcomeDate", moment(surveyResultsData.OutcomeDate).format(app_configuration.display_date_format));
            }
            clp_survey_results_page.render_feedback_ratings_table(surveyResultsData.feedback_ratings, "applied");
            clp_survey_results_page.render_ai_summary(surveyResultsData.AISummary);
            clp_survey_results_page.render_improvement_suggestions(surveyResultsData.QID1216014150_TEXT_Value);
            clp_survey_results_page.render_enhancement_ideas(surveyResultsData.QID1216014149_TEXT_Value);
        })
        .fail(function(error) {
            // In case of failure, rebuild container and display data.
            let updated_container_html = sharepoint_utilities.create_container_form(fieldsConfig, "survey-results-section");
            $(".clp-survey-results-container").html(updated_container_html);
            sharepoint_utilities.display_saved_list_fields([surveyResultsData], fieldsConfig, ".clp-survey-results-container");
        });
    } else {
        // Rebuild container with filtered fields
        let updated_container_html = sharepoint_utilities.create_container_form(fieldsConfig, "survey-results-section");
        $(".clp-survey-results-container").html(updated_container_html);
        if(dropdownHtml){
            $("div[sp-field-name='surveyResultsDropdown'] .field-component").html(dropdownHtml);
            // Remove any existing change listeners to prevent stacking
            $("input[name='survey-results-radio']").off("change").on("change", function(){
                let selectedIndex = parseInt($(this).val(), 10);
                clp_survey_results_page.render_results(clp_survey_results_page.allResults[selectedIndex]);
            });
        }
        // Populate the form with the updated survey results data, excluding placeholders
        let nonPlaceholderFields = fieldsConfig.filter(function(field) { return field.sp_field_type !== "placeholder"; });
        sharepoint_utilities.display_saved_list_fields([surveyResultsData], nonPlaceholderFields, ".clp-survey-results-container");
        sharepoint_utilities.apply_form_plugins(fieldsConfig);
        if(surveyResultsData.OutcomeDate){
            sharepoint_utilities.set_field_value("OutcomeDate", moment(surveyResultsData.OutcomeDate).format(app_configuration.display_date_format));
        }
        clp_survey_results_page.render_feedback_ratings_table(surveyResultsData.feedback_ratings, "applied");
        clp_survey_results_page.render_ai_summary(surveyResultsData.AISummary);
        clp_survey_results_page.render_improvement_suggestions(surveyResultsData.QID1216014150_TEXT_Value);
        clp_survey_results_page.render_enhancement_ideas(surveyResultsData.QID1216014149_TEXT_Value);
        $(document).on("change", ".feedback-section .repeating-section-input", function(){
            console.log("Repeating section input changed:", $(this).val());
        });
    }
}

clp_survey_results_field_configuration.getFieldConfigurations = function() {
    return clp_survey_results_field_configuration.survey_results_fields;
};
window.clp_survey_results_field_configuration = clp_survey_results_field_configuration;

clp_survey_results_page.render_feedback_ratings_table = function(feedback_json, render_type) {
    let feedback;
    try {
        feedback = JSON.parse(feedback_json);
    } catch(e) {
        console.error("Error parsing feedback ratings JSON:", e);
        feedback = [];
    }
    // Filter out rows with blank ratings
    const validFeedback = feedback.filter(row => row.Rating !== null && row.Rating !== undefined && row.Rating !== "");
    if (!Array.isArray(validFeedback) || validFeedback.length === 0) {
        $("div[sp-field-name='feedback_ratings'] .field-component").html(""); // Clear the container if no rows have ratings
        return; // Skip rendering the table
    }
    const descriptions = {
        "Service Quality": "Feedback on the overall quality of our services.",
        "Responsiveness": "How promptly our team responded to the client's needs.",
        "Value Add": "Feedback on the additional value our service delivered.",
        "Business Understanding": "Our grasp of the client's business requirements.",
        "Industry Insight": "Rating on our industry-specific knowledge and insights.",
        "Project Management": "Feedback on the effectiveness of our project management approach.",
        "Expertise": "Rating on our technical and professional expertise.",
        "Deadline Adherence": "How well we met the project deadlines."
    };
    let table_html = `
        <table id='feedback_ratings_table' class=''>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Description</th>
                    <th>Rating</th>
                </tr>
            </thead>
            <tbody>`;
    for(let i = 0; i < validFeedback.length; i++){
        let row = validFeedback[i];
        let desc = descriptions[row.Metric] || "";
        table_html += `
            <tr data-index='${i}'>
                <td>${row.Metric || ""}</td>
                <td>${desc}</td>
                <td>${row.Rating || ""}</td>
            </tr>`;
    }
    table_html += `
            </tbody>
        </table>`;
    $("div[sp-field-name='feedback_ratings'] .field-component").html(table_html);
    $("div[sp-field-name='feedback_ratings'] .field-component").find("#feedback_ratings_table").dataTable({searching: false, paging: false, info: false});
};
clp_survey_results_page.render_ai_summary = function(summaryText) {
    $("div[sp-field-name='AISummary'] .field-component").html(`<div class="ai-summary" style="text-align: center; margin: 20px auto; max-width: 800px; line-height: 1.6; font-size: 16px; padding: 20px; background-color: #f8f8f8; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${summaryText || ""}</div>`);
};

clp_survey_results_page.render_improvement_suggestions = function(text) {
    var container = $("div[sp-field-name='QID1216014150_TEXT_Value'] .field-component");
    if (container.length === 0) {
        container = $("div[sp-field-name='QID1216014150_TEXT_Value']");
    }
    container.html(`<div class="improvement-suggestions" style="text-align: left; margin: 20px auto; max-width: 800px; line-height: 1.6; font-size: 16px; padding: 20px; background-color: #e6f7ff; border: 1px solid #91d5ff; border-radius: 5px;">${text || ""}</div>`);
};

clp_survey_results_page.render_enhancement_ideas = function(text) {
    var container = $("div[sp-field-name='QID1216014149_TEXT_Value'] .field-component");
    if (container.length === 0) {
        container = $("div[sp-field-name='QID1216014149_TEXT_Value']");
    }
    container.html(`<div class="enhancement-ideas" style="text-align: left; margin: 20px auto; max-width: 800px; line-height: 1.6; font-size: 16px; padding: 20px; background-color: #fffbe6; border: 1px solid #f0e68c; border-radius: 5px;">${text || ""}</div>`);
};

window.clp_survey_results_page = clp_survey_results_page;

*/
