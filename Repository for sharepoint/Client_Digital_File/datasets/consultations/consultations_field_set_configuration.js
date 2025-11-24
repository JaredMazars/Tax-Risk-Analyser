let consultations_fields_configuration = {

     "not_available":[
          
          {
                  "Title": "Guidance",
                  "Description":  "The consultation process is currently not available in this module",
                  "sp_field_name": "appendix-c-placeholder-guidance-economic-activites",
                  "sp_field_type": "placeholder",
                  "field_width": "full-width",
                  "field_validate": false,
                  "sp_additional_properties": "placeholder none exclude-from-meta",
                  "field_icon": "AccountManagement"
          }
     ],    
    "team_rating_fields":[         
          {
               "Title": "Consultation Reference Id",
               "Description": "The consultation reference number",
               "sp_field_name": "ConsultationReferenceId",
               "sp_field_type": "input",
               "field_width": "half-width",
               "field_validate": true,
               "sp_additional_properties": "none disabled",            
               "field_icon": "Dialpad"
          },         
          {
              "Title": "Survey Status",
              "Description": "The current status of your request",
              "sp_field_name": "Status",
              "sp_field_type": "select",
              "field_width": "half-width",
              "field_validate": true,
              "sp_additional_properties":"single-select-choice-column disabled",          
              "list_name":app_configuration.consultations_list_name,
              "site_context":app_configuration.site_context,
              "field_icon":"MapPin"            
          },          
          {
              "Title":"Feedback Type.",
              "Description":"Feedback Given To:",
              "sp_field_name":"FeedbackType",
              "sp_field_type":"input",
              "field_width":"full-width",
              "field_validate":true,
              "sp_additional_properties":"radio-buttons-own-values",
              "own_values":["Consultation Team","Engagement Team"],
              "field_icon":"ProductionFloorManagement" 
          },
          {
               "Title": "Technical Quality",
               "Description": "Technical quality: Assess the consultant's knowledge and skills in the specific technical area relevant to your consultation.",
               "sp_field_name": "TechnicalQuality",
               "sp_field_type":"input",
               "field_width":"full-width",
               "field_validate":true,
               "sp_additional_properties":"radio-buttons-own-values hide-field",
               "own_values":["Weak Performance (WP)","Not Full Performance (NF)","Full Performer (FP)","Exceptional Performer (EP)"],
               "field_icon":"FavoriteStar" 
          }, 
          {
               "Title": "Communication",
               "Description": "Consider the consultant's ability to clearly explain technical aspects and updates.",
               "sp_field_name": "Communication",
               "sp_field_type":"input",
               "field_width":"full-width",
               "field_validate":true,
               "sp_additional_properties":"radio-buttons-own-values hide-field",
               "own_values":["Weak Performance (WP)","Not Full Performance (NF)","Full Performer (FP)","Exceptional Performer (EP)"],
               "field_icon":"FavoriteStar" 
          }, 
          {
               "Title": "Time Management",
               "Description": "Consider the consultant's ability to manage time, resources and deliverables efficiently.",
               "sp_field_name": "TimeManagment",
               "sp_field_type":"input",
               "field_width":"full-width",
               "field_validate":true,
               "sp_additional_properties":"radio-buttons-own-values hide-field",
               "own_values":["Weak Performance (WP)","Not Full Performance (NF)","Full Performer (FP)","Exceptional Performer (EP)"],
               "field_icon":"FavoriteStar" 
          }, 
          {
               "Title": "Professionalism",
               "Description": "Consider the consultant's reliability.",
               "sp_field_name": "Professionalism",
               "sp_field_type":"input",
               "field_width":"full-width",
               "field_validate":true,
               "sp_additional_properties":"radio-buttons-own-values hide-field",
               "own_values":["Weak Performance (WP)","Not Full Performance (NF)","Full Performer (FP)","Exceptional Performer (EP)"],
               "field_icon":"FavoriteStar" 
          },          
       //engagement team fields
          {
               "Title": "Clarity",
               "Description": "Was the query clearly stated and easy to understand?",
               "sp_field_name": "Clarity",
               "sp_field_type":"input",
               "field_width":"full-width",
               "field_validate":true,
               "sp_additional_properties":"radio-buttons-own-values hide-field",
               "own_values":["Weak Performance (WP)","Not Full Performance (NF)","Full Performer (FP)","Exceptional Performer (EP)"],
               "field_icon":"FavoriteStar" 
          },
          {
               "Title": "Relevance",
               "Description": "Does the query relate to the topic or issue at hand?",
               "sp_field_name": "Relevance",
               "sp_field_type":"input",
               "field_width":"full-width",
               "field_validate":true,
               "sp_additional_properties":"radio-buttons-own-values hide-field",
               "own_values":["Weak Performance (WP)","Not Full Performance (NF)","Full Performer (FP)","Exceptional Performer (EP)"],
               "field_icon":"FavoriteStar" 
          },
          {
               "Title": "Research",
               "Description": "Did the engagement team perform research about the query?",
               "sp_field_name": "Research",
               "sp_field_type":"input",
               "field_width":"full-width",
               "field_validate":true,
               "sp_additional_properties":"radio-buttons-own-values hide-field",
               "own_values":["Weak Performance (WP)","Not Full Performance (NF)","Full Performer (FP)","Exceptional Performer (EP)"],
               "field_icon":"FavoriteStar" 
          },
          {
               "Title": "Supporting Documents",
               "Description": "Were all relevant documents submitted?",
               "sp_field_name": "SupportingDocuments",
               "sp_field_type":"input",
               "field_width":"full-width",
               "field_validate":true,
               "sp_additional_properties":"radio-buttons-own-values hide-field",
               "own_values":["Weak Performance (WP)","Not Full Performance (NF)","Full Performer (FP)","Exceptional Performer (EP)"],
               "field_icon":"FavoriteStar" 
          },
          {
               "Title": "Additional feedback",
               "Description": "Please let us know if yhere is anything else you wish to disclose",
               "sp_field_name": "AdditionalFeedback",
               "sp_field_type": "textarea",
               "field_width": "full-width",
               "field_validate": false,
               "sp_additional_properties": "hide-field"            
           },
           {
                "Title": "placeholder",
                "Description": "placeholder",
                "sp_field_name": "placeholder-next-to-submit-review",
                "sp_field_type": "placeholder",
                "field_width": "half-width",
                "field_validate": false,
                "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
           },           
           {
               "Title": "Submit Review",
               "Description": "This will submit the form.",
               "sp_field_name": "sp-button-submit-consultation-feedback-review",
               "sp_field_type": "button",
               "field_width": "half-width",
               "field_validate": false,
               "sp_additional_properties": "exclude-from-meta hide-details"            
           }   
    ]
}