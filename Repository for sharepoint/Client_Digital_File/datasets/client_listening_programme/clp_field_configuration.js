let clp_field_configuration = {    
    "survey_form":[       
        {
            "Title": "Title",
            "Description": "Title",
            "sp_field_name": "Title",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "hide-field"
        },
        {
            "Title":"Search client details",
            "Description":"Use the search box to find your client and associated client code from greatsoft.",
            "sp_field_name":"temp-search-client-name",          
            "sp_field_type":"select",         
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"exclude-from-meta single-select-typeahead plain-text-field",
            "additional_filters":"",
            "drop_down_title_field":"M_ClientName",
            "drop_down_value_field":"M_ClientCode",
            "drop_down_order_by":"Title asc",
            "list_name":app_configuration.client_list_name,
            "site_context":app_configuration.client_list_site_context,
            "field_icon":"ContactList" 
        },       
        {
            "Title": "Client Name",
            "Description": "Associated Client Name",
            "sp_field_name": "clientName",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "disabled",
            "field_icon": "AccountBrowser"     
        },        
        {
            "Title": "Client Code",
            "Description": "Associated Client Code",
            "sp_field_name": "clientCode",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "disabled",
            "field_icon": "AccountBrowser"            
        },       
        {
            "Title": "Client Group Code",
            "Description": "Associated Client Group Code",
            "sp_field_name": "clientGroupCode",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "disabled",
            "field_icon": "AccountBrowser"            
        },
         {
             "Title": "placeholder",
             "Description": "placeholder",
             "sp_field_name": "placeholder-after-client-group-code",
             "sp_field_type": "placeholder",
             "field_width": "half-width",
             "field_validate": false,
             "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        },
        {
            "Title": "Survey Status",
            "Description": "Indicates the current progress or phase of the survey, such as 'Pending Submission', 'Submitted', or 'Feedback Received'.",
            "sp_field_name": "surveyStatus",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "disabled hide-field single-select-choice-column",
            "drop_down_order_by": "Title asc",
            "list_name": app_configuration.clp_list_name,
            "site_context": app_configuration.site_context,
            "field_icon": "FunctionalManagerDashboard"     
        },  
        {
            "Title": "Client Contact Name",
            "Description": "Please enter the full name of the client or individual you are getting in touch with. This helps us identify the contact for your communication.",
            "sp_field_name": "clientContactName",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "none",            
            "field_icon": "Dialpad"
        },
        {
            "Title": "Client Email Address",
            "Description": "Please enter a valid email address. This is the offical client email address that the survey will be sent to.",
            "sp_field_name": "clientContactEmail",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "none",            
            "field_icon": "Dialpad"
        },
        {
            "Title": "Client Contact Phone",
            "Description": "Please enter a valid phone phone number.",
            "sp_field_name": "clientContactPhone",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "none",            
            "field_icon": "Dialpad"
        },       
        {
            "Title": "Service Line",
            "Description": "Please select your service line.",
            "sp_field_name": "serviceLine",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "single-select-drop-down-external-list",
            "additional_filters": "Title eq 'ScopeOfServices'",
            "drop_down_title_field": "AssociatedValue",
            "drop_down_value_field": "AssociatedValue",
            "drop_down_order_by": "AssociatedValue asc",
            "list_name": 'BDLookupFields',
            "site_context": app_configuration.site_context,
            "field_icon": "ChangeEntitlements"
        },
        {
            "Title": "Office Location",
            "Description": "Please provide the location of your office.",
            "sp_field_name": "office",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties":"single-select-drop-down-external-list remove-duplicates",
            "additional_filters": "UseInQRMV2 eq '1'",
            "drop_down_title_field": "Title",
            "drop_down_value_field": "Title",
            "drop_down_order_by": "Title asc",
            "list_name": app_configuration.office_list_name,
            "site_context": app_configuration.office_list_site_context,
            "field_icon": "MapPin"
        },       
        {
            "Title": "Partner",
            "Description": "This should be either your own name (if you are the Partner) or the name of the Partner you are completing "+
                " the form on behalf of. Client feedback will be sent to the email address associated with the name entered here.",
            "sp_field_name": "partnerId",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "Lookup single-select-typeahead",        
            "drop_down_title_field":"Title",
            "drop_down_value_field":"Id",
            "list_name": "User Information List",
            "site_context": app_configuration.people_picker_site_context,
            "field_icon": "AccountBrowser"
        },
        {
             "Title": "placeholder",
             "Description": "placeholder",
             "sp_field_name": "placeholder-for-partner-field",
             "sp_field_type": "placeholder",
             "field_width": "full-width",
             "field_validate": false,
             "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        },
        {
            "Title": "Managers",
            "Description": "Enter the full name(s)of Manager(s) involved in the past year’s work." +
                    "Feedback will be sent to the email addresses linked to the names entered.",
            "sp_field_name": "managersId",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "Lookup multi-select-typeahead-for-lookup-or-people-picker",        
            "drop_down_title_field":"Title",
            "drop_down_value_field":"Id",
            "list_name": "User Information List",
            "site_context": app_configuration.people_picker_site_context           
        },  
        {
            "Title": "Project Task Code",
            "Description": "The task code from GreatSoft that is associated to the work performed for the client.",
            "sp_field_name": "taskCode",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": true,
            "sp_additional_properties": "radio-buttons-own-value",
            "field_icon": "Dialpad"
        },    
        {
            "Title": "Period",
            "Description": "Survey Period.",
            "sp_field_name": "Period",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "hide-field",            
            "field_icon": "Dialpad"
        },
        {
            "Title": "RemovalReason",
            "Description": "Provide the reason for removal.",
            "sp_field_name": "RemovalReason",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "field_icon": "Dialpad"
        },
        {
            "Title": "RemovalJustification",
            "Description": "Provide additional justification for the removal.",
            "sp_field_name": "RemovalJustification",
            "sp_field_type": "textarea", 
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "field_icon": "Dialpad"
        },
        {
            "Title": "Request Survey",
            "Description": "This will submit your form for approval. Until this request is approved, the client will not recieve the survey request.",
            "sp_field_name": "btn-submit-clp-request",
            "sp_field_type": "button",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta"            
        },
        {
            "Title": "Approve and Send",
            "Description": "*Note - Once approved, this will send the survey out to the selected client contact defined above",
            "sp_field_name": "btn-approve-clp-request",
            "sp_field_type": "button",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-field"            
        }
    ]
}

let clp_help_guide_configuration = {
    "help_fields":[
        
        {
                "Title": "Guidance",
                "Description":"Please use the link below to access the learning material for this tool.<br>"+
                "<a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-Mazars/Portal%20Documents/Client%20Listening%20Program.pdf'>Access Help Giude</a>",
                "sp_field_name": "clp-help-documents",
                "sp_field_type": "placeholder",
                "field_width": "full-width",
                "field_validate": false,
                "sp_additional_properties": "placeholder none exclude-from-meta",
                "field_icon": "AccountManagement"
            },
    ]
}

let clp_survey_results_field_configuration = {
    survey_results_fields: [
        {
            "Title": "Ref No.",
            "Description": "Identifier to track this survey response for internal feedback.",
            "sp_field_name": "Title",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Tag"
        },
        {
             "Title": "placeholder",
             "Description": "placeholder",
             "sp_field_name": "placeholder-after-ref-number",
             "sp_field_type": "placeholder",
             "field_width": "full-width",
             "field_validate": false,
             "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        },
        {
            "Title": "Survey Record Selector",
            "Description": "This survey has more than one response attached to the same reference. The client likely responsed twice on the same link, or the survey was completed by more than one person. Select between the survey responses below:",
            "sp_field_name": "surveyResultsDropdown",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values",
            "own_values":[],
            "field_icon": "DoubleBookmark"
        },        
        {
            "Title": "Client",
            "Description": "Client providing the feedback.",
            "sp_field_name": "clientName",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "AccountBrowser"
        },
        {
            "Title": "Contact",
            "Description": "Primary contact for follow-up regarding feedback.",
            "sp_field_name": "clientContactName",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Contact"
        },
        {
            "Title": "Email",
            "Description": "Email for client follow-up on feedback.",
            "sp_field_name": "clientContactEmail",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Mail"
        },
        {
            "Title": "Response Date",
            "Description": "Date when feedback was submitted.",
            "sp_field_name": "OutcomeDate",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "date disabled",
            "date_format":app_configuration.date_format,
            "display_date_format":app_configuration.display_date_format,
            "field_icon":"CalendarAgenda"
        },
        {
            "Title": "Usage Role",
            "Description": "The client's description of their role in using our services.",
            "sp_field_name": "QID1216014156_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "ContactInfo"
        },
        {
            "Title": "Service Type",
            "Description": "The type of client service(s) we deliver.",
            "sp_field_name": "QID1216014152_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "ChangeEntitlements"
        },
        {
            "Title": "Service Type",
            "Description": "The type of client service(s) we deliver.",
            "sp_field_name": "QID1216014153_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "ChangeEntitlements"
        },
        {
            "Title": "Industry Sector",
            "Description": "The industry sector that best represents the client's organisation.",
            "sp_field_name": "QID1216014146_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "ImagePixel"
        },
        {
            "Title": "Cross-selling",
            "Description": "Potential opportunities for cross-selling additional services.",
            "sp_field_name": "QID1216014161_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "PublicEmail"
        },
        {
            "Title": "Client's Strategic Priorities",
            "Description": "The client's strategic priorities and objectives.",
            "sp_field_name": "QID1216014145_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "BullseyeTarget"
        },        
        {
            "Title": "Client Turnover",
            "Description": "The client's total worldwide revenue in US dollars in its most recently reported financial year",
            "sp_field_name": "QID1216014148_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "AllCurrency"
        },
        {
            "Title": "Listed client",
            "Description": "Indicates if the client is publicly listed.",
            "sp_field_name": "QID1216014155_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Bank"
        },
        {
            "Title": "Employee Count",
            "Description": "The total number of employees employed by the client.",
            "sp_field_name": "QID1216014157_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "People"
        },    
        {
            "Title": "Service Quality",
            "Description": "Rating for overall service quality.",
            "sp_field_name": "QID1216014151_1_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "hide_field": true,
            "field_icon": "FavoriteList"
        },
        {
            "Title": "Responsiveness",
            "Description": "Rating for responsiveness of our team.",
            "sp_field_name": "QID1216014151_2_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "hide_field": true,
            "field_icon": "ReplyAll"
        },
        {
            "Title": "Value Add",
            "Description": "Rating for additional value provided.",
            "sp_field_name": "QID1216014151_3_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "hide_field": true,
            "field_icon": "Like"
        },
        {
            "Title": "Business Understanding",
            "Description": "Rating for our understanding of the client's business.",
            "sp_field_name": "QID1216014151_5_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "hide_field": true,
            "field_icon": "BIDashboard"
        },
        {
            "Title": "Industry Insight",
            "Description": "Rating for our industry-specific insights.",
            "sp_field_name": "QID1216014151_6_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "hide_field": true,
            "field_icon": "PublishCourse"
        },
        {
            "Title": "Project Management",
            "Description": "Rating for our project management.",
            "sp_field_name": "QID1216014151_11_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "hide_field": true,
            "field_icon": "TaskGroup"
        },
        {
            "Title": "Expertise",
            "Description": "Rating for our technical expertise.",
            "sp_field_name": "QID1216014151_15_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "hide_field": true,
            "field_icon": "D365TalentLearn"
        },
        {
            "Title": "Deadline Adherence",
            "Description": "Rating for meeting deadlines.",
            "sp_field_name": "QID1216014151_16_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "hide_field": true,
            "field_icon": "Clock"
        },
        {
            "Title": "Feedback & Ratings",
            "Description": "Key service metrics breakdown",
            "sp_field_name": "feedback_ratings",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder",
            "field_icon": "Feedback"
        },
        {
            "Title": "Overall Satisfaction",
            "Description": "Our overall satisfaction rating on a scale of 1-10.",
            "sp_field_name": "QID1216014154_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "WorkforceManagement"
        },
        {
            "Title": "Recommendation Likelihood",
            "Description": "How likely the client is to recommend our services to others.",
            "sp_field_name": "QID1216014158_Value",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Share"
        },
        {
            "Title": "NPS",
            "Description": "Your Net Promoter Score indicating recommendation likelihood.",
            "sp_field_name": "QID1216014158_NPS_GROUP_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Chart"
        },
        {
            "Title": "Client Relationship",
            "Description": "Our ability to develop and maintain strong client relationships.",
            "sp_field_name": "QID1216014147_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Value for Money",
            "Description": "Feedback on the cost-effectiveness of our services.",
            "sp_field_name": "QID1216014159_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Money"
        },
        {
            "Title": "Improvement Suggestions",
            "Description": "Feedback on how we can enhance your experience.",
            "sp_field_name": "QID1216014150_TEXT_Value",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder"
        },
        {
            "Title": "Enhancement Ideas",
            "Description": "Suggestions for improving our overall service.",
            "sp_field_name": "QID1216014149_TEXT_Value",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder"
        }
    ]
};

let clp_survey_results_field_configuration_v2 = {
    survey_results_fields: [
        {
            "Title": "Ref No.",
            "Description": "Identifier to track this survey response for internal feedback.",
            "sp_field_name": "Title",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Tag"
        },
        {
             "Title": "placeholder",
             "Description": "placeholder",
             "sp_field_name": "placeholder-after-ref-number",
             "sp_field_type": "placeholder",
             "field_width": "full-width",
             "field_validate": false,
             "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        },
        {
            "Title": "Survey Record Selector",
            "Description": "This survey has more than one response attached to the same reference. The client likely responsed twice on the same link, or the survey was completed by more than one person. Select between the survey responses below:",
            "sp_field_name": "surveyResultsDropdown",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values",
            "own_values":[],
            "field_icon": "DoubleBookmark"
        },        
        {
            "Title": "Client",
            "Description": "Client providing the feedback.",
            "sp_field_name": "clientName",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "AccountBrowser"
        },
        {
            "Title": "Contact",
            "Description": "Primary contact for follow-up regarding feedback.",
            "sp_field_name": "clientContactName",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Contact"
        },
        {
            "Title": "Email",
            "Description": "Email for client follow-up on feedback.",
            "sp_field_name": "clientContactEmail",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Mail"
        },
        {
            "Title": "Response Date",
            "Description": "Date when feedback was submitted.",
            "sp_field_name": "OutcomeDate",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "date disabled",
            "date_format":app_configuration.date_format,
            "display_date_format":app_configuration.display_date_format,
            "field_icon":"CalendarAgenda"
        }, 
        {
            "Title": "NPS Description",
            "Description": "Based on your overall relationship with us, how likely are you to recommend Forvis Mazars to a friend or colleague?",
            "sp_field_name": "QID1218456927_NPS_GROUP_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        }, 
        {
            "Title": "NPS Score",
            "Description": "Based on your overall relationship with us, how likely are you to recommend Forvis Mazars to a friend or colleague?",
            "sp_field_name": "QID1218456927",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        }, 
        {
            "Title": "Feedback & Ratings",
            "Description": "Key service metrics breakdown",
            "sp_field_name": "feedback_ratings",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder",
            "field_icon": "Feedback"
        },
        {
            "Title": "Future Experience.",
            "Description": "What can we do to improve your experience in future?",
            "sp_field_name": "QID1218456926_TEXT",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        }, 
        {
            "Title": "What could we do differently.",
            "Description": "What can we do differently that would increase your score to a 9 or 10?",
            "sp_field_name": "QID1218456925_TEXT",
            "sp_field_type": "input",
            "field_width": "input-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        }, 
        {
            "Title": "Valuable Aspects.",
            "Description": "What specific aspects of our service have you found most valuable?",
            "sp_field_name": "QID1218456924_TEXT",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Service Delivery.",
            "Description": "Which of the following statements are the most important to you in our service delivery:",
            "sp_field_name": "QID1218456921_Display",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Overall Satisfaction.",
            "Description": "Overall, how satisfied are you with your experience with Forvis Mazars?",
            "sp_field_name": "QID1218456908_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        },        
        {
            "Title": "Professional Services Firm Feedback.",
            "Description": "So that we can continue to better serve you, please share what is most important to you when working with a professional services firm.",
            "sp_field_name": "QID1218456916_Display",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Professional Services Firm Feedback.",
            "Description": "Other (If applicable).",
            "sp_field_name": "QID1218456916_10_TEXT",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Personal Strategic Priorities.",
            "Description": "Please select the top strategic priorities for you over the next 12 months.",
            "sp_field_name": "QID1218456910_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled hide-field",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Organizational Strategic Priorities.",
            "Description": "Please select the top strategic priorities for your organisation over the next 12 month.",
            "sp_field_name": "QID1218456920_Display",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Organizational Strategic Priorities.",
            "Description": "Other (If applicable).",
            "sp_field_name": "QID1218456920_14_TEXT",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Account Lead Feedback.",
            "Description": "Would you like your account lead to follow up with you on this?",
            "sp_field_name": "QID1218456919_Display",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Procative support.",
            "Description": "To help ensure we proactively support your needs, please select any of the following areas in which you would like additional information or guidance.",
            "sp_field_name": "QID1218456928_Display",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Procative support.",
            "Description": "Other (If applicable).",
            "sp_field_name": "QID1218456928_11_TEXT",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Testimony",
            "Description": "If you are willing to provide us with a short testimonial of your experience of the work we have done for you that could be used publicly",
            "sp_field_name": "QID1218456918_Display",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled hide-field",
            "field_icon": "Teamwork"
        },
        {
            "Title": "Selected platforms (if any)",
            "Description": "Please select if you would be happy for your testimonial to appear on the following",
            "sp_field_name": "QID1218456915_Display",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled hide-field",
            "field_icon": "Teamwork"
        },
        {
            "Title": "If we share your testimonial, how would you like it to be attributed?",
            "Description": "Testimonal Attributed",
            "sp_field_name": "QID1218456911_Display",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled hide-field",
            "field_icon": "Teamwork"
        }
    ]
};
