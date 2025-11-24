let global_field_set_navigation = {    
    "general_section":[
        {
            "Title": "Form Status",
            "Description": "This indicates where you are in your submission process.",
            "sp_field_name": "Form_x0020_Status",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "disabled",  
        },
        {
            "Title": "Holds the list of supporting documents required to be uploaded",
            "Description": " ",
            "sp_field_name": "ListOfRequiredDocumentsJSON",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "none hide-field"
        },       
        {
            "Title": "Requested Office",
            "Description": "The office associated with the request",
            "sp_field_name": "RequestOffice",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties":"single-select-drop-down-external-list remove-duplicates display-field-commenting",
            "additional_filters": "UseInQRMV2 eq '1'",
            "drop_down_title_field": "Title",
            "drop_down_value_field": "Title",
            "drop_down_order_by": "Title asc",
            "list_name": app_configuration.office_list_name,
            "site_context": app_configuration.office_list_site_context,
            "field_icon": "EMI"
        },
        {
            "Title": "Service Type",
            "Description": "The Forvis Mazars service category provided",
            "sp_field_name": "ClientAcceptanceType",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "single-select-choice-column display-field-commenting",        
            "drop_down_order_by": "Title asc",
            "list_name": app_configuration.ac_submission,
            "site_context": app_configuration.site_context,
            "field_icon": "AccountBrowser"
        },
        // Acceptance Or Continuance drop down does not need to be here since this has been split out at the navigation level
        {
            "Title": "Acceptance OR Continuance",
            "Description": "Is this a new client or an assesment of an existing one ",
            "sp_field_name": "AcceptanceOrContinuance",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "single-select-choice-column display-field-commenting",        
            "drop_down_order_by": "Title asc",
            "list_name": app_configuration.ac_submission,
            "site_context": app_configuration.site_context,
            "field_icon": "ReminderTime"
        },
        {
            "Title": "Service Line",
            "Description": "Please select your service line.",
            "sp_field_name": "MazarsServiceLine",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties":"single-select-drop-down-external-list remove-duplicates",
            "additional_filters":"",
            "drop_down_title_field":"Title",
            "drop_down_value_field":"Title",
            "drop_down_order_by": "Title asc",
            "list_name": "MazarsServiceLines",
            "site_context": app_configuration.site_context,
            "field_icon": "ReminderTime"                                  
        },  
        //we will dynamically set the options by reducing the selection based on the service line above selections
        //tricky but whatever
        {
            "Title":"Please select all the services for which this form is being completed",
            "Description":"The options are provided below",
            "sp_field_name":"NatureOfServicesDescription", 
            "sp_field_type":"select", 
            "field_width":"full-width",
            "field_validate":true,
            "drop_down_value_field":"Title",
            "drop_down_title_field":"Title",
            "drop_down_order_by":"Title asc",
            "sp_additional_properties":"single-select-drop-down-external-list multi-select",  // multi select          
            "list_name": app_configuration.list_of_services,
            "site_context": app_configuration.site_context,
           
        },
       /*  {
            // original q: Nature of the client services provided
            "Title": "Please list all the services Forvis Mazars will be providing to the client",
            "Description": "Full detail of all the services provided: monthly accounting and/or management reporting the preparation of annual financial statement; SA and UK transfer pricing services; inventory fraud investigations, etc",
            "sp_field_name": "NatureOfServicesDescription",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "none display-field-commenting",        
            "field_icon": "AccountBrowser"
        },  */
        {
            "Title": "At what status has the A&C been performed?",
            "Description": "Indication of when this AC as submitted",
            "sp_field_name": "StatusPerformed",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "single-select-choice-column display-field-commenting",        
            "drop_down_order_by": "Title asc",
            "list_name": app_configuration.ac_submission,
            "site_context": app_configuration.site_context,
            "field_icon": "AddFriend"
        },
        {
            "Title": "Expected signing date of engagement report?",
            "Description": "The date the engagement report will be signed",
            "sp_field_name": "ExpectedSigningDate",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,  
            "sp_additional_properties":"date display-field-commenting",     
            "date_format":app_configuration.date_format,
            "display_date_format":app_configuration.display_date_format,   
            "field_icon": "CalendarAgenda"
        }, 
        {
            "Title": "Financial Year End",
            "Description": "The year end of the client",
            "sp_field_name": "FinancialYearEnd",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,  
            "sp_additional_properties":"date hide-field display-field-commenting",     
            "date_format":app_configuration.date_format,
            "display_date_format":app_configuration.display_date_format,   
            "field_icon": "CalendarAgenda"
        },  
        {
            "Title": "Period Year End",
            "Description": "The period end of the client",
            "sp_field_name": "PeriodYearEnd",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,  
            "sp_additional_properties":"date hide-field display-field-commenting",     
            "date_format":app_configuration.date_format,
            "display_date_format":app_configuration.display_date_format,   
            "field_icon": "CalendarAgenda"
        },         
        {
            // If AUP ISRS 4400 is selected from NAS Service Line then display
            "Title": "Will a NAS engagement report be issued", 
            "Description": "Please respond below",
            "sp_field_name":"NASReport",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"AccountBrowser"
        },           
        {
            // This appears for both assurance + non assurance within Service Type drop down - the values will have conditionals
            // if ISRE 2400 || ISFRS 4400 => update the serviceType to Non-Assurance
            "Title": "What standard is applicable to the report that will be issued:", 
            "Description": "",
            "sp_field_name": "ApplicableStandard",
            "sp_field_type": "select",
            "field_width": "full-width",
            "field_validate": false,    
            "sp_additional_properties":"single-select-drop-down-external-list multi-select hide-field display-field-commenting",
            "additional_filters":"", 
            "drop_down_title_field":"Title",
            "drop_down_value_field":"Title",
            "drop_down_order_by":"Title asc", 
            "list_name": "ApplicableStandards",
            "site_context": app_configuration.site_context,
        },
        {
            "Title": "You have selected 'Other' on Applicable Standard, please elaborate", // this appears once Other is selected from the ApplicableStandard list of options
            "Description": "",
            "sp_field_name": "ApplicableStandardOther",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "none hide-field display-field-commenting",
            "additional_filters": "",
            "drop_down_title_field": "",
            "drop_down_value_field": "",
            "drop_down_order_by": "",
            "list_name": "",
            "site_context": "",
            "field_icon": "AccountBrowser",

        },  
        {
            "Title": "Selecting the ISA 705 requires you to select the type of modified opinion",
            "Description": "Please note, if 'Disclaimer of Opinion' is selected, the engagement cannot be accepted",
            "sp_field_name":"ApplicableStdModified",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",
            "own_values":["Qualified Opinion","Adverse Opinion", "Disclaimer of Opinion"], 
            // if Disclaimer selected > engagement cannot be selected.
            "field_icon":"Group" 
        },   
        {
            "Title": "What is the financial reporting framework?",  // This only appears once assurance within Service Type is selected
            "Description": "What is the financial reporting framework <br>",
            "sp_field_name": "FinancialReportingFramework",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "single-select-choice-column hide-field display-field-commenting",  
            "drop_down_order_by": "Title asc",
            "list_name": app_configuration.ac_submission,
            "site_context": app_configuration.site_context,
            "field_icon": "AccountBrowser"
        },
        {
            "Title": "You have selected 'Other' on Financial Reporting Framework, please elaborate", 
            "Description": "",
            "sp_field_name": "FinancialReportingFrameworkOther",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "none hide-field display-field-commenting",
            "additional_filters": "",
            "drop_down_title_field": "",
            "drop_down_value_field": "",
            "drop_down_order_by": "",
            "list_name": "",
            "site_context": "",
            "field_icon": "AccountBrowser",

        },        
        {
            // If AUP ISRS 4400 is selected from NAS Service Line then display
            "Title": "Will the AUP report be available publicly", 
            "Description": "Please select",
            "sp_field_name":"AUPPolicy",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",
            "own_values":["No","Yes", "N/A"],
            "field_icon":"CalendarAgenda"
        },       
        {
            // If AUP ISRS 4400 is selected from NAS Service Line then display
            "Title": "Do we only perform AUP for this client and not an audit?",
            "Description": "Please select",
            "sp_field_name":"AUPClient",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",
            "own_values":["No","Yes", "N/A"],
            "field_icon":"CalendarAgenda"
        },    
        {
            "Title": "Country executive approval",
            "Description": "Please attach the decision here",
            "sp_field_name":"country-executive-approval",
            "sp_field_type":"placeholder",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"exclude-from-meta hide-field display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"CalendarAgenda"
        },       
        {
            "Title": "Lead Audit Partner", // This only appears once Non-assurance on exisiting assurance client (Appendix D) within Service Type is selected
            "Description": "Enter an email address",
            "sp_field_name": "LeadAuditPartnerId",
            "sp_field_type": "select",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "number single-select-typeahead hide-field display-field-commenting",        
            "drop_down_title_field":"Title",
            "drop_down_value_field":"Id",
            "list_name": "User Information List",
            "site_context": app_configuration.people_picker_site_context,
            "field_icon": "AccountManagement"
        },
        {
            "Title": "Engagement Partner", // this has been moved from general into Teams
            "Description": "Engagement Partner",
            "sp_field_name": "EngagementPartnerId",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "number single-select-typeahead display-field-commenting",        
            "drop_down_title_field":"Title",
            "drop_down_value_field":"Id",
            "list_name": "User Information List",
            "site_context": app_configuration.people_picker_site_context,
            "field_icon": "AddFriend"
        },
        {
            "Title": "Engagement Manager", // this has been moved from general into Teams
            "Description": "Engagement Manager",
            "sp_field_name": "EngagementManagerId",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "number single-select-typeahead display-field-commenting",        
            "drop_down_title_field":"Title",
            "drop_down_value_field":"Id",
            "list_name": "User Information List",
            "site_context": app_configuration.people_picker_site_context,
            "field_icon": "AddFriend"
        },
        {
            "Title": "Additional Engagement partner information",
            "Description": "Please provide information such as: "+
                "<ul><li>What sector does the EP specialize in</li>"+
                "<li>The experience of the EP</li>"+
                "<li>Rotation considerations</li><li>Any other information that supports the case for why they are the correct EP</li>"+
            "</ul>",
            "sp_field_name": "EngagementPartnerComm",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": true,
            "sp_additional_properties": "none display-field-commenting"        
        },
        {
            "Title": "Name of the client", // This is a drop down selection upon continuance selected within the Acceptance + Continuace field
            "Description": "Add the name of the client",
            "sp_field_name":"ClientName",
            "sp_field_type":"select", // This is an input field once continuance is selected within the acceptance + continuance field
            "field_width":"half-width",
            "field_validate":true,
            "sp_additional_properties":"single-select-typeahead allow-own-values plain-text-field display-field-commenting",
            "additional_filters":"",
            "drop_down_title_field":"M_ClientName",
            "drop_down_value_field":"M_ClientName",
            "drop_down_order_by":"Title asc",
            "list_name":app_configuration.client_list_name,
            "site_context":app_configuration.client_list_site_context,
            "field_icon": "AccountManagement"
        },     
        {
            "Title":"Client task code",
            "Description":"All active task codes are listed. If the correct task code does not appear, "+
                "please select not applicable and follow process to have it opened on GreatSoft."+
                "<br/><b>*Note</b> - for a continuance, 'not applicable' is not an option",
            "sp_field_name":"ClientTaskCode",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,           
            "sp_additional_properties": "display-field-commenting",
        },       
        {
            "Title": "Template Selection",
            "Description": "You can use the selected template to pre-populate your acceptance request",
            "sp_field_name": "template-selector",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties":"single-select-drop-down-external-list hide-field exclude-from-meta",
            "additional_filters": "ClientAcceptanceType eq 'Template'",
            "drop_down_title_field": "ClientName",
            "drop_down_value_field": "Id",
            "drop_down_order_by": "ClientName asc",
            "list_name": app_configuration.ac_submission,
            "site_context": app_configuration.site_context,
            "field_icon": "EMI"
        },
        { // Displays once Service Type is non-assurance + continuance selected
            "Title": "Convert the holding \ group company name to a new entity name", // hide when not assurance + continuance
            "Description": "You can copy a holding \ group company's risk profile and convert the submission into a single entity record. Add the new entity name below.",
            "sp_field_name": "entityName",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "none hide-field display-field-commenting",
            "additional_filters": "",
            "drop_down_title_field": "",
            "drop_down_value_field": "",
            "drop_down_order_by": "",
            "list_name": "",
            "site_context": "",
            "field_icon": "AccountBrowser"
        },
        {
            "Title": "What is the company identification number? (examples are: Clients tax number / company registration number / CC number, NPO number, trust number)",
            "Description": "Company identification number; examples: Clients tax number / company registration number / CC number, NPO number, trust number.",
            "sp_field_name": "ClientRegOrTaxNumber",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "none display-field-commenting",            
            "field_icon": "NumberField"
        },   
        {
            "Title": "Will a new engagement letter be issued?",
            "Description": "Please indicate below",
            "sp_field_name": "NewEngagementUtilized",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",          
            "own_values":["Yes","No"],
            "field_icon":"MapPin"            
        },    
        {
            "Title": "Which Audit software package was used for this engagement?",
            "Description": "",
            "sp_field_name":"AuditSoftwarePackageUsed",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"radio-buttons-own-values hide-field ",
            "own_values":["ATLAS NextGen", "CaseWare working papers","Not Applicable"],
            "field_icon":"AccountManagement"
        }, 
        {
            "Title": "Create",
            "Description": "Create",
            "sp_field_name": "client-risk-assessments-create-button",
            "sp_field_type": "button",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties":"exclude-from-meta hide-details",
        },
        {
            "Title": "Next",
            "Description": "Next",
            "sp_field_name": "client-assessment-general-next",
            "sp_field_type": "button",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties":"exclude-from-meta hide-details hide-field",
        }
    ],    
    "team_information" :[    
    {
        "Title": "Are you using subcontractors to assist in delivering the engagement",
        "Description": "",
        "sp_field_name":"subcontractors",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"Group" 
    },
    // if yes is selected then the textbox should appear
    {
        "Title": "Please share details on extent of work to be performed by subcontractor, who is the subcontractor and what oversight and review is planned over the work done by the subconctractor",
        "Description": "",
        "sp_field_name": "subcontractorsComm",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": true,
        "sp_additional_properties": "hide-field"        
    },
    {
        "Title": "Does the team have capacity to take on this engagement",
        "Description": "Please select",
        "sp_field_name":"TeamHasCapacity",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"Group" 
    },
    {
        "Title": "Does the team have the skills to take on this engagement",
        "Description": "Please select",
        "sp_field_name":"TeamHasSkills",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"AddGroup"
    },
    {
        "Title": "Client Industry",
        "Description": "Please select an industry",
        "sp_field_name": "ClientIndustry",
        "sp_field_type": "select",
        "field_width": "full-width",
        "field_validate": true,
        "sp_additional_properties":"single-select-drop-down-external-list display-field-commenting",
        "additional_filters": "",
        "drop_down_title_field": "Title",
        "drop_down_value_field": "Title",
        "drop_down_order_by": "Title asc",
        //"list_name": app_configuration.list_of_industries, // this is not pulling correctly through
        "list_name": app_configuration.list_of_industries, 
        "site_context": app_configuration.site_context,
        "field_icon": "EMI"
    },    
    // 22/01 decided that this could be merged with teh below question
    {
        "Title": "Do you require the use of a specialist", // Please select the specialist required(if any): 16/02 as per asana subtasks update this question
        "Description": "To determine if you require the use of specialists, refer to policies SP001 The use of a tax specialist in assurance engagements; SP003 The use of a forensic specialist in assurance engagements; SP004 The use of a corporate finance specialist in assurance engagements; SP005 The use of a Governance specialist in assurance engagements. The policies can be found via this "+
                        "<a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRMTechnicalLibraryandApps/New content for Tech Library/Forms/AllItems.aspx?ga=1&id=%2Fsites%2FZAF%2DQRMTechnicalLibraryandApps%2FNew%20content%20for%20Tech%20Library%2FQuality%20Management%2FPolicies%20%26%20Processes%2F05%2E%20Engagement%20performance&viewid=839f1978%2D1924%2D4f8a%2Dbbad%2Dd4474fad733f'>link</a>.",
        "sp_field_name": "SpecialistsRequired",
        "sp_field_type": "select",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties":"single-select-drop-down-external-list multi-select display-field-commenting",
        "additional_filters":"", 
        "drop_down_title_field":"Title",
        "drop_down_value_field":"Title",
        "drop_down_order_by":"DisplayOrder asc",       
        "list_name": "ListOfSpecialists",
        "site_context": app_configuration.site_context        
    },  
    {
        // if the above other is selected - the user needs to fill out this comment box
        "Title": "What type of other specialist is on your engagement team?",
        "Description": "",
        "sp_field_name": "SpecialistComments",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": true,
        "sp_additional_properties": "none hide-field"         
    },   
    {
        "Title": "Back",
        "Description": "",
        "sp_field_name": "sp-back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details display-field-commenting",
    },
    {
        "Title": "Next",
        "Description": "",
        "sp_field_name": "sp-next-eqr_appointment-form-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details display-field-commenting",
    }
    ],
    "eqr_appointment_form": [
        // START ======= Form Fields for the EQR Appointment Form only appears when yes is selected on EQR Calculator
    {
        "Title": "Is your engagement an audit or review of a listed company's interim financial information?",
        "Description": "Please select",
        "sp_field_name":"EQRAppointment1",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No"], 
        "field_icon":"AccessibiltyChecker"
    },
    {
        "Title": "Is your engagement an audit of the financial information of a banking institution or an insurance company (excluding brokers and insurance agents)?",
        "Description": "Please select",
        "sp_field_name":"EQRAppointment2",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No"], 
        "field_icon":"AccessibiltyChecker"
    },
    {
        "Title": "Is your engagement an assurance engagement for a forecast of financial information of a listed company (unless the engagement is subject to Reporting Accountant Specialist review by a partner that is not the engagement partner)?",
        "Description": "Please select",
        "sp_field_name":"EQRAppointment3",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No"], 
        "field_icon":"AccessibiltyChecker"
    },
    {
        "Title": "Is your engagement an assurance engagement for the pro forma financial effects of transactions of a listed company (unless the engagement is subject to Reporting Accountant Specialist review by a partner that is not the engagement partner?",
        "Description": "Please select",
        "sp_field_name":"EQRAppointment4",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No"], 
        "field_icon":"AccessibiltyChecker"
    },
    {
        "Title": "Is your engagement a fairness opinion issued for a listed company?",
        "Description": "Please select",
        "sp_field_name":"EQRAppointment5",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No"], 
        "field_icon":"AccessibiltyChecker"
    },
    {
        "Title": "Is your engagement one that requires an EQR to be performed by way of law or regulation, or by the Auditor General (AG) in the case of public sector work?",
        "Description": "Please select",
        "sp_field_name":"EQRAppointment6",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No"], 
        "field_icon":"AccessibiltyChecker"
    },
    {
        "Title": "Is your engagement any other assignment of the firm which includes conclusions drawn from critical judgements and which results in an engagement report being issued, that in the opinion of the leadership structure, requires a EQR?",
        "Description": "Please select",
        "sp_field_name":"EQRAppointment7",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No"], 
        "field_icon":"AccessibiltyChecker"
    },
    // new field as per kyla's email 05/12
    {
        "Title": "A voluntary EQR is preferred?",
        "Description": "Selecting 'Yes' will ensure that the EQR approval will be set to required.",
        "sp_field_name":"EQRAppointment8",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No"], 
        "field_icon":"AccessibiltyChecker"
    },
    // END   ======= Form Fields for the EQR Appointment Form only appears when yes is selected on EQR Calculator
    {
        "Title": "EQR Status",
        "Description": "",
        "sp_field_name":"eqrIsRequiredStatus",
        "sp_field_type": "input",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "disabled display-field-commenting", 
    },
    {
        "Title": "EQR Override",
        "Description": "",
        "sp_field_name":"isEqrOverride",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",
        "own_values":["Yes","No"], 
        "field_icon":"AccessibiltyChecker"
    },
    {
        "Title": "Reason for overriding the EQR?",
        "Description": "",
        "sp_field_name": "reasonForEQROverride",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none hide-field display-field-commenting"         
    },
    {
        "Title": "If an EQR is not stated as required by the form however an EQR has been requested then select Yes below",
        "Description": "Please select",
        "sp_field_name":"EQRNotStated",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",
        "own_values":["Yes","No"], 
        "field_icon":"AccessibiltyChecker"
    },
    // this question is updated from the team info > 
    {
        "Title": "EQR Type",
        "Description": "Please select the EQR Type",
        "sp_field_name":"eqrCalculatorType",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",
        "own_values":["Internal","External"], // if yes is selected the EQR Appointment Form should display
        "field_icon":"AccessibiltyChecker"
    },
    // move / replace this with EQR parnter based on whether internal or external was selected.
    {
        "Title": "Enter the partner name that will be the reviewer",
        "Description": "Please enter the Partner who is appointed as the EQR. If no partner has been appointed yet, please enter 'TBC by CRM Allocation'",
        "sp_field_name": "internalEqrPartner",
        "sp_field_type": "select",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "allow-own-values single-select-typeahead hide-field plain-text-field display-field-commenting",        
        "drop_down_title_field":"Title",
        "drop_down_value_field":"Title",
        "list_name": "User Information List",
        "site_context": app_configuration.people_picker_site_context,
        "field_icon": "AccountBrowser"    
    },
    {
        "Title": "Back",
        "Description": "",
        "sp_field_name": "sp_back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Next",
        "sp_field_name": "sp_next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"exclude-from-meta hide-details",
    }
    ],
    "client_information_fields": [
        {
        "Title": "Client Group",
        "Description": "The group assigned to the client from greatsoft",
        "sp_field_name": "M_ClientGroup",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"disabled display-field-commenting",     
        "field_icon": "MapPin"
        },
    {
        "Title": "Client Name",
        "Description": "The name assigned to the client from greatsoft",
        "sp_field_name": "M_ClientName",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"disabled display-field-commenting",     
        "field_icon": "MapPin"
    },
    {
        "Title": "Client Code",
        "Description": "The code assigned to the client from greatsoft",
        "sp_field_name": "M_ClientCode",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"disabled display-field-commenting",     
        "field_icon": "MapPin"
    },
    {
        "Title": "Client Address",
        "Description": "The address assigned to the client from greatsoft",
        "sp_field_name": "M_ClientCode",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"disabled display-field-commenting",     
        "field_icon": "MapPin"
    },
    {
        "Title": "Client Email",
        "Description": "The email assigned to the client from greatsoft",
        "sp_field_name": "M_ClientCode",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"disabled display-field-commenting",     
        "field_icon": "MapPin"
    },
    {
        "Title": "Client Partner",
        "Description": "The email assigned to the client from greatsoft",
        "sp_field_name": "M_ClientPartner",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"disabled display-field-commenting",     
        "field_icon": "MapPin"
    },
    {
        "Title": "Client Tax Number",
        "Description": "The tax number assigned to the client from greatsoft",
        "sp_field_name": "M_ClientTaxNumber",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"disabled display-field-commenting",     
        "field_icon": "MapPin"
    },
    {
        "Title": "Client ID Number",
        "Description": "The ID Number assigned to the client from greatsoft",
        "sp_field_name": "M_ClientIDNumber",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"disabled display-field-commenting",     
        "field_icon": "MapPin"
    },
    {
        "Title": "Client Classificaion",
        "Description": "Any sectors that the client is apart of",
        "sp_field_name": "M_ClientClassification",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"disabled display-field-commenting",     
        "field_icon": "MapPin"
    },
    {
        "Title": "Back",
        "Description": "Upload",
        "sp_field_name": "sp_back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Upload",
        "sp_field_name": "sp_next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },

    ],

    "general_overview_fields":[
    {
        "Title":"General Information about the Engagement",
        "Description":"",
        "sp_field_name":"PIEHelpFile",
        "sp_field_type":"Placeholder",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties": "placeholder exclude-from-meta",
    },
    {
        "Title": "Client Service Line", // add this to a business rule for NAS
        "Description": "Please select the appropriate service that the client utilizes.",
        "sp_field_name": "ClientServiceLine",
        "sp_field_type": "select",
        "field_width": "full-width",
        "field_validate": false,    
        "sp_additional_properties":"single-select-drop-down-external-list display-field-commenting hide-field",
        "additional_filters":"", 
        "drop_down_title_field":"Title",
        "drop_down_value_field":"Title",
        "drop_down_order_by":"Title asc", 
        "list_name":"NASListOfServices",
        "site_context": app_configuration.site_context        
    }, 
    {
        "Title": "Client Service Type", // add this to a business rule for NAS
        "Description": "Please select the appropriate type that the client utilizes.",
        "sp_field_name": "ClientServiceType",
        "sp_field_type": "select",
        "field_width": "half-width",
        "field_validate": false,    
        "sp_additional_properties":"single-select-drop-down-external-list display-field-commenting hide-field",
        "additional_filters":"", 
        "drop_down_title_field":"Title",
        "drop_down_value_field":"Title",
        "drop_down_order_by":"Title asc", 
        "list_name":"ClientServices",
        "site_context": app_configuration.site_context        
    }, 
    {
        "Title": "Nature of Client", // add this to a business rule for NAS
        "Description": "The nature of the client",
        "sp_field_name": "NatureOfClient",
        "sp_field_type": "select",
        "field_width": "half-width",
        "field_validate": false,    
        "sp_additional_properties":"single-select-drop-down-external-list display-field-commenting hide-field",
        "additional_filters":"", 
        "drop_down_title_field":"Title",
        "drop_down_value_field":"Title",
        "drop_down_order_by":"Title asc", 
        "list_name":"NatureOfClient",
        "site_context": app_configuration.site_context        
    }, 
    {
        "Title": "Client Address",
        "Description": "The operational address of the client",
        "sp_field_name": "ClientAddress",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties":"hide-field",     
        "field_icon": "MapPin"
    },
    {
        "Title": "Name of the client's group (if applicable)",
        "Description": "Name of the client's group (if applicable)",
        "sp_field_name": "ClientGroup",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "none display-field-commenting",
        "additional_filters": "",
        "drop_down_title_field": "",
        "drop_down_value_field": "",
        "drop_down_order_by": "",
        "list_name": "",
        "site_context": "",
        "field_icon": "AccountBrowser"
    },    
    {
        "Title": "Country of origin of the client",
        "Description": "(individual's country of residency or an entity's country of incorporation)",
        "sp_field_name": "ClientCountry",
        "sp_field_type": "select",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"single-select-drop-down-external-list remove-duplicates display-field-commenting",
        "additional_filters": "",
        "drop_down_title_field": "Title",
        "drop_down_value_field": "Title",
        "drop_down_order_by": "Title asc",
        "list_name": app_configuration.list_of_countries,
        "site_context": app_configuration.site_context,
        "field_icon": "AddOnlineMeeting"
    },
    {
        "Title": "Client black-listed or appears on any sanctions lists",
        "Description": "Client black-listed or appears on any sanctions lists <br>"+ //isBlackListed
                        "If it is a South African entity, you can refer to the sanctions list on the RED" +
                        "<br><a target='_blank' href='"+app_configuration.ac_client_black_listed_link+"'>Link<a/>", 
        "sp_field_name":"IsBlackListed",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"MapPin"
    },
    {
        "Title":"Please perform an online search to see if the client is blacklisted",
        "Description":"",
        "sp_field_name":"onlineBlacklisted",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none hide-field display-field-commenting",        
        "field_icon": "AccountBrowser"
    },
    /*
    //removed as per ticket 778 2024-09-05    
    {
        "Title": "Does the client operate in a country regarded as a tax haven or non-cooperative tax jurisdictions?",
        "Description": "EU List of Non-Cooperative Tax Jurisdictions<br>All our clients, both EU and non EU entities, are required to be checked and confirmed as NOT part of EU List of Non-Cooperative Tax Jurisdictions list.<br>The overall goal of the EU list is to improve good tax governance globally, and to ensure that the EU's international partners respect the same standards as EU Member States do. The list is a result of a thorough screening and dialogue process with non-EU countries, to assess them against agreed criteria for good governance. These criteria relate to tax transparency, fair taxation, the implementation of OECD BEPS measures and substance requirements for zero-tax countries. The criteria were agreed by Member States at the November 2016 ECOFIN and used as the basis for a screening 'scoreboard'.<br>Please contact Risk@mazars.co.za if this client is operating in a country regarded as a tax haven below more detail the same as the restricted entity questions"+
                        "<br>Refer to the Firm's client database to confirm that the entity is not on the Restricted entity database. Google may also be used to determine if the company is operating in a country regarded as a tax haven."+
                        "<br><a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/:x:/r/sites/ZAF-QRMTechnicalLibraryandApps/_layouts/15/Doc.aspx?sourcedoc=%7B22FC217A-44A9-49AF-955D-43C124FAD40A%7D&file=Firm%20Client%20Database.xlsx&action=default&mobileredirect=true'>Link to firm database</a>",
        "sp_field_name":"IsTaxHaven",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"MapPin"
    },*/
    {
        "Title": "Tax residency of the client",
        "Description": "Tax residency of the client<br/>",
        "sp_field_name": "ClientTaxResidency",
        "sp_field_type": "select",
        "field_width": "half-width",
        "field_validate": true,
        "sp_additional_properties":"single-select-drop-down-external-list remove-duplicates display-field-commenting",
        "additional_filters": "",
        "drop_down_title_field": "Title",
        "drop_down_value_field": "Title",
        "drop_down_order_by": "Title asc",
        "list_name": app_configuration.list_of_countries,
        "site_context": app_configuration.site_context,
        "field_icon": "NumberField"
    },
    {
        "Title": "Country of origin of the group - holding entity's country of incorporation (if applicable)",
        "Description": "Select a country",
        "sp_field_name": "ClientGroupCountry",
        "sp_field_type": "select",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"single-select-drop-down-external-list remove-duplicates display-field-commenting",
        "additional_filters": "",
        "drop_down_title_field": "Title",
        "drop_down_value_field": "Title",
        "drop_down_order_by": "Title asc",
        "list_name": app_configuration.list_of_countries,
        "site_context": app_configuration.site_context,
        "field_icon": "MapPin"
    },    
    {
        "Title":"List of entities involved in proposed engagement or to whom services will be rendered",
        "Description":"",
        "sp_field_name":"EntitiesList",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"display-field-commenting hide-field"   
    }, 
    {
        "Title":"Proposed Fee?",
        "Description":"",
        "sp_field_name":"OtherServicesProposedFee",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"format-thousand-separator format-thousand-separator-comma display-field-commenting",      
        "field_icon":"ReminderPerson" 
    }, 
    {
        "Title":"Is the client a natural person?",
        "Description":"Please select Yes or No",
        "sp_field_name":"IsNaturalPerson",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["Yes","No"],
        "field_icon":"ProductionFloorManagement" 
    }, 
    {
        "Title":"Please select the relevant source of funds.",
        "Description":"Please select all that apply",
        "sp_field_name":"SourceOfFunds", 
        "sp_field_type":"select", 
        "field_width":"full-width",
        "field_validate":true,
        "drop_down_value_field":"Title",
        "drop_down_title_field":"Title",
        "drop_down_order_by":"Title asc",
        "sp_additional_properties":"single-select-drop-down-external-list multi-select",  // multi select          
        "list_name": "SourceOfFunds",
        "site_context": app_configuration.site_context,
        // "field_icon":"AccountManagement" 
    },
    {
        "Title": "What is the source of funds?",
        "Description": "Source of funds means the origin of funds that will be used by the client in conducting a single transaction or which a prospective client is expected to use in concluding transactions in the course of a business relationship.",
        "sp_field_name": "SourceOfFundsOther",
        "sp_field_type": "input",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "hide-field",
        "field_icon": "AccountBrowser"            
    },   
    {
        "Title":"Company listed in the United States (including both subsidiaries and parent company)?",
        "Description":"Confirm classification with the audit or group audit team.",
        "sp_field_name":"IsListedInUSA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes","N/A"],
        "field_icon":"ReminderPerson" 
    }, 
    {
        "Title":"Has audit committee approval been obtained for this non-assurance service engagement?",
        "Description":"Confirm with the audit/group audit team.",
        "sp_field_name":"AuditCommiteeApproval",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes","N/A"],
        "field_icon":"ReminderPerson" 
    },  
    {
        "Title":"Are non-assurance services being performed for this client by the firm?",
        "Description":"If non-assurance services are being provided to the assurance client, "+
        "please complete the Fees Considerations section to assess the level of NAS fees in relation to assurance fees.",
        "sp_field_name":"nonAssuranceServicePerformed",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ReminderPerson" 
    }, 
    {
        "Title":"Are the fees from the non-audit services significant when compared to the audit fee that it creates a self-interest threat?",
        "Description":"Confirm with the audit/group audit team.",
        "sp_field_name":"IsSelfInterestThreat",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",
        "own_values":["No","Yes","N/A"],
        "field_icon":"ReminderPerson" 
    },
    {
        "Title":"Please select your Appendix D engagement Partners",
        "Description":"Once this submission has been approved, the system will automatically notify these partners to complete thier Appendix D forms.",      
        "sp_field_name": "AppendixDEngagagementPartnersId",
        "sp_field_type": "select",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "multi-select-typeahead-for-lookup-or-people-picker",        
        "drop_down_title_field":"Title",
        "drop_down_value_field":"Id",
        "list_name": "User Information List",
        "site_context": app_configuration.people_picker_site_context       
    },
    {
        "Title": "Back",
        "Description": "Upload",
        "sp_field_name": "sp_back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Upload",
        "sp_field_name": "sp_next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ],
 
    "PIE":[
    {
        "Title":"QP 000.2 - Definitions",
        "Description":"A firm shall treat an entity as a public interest entity when it falls within any of the following categories:<br/>"+
            "(a) A publicly traded entity;<br/>"+
            "(b) An entity one of whose main functions is to take deposits from the public;<br/>"+
            "(c) An entity one of whose main functions is to provide insurance to the public; or<br/>"+
            "(d) An entity specified as such by law, regulation or professional standards to meet the purpose described in paragraph 400.15.<br/>"+
            "<br/><br/>"+
            "The categories of Public Interest Entities in (b) and (c) above are further explicitly "+
                "defined into the below categories, per the Code:<br/>"+
            "(a) Publicly traded entities. <br/>"+
            "(b) Public entities listed in Schedule 2 of the Public Finance Management Act <br/>"+
            "No. 1 of 1999, excluding any subsidiary or entity under the ownership control9 "+
            "of these public entities. <br/>"+
            "(c) Other public entities or institutions, as referred to in Section 4(3) of the Public "+
            "Audit Act No. 25 of 2004, including any subsidiary or entity under the "+
            "ownership control of these public entities and public entities listed in (b) above, "+
            "authorised in terms of legislation to receive money for a public purpose: <br/>"+
            "(i) with annual expenditure in excess of R5 billion; or <br/>"+
            "(ii) that are responsible for the administration of funds for the benefit of the "+
            "public in excess of R10 billion as at financial year-end. <br/>"+
            "(d) Universities, as defined in the Higher Education Act No. 101 of 1997, excluding "+
            "private universities registered in terms of that Act. <br/>"+
            "(e) Banks, as defined in the Banks Act No. 94 of 1990, and Mutual Banks, as "+
            "defined in the Mutual Banks Act No. 124 of 1993. <br/>"+
            "(f) Market infrastructures, as defined in the Financial Markets Act No. 19 of 2012. <br/>"+
            "(g) Insurers, as defined in the Insurance Act No. 18 of 2017. <br/>"+
            "(h) Collective Investment Schemes, including hedge funds, as defined in the "+
            "Collective Investment Schemes Control Act No. 45 of 2002, that hold assets in "+
            "excess of R30 billion.<br/>"+
            "(i) Funds, as defined in the Pension Funds Act No. 24 of 1956, that hold or are "+
            "otherwise responsible for safeguarding client assets in excess of R30 billion.<br/>"+
            "(j) Pension Fund Administrators, in terms of Section 13B of the Pension Funds "+
            "Act No. 24 of 1956, with total assets under administration in excess of "+
            "R30 billion.<br/>"+
            "(k) Financial Services Providers, as defined in the Financial Advisory and "+
            "Intermediary Services Act No. 37 of 2002, holding financial products and funds "+
            "on behalf of clients in excess of R30 billion.<br/>"+
            "(l) Medical Schemes, as defined in the Medical Schemes Act No. 131 of 1998, "+
            "with a membership in excess of 89 000 beneficiaries as at financial year-end. <br/>"+
            "(m) Authorised users of an exchange, as defined in the Financial Markets Act No. "+
            "19 of 2012, that hold or are otherwise responsible for safeguarding client "+
            "assets in excess of R30 billion.<br/>"+
            "(n) Other issuers of debt and equity instruments to the public (“the public” shall mean the public in "+
                "general or large sectors of the public,"+
            "such as participants in Broad-Based Black Economic Empowerment schemes or participants in offers to large "+
            "industry sectors that result in the debt or equity instruments being owned by a large number and wide range of "+
            "stakeholders)",        
        "sp_field_name":"PIEHelpFile",
        "sp_field_type":"Placeholder",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties": "placeholder exclude-from-meta",
    },
    {
        //"Title":"Is the client listed?", renamed
        "Title":"Is the client listed on any worldwide exchange e.g. Johannesburg Stock Exchange, London Stock Exchange?",
        "Description":"",
        "sp_field_name":"IsListedClient",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ReminderPerson" 
    },
    // FYI: As requested to be removed from all submission types, commenting out for now incase they want it back
    // {
    //     "Title":"Is this a KYC Client?",
    //     "Description":"Is this a KYC Client",
    //     "sp_field_name":"IsKYCClient",
    //     "sp_field_type":"input",
    //     "field_width":"half-width",
    //     "field_validate":true,
    //     "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
    //     "own_values":["No","Yes","N/A"],
    //     "field_icon":"ReminderPerson" 
    // },    
    {
        "Title":"SEC registrant",
        "Description":"If your client is an SEC registrant or a subsidiary of an SEC registrant, or if your audit is being performed under PCAOB standards"+
            ", please contact the US Desk (<a target='_blank' href='"+app_configuration.ac_us_desk_link+"'>usdesk@mazars.fr)</a>) for guidance",
        "sp_field_name":"IsSECRegistrant",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"AccountBrowser" 
    },
    {
        "Title":"Does your client have Russian entities/UBO's in the chain of control?",
        "Description":"Please respond accordingly.",
        "sp_field_name":"HasRussianEntities",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"AccountBrowser" 
    },
    {
        "Title":"Is your client sector in the caution or the watchlist list?",
        "Description":"Risk appetite: Please review the risk appetite policy <a target='_blank' href='"+app_configuration.ac_risk_appetite_policy_link+"'>here</a>.",
        "sp_field_name":"HasRiskAppetite",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"AccountBrowser" 
    },
    {
        "Title":"Is your client a subsidiary of a SEC registrant?",
        "Description":"Please respond accordingly.",
        "sp_field_name":"IsSECSubsidiary",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"AccountBrowser" 
    },  
    {
        "Title":"Other PIE entities",
        "Description":"Other PIE entities",
        "sp_field_name":"OtherPieEntities",
        "sp_field_type":"input",
        "field_width":"half-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ReminderPerson" 
    },
    {
        "Title": "Explain the reasons for other PIE classification.",
        "Description": "Explain the reasons for other PIE classification.",
        "sp_field_name": "PIEclassification",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none display-field-commenting hide-field",
        "additional_filters": "",
        "drop_down_title_field": "",
        "drop_down_value_field": "",
        "drop_down_order_by": "",
        "list_name": "",
        "site_context": "",
    }, 
    {
        "Title":"Is this a digital asset sector engagement?", 
        // if yes is selectded then the engagement is automatically rated as "RISKY ENGAGEMENT" and requires all approvals
        // This should be flagged as a warning and saved on the form submission
        "Description":"Service agreement with a client transacting in the digital asset sector.",
        "sp_field_name":"CryptoEngagment",
        "sp_field_type":"input",
        "field_width":"half-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"Money" 
    },
    {
        "Title":"Is this a SPAC Engagement? (Special Purpose Acquisition Companies)", // this should display for ASSURANCE only
        "Description":"",
        "sp_field_name":"SPACEngagment",
        "sp_field_type":"input",
        "field_width":"half-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"Money" 
    },
    {
        "Title":"Is this a reporting Accountant (IPO) engagement?", // this should display for ASSURANCE only
        "Description":"",
        "sp_field_name":"IPOEngagment",
        "sp_field_type":"input",
        "field_width":"half-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"Money" 
    },
    // START == MOVE THIS INTO THE RISK STATUS
    {
        "Title":"Transnational Calculator",
        "Description":"Transnational services<br>Services that are or may be relied upon outside the entity's home jurisdiction for purposes of significant lending, investment or regulatory decisions;<br>this will include services to companies with listed equity or debt and other public interest entities which attract particular public attention because of their size, products or services provided. See details in the definitions policy and TAC guidance statement using the links above.",
        "sp_field_name":"IsTransnational",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties": "disabled display-field-commenting",     
        "field_icon":"ChangeEntitlements" 
    }, 
    {
        "Title":"s90 Calculator",
        "Description":"If any of the answers are 'Yes' for the questions the Section 90 Considerations applies",
        "sp_field_name":"s90Calculator",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties": "disabled display-field-commenting",     
        "field_icon":"ChangeEntitlements" 
    }, 
    {
        "Title":"Fee Considerations Outcome",
        "Description":"This outcome is based on the Fee Consideration Calculator",
        "sp_field_name":"feeConsiderations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties": "disabled display-field-commenting",     
        "field_icon":"ChangeEntitlements" 
    },  
    {
        "Title":"Did you review the restricted Entity Database?",
        "Description":"Using the <a target='_blank' href='"+app_configuration.firm_client_database_link+"'>link</a> to review the firm client database<br>Restricted entities - these are our global listed clients if you are going to perform any work on these clients, please chat to QRM.<br> All Forvis Mazars Assurance clients - if you are going to be offering Non Assurance Services (NAS) to them please complete an Appendix D.<br> All Forvis Mazars Non Assurance clients - if you are going to be offering services to them, please consider independence concerns and if you are performing assurance work on existing NAS clients, please consider cooling off periods.<br> All Forvis Mazars Appendix D services - which are NAS on existing Assurance clients. ",
        "sp_field_name":"IsClientRestrictedEntity",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"EMI" 
    },
    /*
    removed ticket 842 
    {
        "Title":"Is the client a restricted supplier?",
        "Description":" List of National Treasury's restricted suppliers<br>Please contact Risk@mazars.co.za if this client is a restricted supplier<br>National Treasury's restricted suppliers<br>All our clients, both private and public entities, are required to be checked and confirmed as NOT part of National Treasury's restricted suppliers list.<br><br>The National Treasury's database on the list of restricted suppliers is applicable to all national and provincial departments, constitutional institutions and public entities as defined in schedule 3A and 3C of the Public Finance Management Act (PFMA). Treasury Regulation 16A9.1(c) requires accounting officers/ authorities to: <br>check the National Treasury's database prior to awarding any contract to ensure that no recommended bidder, nor any of its directors, are listed as companies or persons prohibited from doing business with the public sector."+
                        "Using the <a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/:x:/r/sites/ZAF-QRMTechnicalLibraryandApps/_layouts/15/Doc.aspx?sourcedoc=%7B22FC217A-44A9-49AF-955D-43C124FAD40A%7D&file=Firm%20Client%20Database.xlsx&action=default&mobileredirect=true&wdLOR=c5D998249-37A8-4F10-BDD1-13107A72007E'>link</a>, review the firm client database to confirm that the entity is not on the Restricted Entity Database",
        "sp_field_name":"IsClientRestrictedSupplier",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"BusinessCenterLogo" 
    },
    {
        "Title":"Is the client on the UN sanctions list?",
        "Description":" The United Nations 1718 Sanctions List<br>Please contact Risk@mazars.co.za if this client is a restricted entity<br>Implementation of the UN Security Council Resolutions<br>South Africa is a member state and all our clients, are required to be checked and confirmed as NOT part of the UN 1718 Sanctions List.<br><br>Providing for financial sanctions which entail the identification of persons or entities against whom member states of the United Nations must take the actions specified in the resolution. The resolution explains:<br>• No person may, directly or indirectly, in whole or in part, and by any means or method:<br>– Acquire, collect, use, possess or own property;<br>– Make available any financial or other service; and<br>– Make available economic support.<br>- Requirements to freeze property and transactions of identified natural and legal persons.",
        "sp_field_name":"IsClientUnSanctioned",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"AccountBrowser" 
    },
    {
        "Title":"Is client high-risk and other monitored jurisdictions?",
        "Description":"Please contact Risk@mazars.co.za if this client is a restricted entity<br>"+
            " FATF List of high-risk and other monitored jurisdictions. "+ 
            "<br><br>South Africa is a member of FATF and all our clients, are required to be checked and confirmed as "+
            " NOT part of the FATF List of high-risk and other monitored jurisdictions.<br><br>The Financial Action Task Force (FATF) "+
            "is the global standard setting body for anti-money laundering and combating the financing of terrorism (AML/CFT). "+
            "In order to protect the international financial system from money laundering and financing of terrorism (ML/FT) "+
            "risks and to encourage greater compliance with the AML/CFT standards, the FATF identified jurisdictions that have "+
            "strategic deficiencies and works with them to address those deficiencies that pose a risk to the international financial system."+
            "<br>South Africa is also a member of the Eastern and Southern Africa Anti-Money Laundering Group (ESAAMLG) and their purpose "+
            "is to combat money laundering by implementing the FATF Recommendations."+
                        "Using the <atarget='_blank' href='https://mazarsglobalcloud.sharepoint.com/:x:/r/sites/ZAF-QRMTechnicalLibraryandApps/_layouts/15/Doc.aspx?sourcedoc=%7B22FC217A-44A9-49AF-955D-43C124FAD40A%7D&file=Firm%20Client%20Database.xlsx&action=default&mobileredirect=true&wdLOR=c5D998249-37A8-4F10-BDD1-13107A72007E'>link</a>, "+
                        "review the firm client database to confirm that the entity is not a high risk entity",
        "sp_field_name":"IsClientHighRisk",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ArrangeByFrom" 
    },
    */    
    {
        "Title":"Was there a previous firm appointed in the prior year?", 
        "Description":"",
        "sp_field_name":"PreviousFirmAppointed",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"AccountBrowser" 
    },    
    {
        "Title":"Did the previous auditor sign off their audit report?", 
        "Description":"",
        "sp_field_name":"PreviousAuditSignOff",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting hide-field",
        "own_values":["No","Yes"],
        "field_icon":"AccountBrowser" 
    },
    {
        "Title":"Are you taking over in the middle of the engagement?", 
        "Description":"",
        "sp_field_name":"AuditTakeover",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting hide-field",
        "own_values":["No","Yes"],
        "field_icon":"AccountBrowser" 
    },    
    {
        "Title": "New Client",
        "Description": "We want client selection criteria that focus our attention on the clients that we want, clients who value us and that Forvis Mazars can add value to. Clients that have a positive impact on Mazars’ reputation, the team and/or our bottom line.",
        "sp_field_name": "IsNewClient",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting hide-field",
        "own_values":["No","Yes"],
        "field_icon": "AccountBrowser"
    },
    {
        "Title":"Is this a group engagement?", 
        "Description":"Is this a group engagement?",
        "sp_field_name":"IsGroupEngagement",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"AddGroup" 
    },
    {
        "Title":"Carl Partner", 
        "Description":"Is the engagment Partner a CARL partner. By selecting 'No', you will need to upload the approval of the CEO, Service Line leader or CRM",
        "sp_field_name":"IsCarlPartner",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"AddGroup" 
    },
    // this should be a new form creation - having an upload and download process defeats the purpose of the clientDigitalFile
    {
        "Title":"Is there a concurring review partner suggested for this engagement?", 
        "Description":"If 'Yes', download the required document <a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices/Shared%20Documents/CRM%20Approval%20of%20CRP%20appointment.docx'>here</a>, and upload it under 'Supporting Documents' once completed",
        "sp_field_name":"IsConcurringReviewPartner", // add this to the list 
        // if yes - then download the document and upload it
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"AddGroup" 
    },
    // {
    //     "Title": "Please download the following form and upload it when completed.",
    //     "Description": "<a href='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices/Shared%20Documents/Egmont%20Corruption%20Indicators.xlsx'>Please see the EGI attachemnt</a>",
    //     "sp_field_name": "spnameplaceholder",
    //     "sp_field_type": "none",
    //     "field_width": "full-width",
    //     "field_validate": false,
    //     "sp_additional_properties": "placeholder exclude-from-meta",
    // },
    {
        "Title": "Back",
        "Description": "next form",
        "sp_field_name": "sp_back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "next from",
        "sp_field_name": "sp_next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ],
    "transnational_calculator":[
        {
            "Title":"Is your engagement a material subsidiary of foreign groups?", 
            "Description":"This will include audits of all financial statements of companies with listed equity or debt and other public interest entities which attract particular public attention because of their size, products or services provided.",
            "sp_field_name":"Q1IsTransnational",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting hide-field",
            "own_values":["No","Yes"],
            "field_icon":"ChangeEntitlements" 
        },
        {
            "Title":"Will the financial statements be relied upon outside the audited entity's home jurisdiction for purposes of significant lending, investment or regulatory decisions", 
            "Description":"This will include audits of all financial statements of companies with listed equity or debt and other public interest entities which attract particular public attention because of their size, products or services provided.",
            "sp_field_name":"Q1BIsTransnational",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"ChangeEntitlements" 
        },
        {
            "Title":"Is your engagement for an entity with listed equity or debt?",
            "Description":"",
            "sp_field_name":"Q2IsTransnational",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"ChangeEntitlements" 
        },
        {
            "Title":"Is your engagement a Bank and / other financial institutions?",
            "Description":"",
            "sp_field_name":"Q3IsTransnational",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"ChangeEntitlements" 
        },
        {
            "Title":"Is your engagement a Life and / non-life insurance companies including reinsurance activity?",
            "Description":"",
            "sp_field_name":"Q4IsTransnational",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"ChangeEntitlements" 
        },       
        {
            "Title":"Is your engagement for an entity that uses funds / international aid programmes?",
            "Description":"",
            "sp_field_name":"Q6IsTransnational",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"ChangeEntitlements" 
        },
        {
            "Title":"Is your engagement a large charity with foreign donors?",
            "Description":"",
            "sp_field_name":"Q7IsTransnational",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"ChangeEntitlements" 
        },
        {
            "Title":"Is your engagement for a Trust / Holding company with foreign shareholders?",
            "Description":"",
            "sp_field_name":"Q8IsTransnational",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"ChangeEntitlements" 
        },
        // ====== End ==== These questions are for the transnational calculator
        // ==== testing sheet 3 october == requested for the q below to be removed
        // {
        //     "Title": "Explain the reasons for transnational classification",
        //     "Description": "",
        //     "sp_field_name": "TransnationalAdditionalDescription",
        //     "sp_field_type": "textarea",
        //     "field_width": "full-width",
        //     "field_validate": false,
        //     "sp_additional_properties": "none"        
        // },
        {
            "Title": "Back",
            "Description": "Back",
            "sp_field_name": "sp-transnational-back-button",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details",
        },
        {
            "Title": "Next",
            "Description": "Next",
            "sp_field_name": "sp-transnational-back-button",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details",
        }
    ],
    "s90_calculator":[
    {
        "Title":"Is the entity a PIE?", 
        "Description":"",
        "sp_field_name":"Q1IsS90Calculator",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    {
        "Title":"Is the PI Score above 350?", 
        "Description":"",
        "sp_field_name":"Q2IsS90Calculator",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    {
        "Title":"Does the company hold assets in a fiduciary capacity, the value of which exceeds R5million?", 
        "Description":"",
        "sp_field_name":"Q3IsS90Calculator",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    {
        "Title":"Does the company's MOI require an audit?", 
        "Description":"",
        "sp_field_name":"Q4IsS90Calculator",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    {
        "Title":"Is the company a non-profit company that was directly or indirectly incorporated by the state, an international entity or a foreign company?", 
        "Description":"",
        "sp_field_name":"Q5IsS90Calculator",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    {
        "Title":"Is the company a non-profit company incorporated primarily to perform a statutory or regulatory function?", 
        "Description":"",
        "sp_field_name":"Q6IsS90Calculator",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    {
        "Title": "Back",
        "Description": "next form",
        "sp_field_name": "sp_back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "next from",
        "sp_field_name": "sp_next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },

    ],
    "s90_considerations":[
    // ADDITIONAL QUESTIONS START
    // IF ANY OF THE FOLLOWING QS ARE TRIGGERED YES - THEN THE ONBOARDING CANNOT HAPPEN - COOLING OFF PERIOD IS SET - AND CLIENT STATUS IS CALCELLED      
    {
        "Title":"Maintenance of the company's financial records?", 
        "Description":"If you select Yes, Assurance services may NOT be provided to the client. "+
            "A cooling off period of 5 years from such prohibited services is required before assurance services can be provided.<br/>"+
                "If Yes, you cannot continue with this acceptance or continuance.<br/>"+ 
                "Download the guidance document "+
                "<a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices/Shared%20Documents/Section%20S90(2)%20Guidance%20document%20-%20IRBA%20and%20SAICA.pdf'>here</a>.",
        "sp_field_name":"Q1s90Consideration",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    {
        "Title":"Company secretary services?", 
        "Description":"If you select Yes, Assurance services may NOT be provided to the client. "+
            "A cooling off period of 5 years from such prohibited services is required before assurance services can be provided.<br/>"+   
            "If Yes, you cannot continue with this acceptance or continuance.<br/>"+        
                "Download the guidance document <a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices/Shared%20Documents/Section%20S90(2)%20Guidance%20document%20-%20IRBA%20and%20SAICA.pdf'>here</a>.",
        "sp_field_name":"Q2s90Consideration",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    {
        "Title":"Has anyone in the engagement team served as a director of the company?", 
        "Description":"If you select Yes, Assurance services may NOT be provided to the client. "+
            "A cooling off period of 5 years from such prohibited services is required before assurance services can be provided. "+
                "If Yes, you cannot continue with this acceptance or continuance.<br/>"+ 
                "Download the guidance document <a href='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices/Shared%20Documents/Section%20S90(2)%20Guidance%20document%20-%20IRBA%20and%20SAICA.pdf'>here</a>.",
        "sp_field_name":"Q3s90Consideration",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    {
        "Title":"An employee of the company involved with maintaining the company's financial records?", 
        "Description":"If you select Yes, Assurance services may NOT be provided to the client. "+
            "A cooling off period of 5 years from such prohibited services is required before assurance services can be provided. "+
                "If Yes, you cannot continue with this acceptance or continuance.<br/>"+ 
                "Download the guidance document <a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices/Shared%20Documents/Section%20S90(2)%20Guidance%20document%20-%20IRBA%20and%20SAICA.pdf'>here</a>.",
        "sp_field_name":"Q4s90Consideration",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    {
        "Title":"Director officer or employee of a person appointed as company secretary?", 
        "Description":"If you select Yes, Assurance services may NOT be provided to the client. "+
            "A cooling off period of 5 years from such prohibited services is required before assurance services can be provided. "+
                "If Yes, you cannot continue with this acceptance or continuance.<br/>"+ 
                "Download the guidance document <a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices/Shared%20Documents/Section%20S90(2)%20Guidance%20document%20-%20IRBA%20and%20SAICA.pdf'>here</a>.",
        "sp_field_name":"Q5s90Consideration",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    // ADDITIONAL QUESTIONS END
    {
        "Title": "Back",
        "Description": "next form",
        "sp_field_name": "sp_back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "next from",
        "sp_field_name": "sp_next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },

    ],
    "assurance_non_assurance_calculator": [
        // this has been moved from the  client information > general
        {
            "Title": "Non-Assurance Services", // add this to a business rule for NAS
            "Description": "Please select the services from below.<br/>"+
                    "If non-assurance services are being provided to the assurance client, please complete the 'Fees' section to assess the level of NAS fees in relation to assurance fees.",
            "sp_field_name": "NASServices",
            "sp_field_type": "select",
            "field_width": "full-width",
            "field_validate": true,    
            "drop_down_value_field":"Title",
            "drop_down_title_field":"Title",
            "drop_down_order_by":"Title asc",
            "sp_additional_properties":"single-select-drop-down-external-list multi-select",  // multi select          
            "list_name": app_configuration.list_of_services,
            "site_context": app_configuration.site_context                
        },
        {
            "Title":"Specify engagement period", 
            "Description":"",
            "sp_field_name":"engagementPeriod",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"date display-field-commenting",     
            "date_format":app_configuration.date_format,
            "display_date_format":app_configuration.display_date_format,   
            "field_icon": "CalendarAgenda"
        },
        {
            // this is the same question as s90 calculator
            "Title":"Is the entity a PIE?", 
            "Description":"",
            "sp_field_name":"Q1ClientCalc",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"ChangeEntitlements" 
        },
        {
            "Title":"What are the Assurance fees?", 
            "Description":"",
            "sp_field_name":"Q3ClientCalc",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": true,
            "sp_additional_properties": "validate-whole-numbers display-field-commenting",
            "additional_filters": "",
            "drop_down_title_field": "",
            "drop_down_value_field": "",
            "drop_down_order_by": "",
            "list_name": "",
            "site_context": "",
            "field_icon":"ChangeEntitlements" 
        },
        {
            "Title":"What are the Non Assurance fees?", 
            "Description":"",
            "sp_field_name":"Q2ClientCalc",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": true,
            "sp_additional_properties": "validate-whole-numbers display-field-commenting",
            "additional_filters": "",
            "drop_down_title_field": "",
            "drop_down_value_field": "",
            "drop_down_order_by": "",
            "list_name": "",
            "site_context": "",
            "field_icon":"ChangeEntitlements" 
        },
        {
            "Title":"Risk outcome of the assurance vs non-assurance fees", 
            "Description":"The below is displayed as a percentage (%)",
            "sp_field_name":"Q4ClientCalc",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": true,
            "sp_additional_properties": "disabled display-field-commenting",
            "additional_filters": "",
            "drop_down_title_field": "",
            "drop_down_value_field": "",
            "drop_down_order_by": "",
            "list_name": "",
            "site_context": "",
            "field_icon":"CalculatorPercentage" 
        },
        {
            "Title":"Please document your assessment of the independence", 
            "Description":"The guidance document can be found <a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices/Shared%20Documents/Guidance%20-%20non%20assurance%20fees%20on%20assurance%20engagements.docx'>here</a>.",
            "sp_field_name":"Q5ClientCalc",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": true,
            "sp_additional_properties": "none display-field-commenting",
            "additional_filters": "",
            "drop_down_title_field": "",
            "drop_down_value_field": "",
            "drop_down_order_by": "",
            "list_name": "",
            "site_context": "",
            "field_icon":"ChangeEntitlements" 
        },
        {
            "Title": "Back",
            "Description": "next form",
            "sp_field_name": "sp_back-btn",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details",
        },
        {
            "Title": "Next",
            "Description": "next from",
            "sp_field_name": "sp_next-btn",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details",
        },
       
    ],
    "key_figures":[ 
        // this question should only apply for assurance
        {
            "Title": "Is there a significant variation from the previous auditors or reviewers fees?",
            "Description": "",
            "sp_field_name": "significantVariation",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"AddGroup" 
        },
        // if yes is selected then display the comment box below
        {
            "Title":"Please explain why there is a significant variation",
            "Description": "",
            "sp_field_name": "SignificantVariationComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field"     
        },
        {
            "Title": "Key Figures",
            "Description": "",
            "sp_field_name": "KeyFiguresJSON",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"repeating-table display-field-commenting",
            "table_columns":"Revenue;Net Profit or Loss;Headcount;Net Asset Value;% recovery or write off"
        },
        {
            "Title":"Please document the reason for the recovery or write off",
            "Description": "",
            "sp_field_name": "recoveryOrWriteOff",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "none display-field-commenting"      
        },
        {
            "Title": "Main Shareholders",
            "Description": "",
            "sp_field_name": "MainShareholderJSON",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"repeating-table display-field-commenting",
            "table_columns":"Main Shareholder;% Detained including any other options, CC memberships, trusteeships;% Voting Rights"
        },
        {
            "Title": "List of entities involved in proposed engagement or to whom services will be rendered",
            "Description": "",
            "sp_field_name": "FeeBudgetJSON",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"repeating-table display-field-commenting",
            "table_columns":"Entity Name;Registration Number;Rands"
        },
        {
            "Title":"What is the percentage of coverage of the group engagement partner and all other Forvis Mazars partners compared to any external auditors %",
            "Description": " ",
            "sp_field_name": "percentageCoverGroup",
            "sp_field_type": "input",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "none display-field-commenting"      
        },     
        {
            "Title": "Non Assurance Fees",
            "Description": "",
            "sp_field_name": "NonAssuranceFeesJSON",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"repeating-table hide-field display-field-commenting",
            "table_columns":"Non Assurance Fees;Amount"
        },  
        {
            "Title": "Back",
            "Description": "Back",
            "sp_field_name": "sp_back-btn",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details",
        },
        {
            "Title": "Next",
            "Description": "Next",
            "sp_field_name": "sp_next-btn",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details",
        }
    ],
  
    "risk_status":[
    {
        "Title": "Risk Status",
        "Description": "",
        "sp_field_name": "RiskStatus",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "none disabled display-field-commenting",        
        "field_icon": "ReportWarning"
    },
    {
        "Title": "If the risk rating is risky describe the safeguards in place.",
        "Description": "Risk Status",
        "sp_field_name": "RiskDescription",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none display-field-commenting",        
        "field_icon": "ReportWarning"
    },
    {
        "Title": "Back",
        "Description": "Back",
        "sp_field_name": "sp_back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Next",
        "sp_field_name": "sp_next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ],

    "appendix_a_part_a_risk_considered_as_major":[
    {
        "Title": "Part A is considered major risk areas",
        "Description": "You're required to document the reasons for all major risk ratings.",
        "sp_field_name": "spnameplaceholder",
        "sp_field_type": "none",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "placeholder exclude-from-meta",
    },
    {

        "Title":"Mark all as low / standard risk",
        "Description":"You can use this button to mark all the sections below",
        "sp_field_name":"sp-temp-bulk-mark-risks-part-a",
        "sp_field_type":"button",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"exclude-from-meta hide-details"   
       
    },
    {
        "Title":"1. Have fraud risks been identified from your knowledge and understanding of the client's activities?",
        "Description":"Explain the reasons, the procedures performed and source information used to determine the answers for the risk rating. Document the reasons for the risk rating in terms of the underlying service you provide e.g. the forensic service department will assess the fraud risk based on the type, their experience and the complexity of the investigations. For other lines of services the fraud will probably indicate a higher risk and the rating will depend on the significance and the staff who were involved i.e. lower, middle or high level employees.",
        "sp_field_name":"Q1PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"AccountManagement" 
    },
    {
        "Title":"Fraud risks comments",
        "Description":"",
        "sp_field_name":"C1PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"none",
        "field_icon":"ManagerSelfService" 
    },
    {
        "Title":"2. How would we rate the risk associated with the reputation and integrity of high level management?",
        "Description":"Explain the reasons, the procedures performed and source information used to determine the answers for the risk rating. E.g. We've done internet searches and AML/KAC report on the high level management and know your client procedures. No adverse information could be found.",
        "sp_field_name":"Q2PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"WorkforceManagement" 
    },
    {
        "Title":"Reputation and integrity comments",
        "Description":"",
        "sp_field_name":"C2PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"none",
    },
    {
        "Title":"3. The risk of money laundering and/or other criminal activities?",
        "Description":"Explain the reasons, the procedures performed and source information used to determine the answers for the risk rating. Document the reasons for the risk rating in terms of the underlying service you provide e.g. the forensic service department will assess the money laundering and/or other criminal activities based on the type, their experience and the complexity of the investigations. For other lines of services the money laundering and/or other criminal activities will probably indicate a higher risk and the rating will depend on the significance and what staff levels were involved i.e. lower, middle or high level employees.",
        "sp_field_name":"Q3PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"MapPin" 
    },
    {
        "Title":"Money laundering comments",
        "Description":"",
        "sp_field_name":"C3PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"none",
    },
    {
        "Title":"4. The type and extent of negative media coverage of the company or management?",
        "Description":"Explain the reasons, the procedures performed and source information used to determine the answers for the risk rating.",
        "sp_field_name":"Q4PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"MediaAdd" 
    },
    {
        "Title":"Negative media coverage comments",
        "Description":"",
        "sp_field_name":"C4PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"none",
        "field_icon":"MapPin" 
    },
    {
        "Title":"5. Undue pressure to achieve certain financial or other results?",
        "Description":"Explain the reasons, the procedures performed and source information used to determine the answers for the risk rating. Document the reasons for the risk rating in terms of the underlying service you provide.",
        "sp_field_name":"Q5PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"Financial" 
    },
    {
        "Title":"Undue pressure comments",
        "Description":"",
        "sp_field_name":"C5PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"none",
        "field_icon":"MapPin" 
    },
    {
        "Title":"6. The attitude of the company towards their service providers e.g. litigation, no access to certain information, the client is aggressive in maintaining the fees as low as possible?",
        "Description":"Explain the reasons, the procedures performed and source information used to determine the answers for the risk rating. Document the reasons for the risk rating in terms of the underlying service you provide",
        "sp_field_name":"Q6PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"MarketDown" 
    },
    {
        "Title":"The attitude of the company towards their service providers comments",
        "Description":"",
        "sp_field_name":"C6PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"none",
        "field_icon":"MapPin" 
    },
    {
        "Title":"7. Problems encountered with regulators e.g. market, industry etc.?",
        "Description":"Explain the reasons, the procedures performed and source information used to determine the answers for the risk rating. Document the reasons for the risk rating in terms of the underlying service you provide.",
        "sp_field_name":"Q7PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"AppIconDefaultList" 
    },
    {
        "Title":"Problems encountered with regulators comments",
        "Description":"",
        "sp_field_name":"C7PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"none",
    },
    {
        "Title":"8. Going concern issues?",
        "Description":"Explain the reasons, the procedures performed and source information used to determine the answers for the risk rating. Document the reasons for the risk rating in terms of the underlying service you provide.",
        "sp_field_name":"Q8PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"MapPin" 
    },
    {
        "Title":"Going concern issues comments",
        "Description":"",
        "sp_field_name":"C8PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"none",
    },
    {
        "Title":"9. Not accepting our engagement letter's standard terms and conditions?",
        "Description":"Explain the reasons, the procedures performed and source information used to determine the answers for the risk rating.",
        "sp_field_name":"Q9PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"AnalyticsReport" 
    },
    {
        "Title":"Engagement letter's standard terms and conditions comments",
        "Description":"",
        "sp_field_name":"C9PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"none",
    },
    {
        "Title":"10. Is the engagament clients industry currently receiving an unusual amount of media attention or focus from regulatory authorities. That said, it is noted that this is a subjective assessment and some industries (such as Digital Asset Sector) is expected to always have a degree of negative media attention, which include unsupported opinions from journalists?",
        "Description":"Explain the reasons, the procedures performed and source information used to determine the answers for the risk rating.",
        "sp_field_name":"Q10PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"AnalyticsReport" 
    },
    {
        "Title":"Clients industry comments",
        "Description":"",
        "sp_field_name":"C10PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"none",
    },
    {
        "Title":"11. Is the client PIP, FFPEP or PEP?",
        "Description":"Is the prospective client, existing client, or any of its related parties (such as directors, shareholders, "+
            "or beneficial owners) classified as a Politically Exposed Person (PEP), Foreign Politically Exposed Person "+
            "(FPEP), or Politically Influential Person (PIP)?",
        "sp_field_name":"Q12PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No"],
        "field_icon":"AnalyticsReport" 
    },
    {
        "Title":"PIP, FFPEP or PEP comments.",
        "Description":"Please provide the individual's name, the position held, and the jurisdiction where the position was held. "+
            "You may refer to the final RelyComply assessment report or the WeCheck KAC report for this information",
        "sp_field_name":"C12PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },   
    // this question is only visible if a Clients Group Name is added. Cell 93 within A&C updates
    {
        "Title":"11. Since this Client is part of a Group how does media attention, or questions regarding integrity of management or regulatory "+
            "and compliance matters relevant to the wider group are considered at a standalone company level?",
        "Description":"Explain the reasons, the procedures performed and source information used to determine the answers for the risk rating.",
        "sp_field_name":"Q11PartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values hide-field display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"AnalyticsReport" 
    },
    {
        "Title":"Standalone company level comments",
        "Description":"",
        "sp_field_name":"C11PartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"none hide-field",
    },
    {
        "Title": "Back",
        "Description": "Upload",
        "sp_field_name": "sp_back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details ",
    },
    {
        "Title": "Next",
        "Description": "Upload",
        "sp_field_name": "sp_next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },

    ],
    // on the original this contianer holds 3 accordions listed with the title: 1.assessment of the risk; 2.KYC and 3.High Risk clients
    "appendix_c_container":[
    {
        "Title": "Money Laundering",
        "Description": "This  is an overview of the Appendix C Form",
        "sp_field_name": "spname",
        "sp_field_type": "none",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "placeholder exclude-from-meta",
       },
    ],

    "appendix_c_money_laundering":[
    {
        "Title": "Please document the procedures performed and source information used to assess the risk of money laundering activities and/or other criminal activities.",
        "Description": "Money laundering is a process by which criminals hide or disguise the proceeds of their crime so that they appear to have originated from a legitimate source. Some of the information sources used to evaluate suspicious activities include: client meetings (incl. attendees and their positions) and client questionnaires (client request for information forms), review of financial statements, KAC report, group structure review, internet searches or other (specify).<br>Please document the procedures performed and source information used to assess the risk of money laundering activities and/or other criminal activities.",
        "sp_field_name": "uspf-dropdowndisplaytextfield",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": true,
        "sp_additional_properties": "none",
        "additional_filters": "",
        "drop_down_title_field": "",
        "drop_down_value_field": "",
        "drop_down_order_by": "",
        "list_name": "",
        "site_context": "",
        "field_icon": "AccountBrowser"
    },
    {
        "Title": "Back",
        "Description": "Upload",
        "sp_field_name": "sp_back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Upload",
        "sp_field_name": "sp_next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ],
    "know_your_client_proceudres":[
    {
        "Title": "Complete the consequences of client acceptance due diligence",
        "Description": "Select applicable to complete the due diligence for new client acceptance or changes to existing client circumstances. (New client acceptance or changes to existing client\\'s circumstances? )",
        "sp_field_name": "uspf-dropdowndisplaytextfield",
        "sp_field_type": "select",
        "field_width": "full-width",
        "field_validate": true,
        "sp_additional_properties": "none",
        "additional_filters": "",
        "drop_down_title_field": "",
        "drop_down_value_field": "",
        "drop_down_order_by": "",
        "list_name": "",
        "site_context": "",
        "field_icon": "AccountBrowser"
    },
    {
        "Title": "Back",
        "Description": "Upload",
        "sp_field_name": "sp_back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Upload",
        "sp_field_name": "sp_next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ], 

    "appendix_a_client_acceptance":[
        {
            "Title": "Client Acceptance",
            "Description": "To be completed based on initial discussions, consultation, and correspondence with client. Where information or investigations were limited in nature, provide details of what steps were taken to avail yourself of the factors which may influence the risk rating provided on this form.  Where information obtained after the acceptance of the client necessitates a drastic change in the risk ratings provided below, the engagement partner must be informed and the Risk department consulted. Risks in red: Risk considered as major - identified globally",
            "sp_field_name": "spname",
            "sp_field_type": "none",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder exclude-from-meta",
        },      
        {
            "Title": "Risk Status",
            "Description": "",
            "sp_field_name": "sp",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "none",
            "additional_filters": "",
            "drop_down_title_field": "",
            "drop_down_value_field": "",
            "drop_down_order_by": "",
            "list_name": "",
            "site_context": "",
            "field_icon": "ReportWarning"
        },
        {
            "Title": "If the risk rating is risky describe the safeguards in place.",
            "Description": "If the risk rating is risky describe the safeguards in place.",
            "sp_field_name": "sp-header-risk-rate",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "none",
            "additional_filters": "",
            "drop_down_title_field": "",
            "drop_down_value_field": "",
            "drop_down_order_by": "",
            "list_name": "",
            "site_context": "",
            "field_icon": "AccountManagement"
        }    
    ],
    "part_b_risk_considered_normal":[
    {
        "Title": "Part B is considered normal risks areas",
        "Description": "You're required to document the reasons for medium or high risk ratings.",
        "sp_field_name": "spnameplaceholder",
        "sp_field_type": "none",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "placeholder exclude-from-meta",
    },    
    {

        "Title":"Mark all as low / standard risk",
        "Description":"You can use this button to mark all the sections below",
        "sp_field_name":"sp-temp-bulk-mark-risks-part-b",
        "sp_field_type":"button",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"exclude-from-meta hide-details display-field-commenting"   
       
    },
    {

        "Title":"1. Does the entity have problems in the application of standards or legislation?",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q1PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"AccountManagement" 
    },
    {
        "Title":"Application of standards or legislation comments",
        "Description":"",
        "sp_field_name":"C1PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        
        "Title":"2. The complexity and stability of the company's operations?",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q2PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"ManagerSelfService" 
    },
    {
        "Title":"Complexity and stability comments",
        "Description":"",
        "sp_field_name":"C2PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {

        "Title":"3. The security and stability of the business sector? Does the client operate in a high risk sector?",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q3PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"WorkforceManagement"

    },
    {
        "Title":"Security and stability of the business comments",
        "Description":"",
        "sp_field_name":"C3PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"4. The competence and stability of management, especially the directors? <br>",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q4PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"Financial" 

    },
    {
        "Title":"Competence and stability of management comments",
        "Description":"",
        "sp_field_name":"C4PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {

        "Title":"5. The type and extent of litigation and claims in progress?",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q5PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"MapPin" 
    },
    {
        "Title":"Extent of litigation comments",
        "Description":"Comments",
        "sp_field_name":"C5PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {

        "Title":"6. Do we have clarity of legal structure and identification of ultimate beneficial owners?",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q6PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"Financial" 
    },
    {
        "Title":"Clarity of legal structure comments",
        "Description":"Comments",
        "sp_field_name":"C6PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"7. Type and extent of conflicts between high level management and majority or minority shareholders, members, trustees, natural persons etc?",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q7PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"MarketDown" 

    },
    {
        "Title":"Type and extent of conflicts comments",
        "Description":"",
        "sp_field_name":"C7PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"8. Is the company currently raising significant finance?<br>",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q8PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"AppIconDefaultList" 
    },
    {
        "Title":"Raising significant finance comments",
        "Description":"",
        "sp_field_name":"C8PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {

        "Title":"9. Are there restructuring or disposal activities currently in progress?",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q9PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"MapPin" 
    },
    {
        "Title":"Restructuring or disposal activities comments",
        "Description":"",
        "sp_field_name":"C9PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {

        "Title":"10. Any tax risks?<br>",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q10PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"ReportWarning"

    },
    {
        "Title":"Any tax risks comments",
        "Description":"",
        "sp_field_name":"C10PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {

        "Title":"11. Non-compliance with legislation and regulations?",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q11PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"AnalyticsReport" 
    },
    {
        "Title":"Non-compliance comments",
        "Description":"",
        "sp_field_name":"C11PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {

        "Title":"12. The business reputation and integrity of related parties?",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q12PartB",
        "sp_field_type":"input",
        "field_width":"half-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"MapPin" 
    },
    {
        "Title":"Business reputation comments",
        "Description":"",
        "sp_field_name":"C12PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {

        "Title":"13. A history and / or frequency of Reportable Irregularities and / or Non Compliance with Laws and Regulations?",
        "Description":"Explain the reasons for the risk rating, if assessed as medium or high. Capture N/A, if assessed as low.",
        "sp_field_name":"Q13PartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low / Standard","Medium","High"],
        "field_icon":"ReportWarning" 
    },
    {
        "Title":"A history and / or frequency of Reportable Irregularities comments",
        "Description":"",
        "sp_field_name":"C13PartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },   
    {
        "Title": "Back",
        "Description": "back",
        "sp_field_name": "sp-back-appendix-b",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "next",
        "sp_field_name": "sp-next-appendix-b",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ],
    // APPENDIX C MONEY LAUNDERING
    "appendix_c":[
    {
        "Title": "Please document the procedures performed and source information used to assess the risk of money laundering activities and/or other criminal activities.",
        "Description": "Money laundering is a process by which criminals hide or disguise the proceeds of their crime so that they appear to have originated from a legitimate source. Some of the information sources used to evaluate suspicious activities include: client meetings (incl. attendees and their positions) and client questionnaires (client request for information forms), review of financial statements, KAC report, group structure review, internet searches or other (specify).<br>Please document the procedures performed and source information used to assess the risk of money laundering activities and/or other criminal activities.",
        "sp_field_name": "appendix-c-placeholder",
        "sp_field_type": "placeholder",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "placeholder none exclude-from-meta",
        "field_icon": "AccountManagement"
       },
    ],

// APPENDIX C MONEY LAUNDERING > WHEN SELECTED ACCEPTANCE THIS QUESTIONNAIRE POPULATES
    "dummy_entities_companies_trust":[
    {
        "Title": "Guidance",
        "Description": "Please consider if the entity you are performing services to are displaying any of these suspect transactions:",
        "sp_field_name": "appendix-c-placeholder-guidance",
        "sp_field_type": "placeholder",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "placeholder none exclude-from-meta",
        "field_icon": "AccountManagement"
    },
    {
        "Title":"1. Has the entity you have been providing services to been in the process of the formation of entities, companies, or trusts with no apparent commercial or other purpose?",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name": "Q1DummyEntities",
        "sp_field_type": "input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],        
        "field_icon":"Group" 
    },
    {
        "Title":"No apparent commercial or other purpose comments",
        "Description":"",
        "sp_field_name":"C1DummyEntities",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"2. Has the entity made use of financial, legal or other advisers (without any relationship to the entities, companies or trusts) who provide their names as executives, directors or trustees, with little or no commercial involvement?",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q2DummyEntities",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"Financial" 
    },
    {
        "Title":"Has the entity made use of financial, legal or other advisers comments",
        "Description":"",
        "sp_field_name":"C2DummayEntities",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"3. Has there been Frequent and unjustified changes of the memorandum of incorporation, trust deed or founding statement?",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q3DummyEntity",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"News" 
    },
    {
        "Title":"Has there been Frequent and unjustified changes comments",
        "Description":"",
        "sp_field_name":"C3DummyEntities",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title": "Back",
        "Description": "Next",
        "sp_field_name": "sp-back-dummy-entities",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Next",
        "sp_field_name": "sp-next-dummy-entities",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ],
    "unusual_operations_regarding_economic_activites":[
    {
        "Title": "Guidance",
        "Description": "Please consider if the entity you are performing services to are displaying any of these suspect transactions:",
        "sp_field_name": "appendix-c-placeholder-guidance-economic-activites",
        "sp_field_type": "placeholder",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "placeholder none exclude-from-meta",
        "field_icon": "AccountManagement"
    },
    {
        "Title":"1. Has there been unusual operations regarding the economic activities of the client?",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q1UnusualOperations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"AccountManagement" 
    },
    {
        "Title":"Economic activities of the client comments",
        "Description":"",
        "sp_field_name":"C1UnusualOperations",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"2. Is there a Lack of documentation on the source of the client's funds or wealth?",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q2UnusualOperations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"TextDocument" 
    },
    {
        "Title":"Source of the client's funds or wealth comments",
        "Description":"",
        "sp_field_name":"C2UnusualOperations",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"3. Does the entity have Transactions that appear inconsistent with the client's business or using unusual circuits?",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q3UnusualOperations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"MapPin" 
    },
    {
        "Title":" Does the entity have Transactions that appear inconsistent comments",
        "Description":"",
        "sp_field_name":"C3UnusualOperations",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"4. Does the entity have Transactions in which the identity of beneficial owners is difficult to determine?",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q4UnusualOperations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"ChangeEntitlements" 
    },
    {
        "Title":"Does the entity have transactions comments",
        "Description":"",
        "sp_field_name":"C4UnusualOperations",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"5. Does the entity have Unauthorized or improperly recorded transactions, interrupted audit trail?",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q5UnusualOperations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"AccessibiltyChecker" 
    },
    {
        "Title":"Does the entity have Unauthorized comments",
        "Description":"",
        "sp_field_name":"C5UnusualOperations",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"6. Does the entity have Large unusual monetary transactions, particular the exchange of tradable financial instruments or the transfer of funds to accounts in off-shore locations?",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q6UnusualOperations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"Money" 
    },
    {
        "Title":"Does the entity have Large unusual monetary transactions comments",
        "Description":"",
        "sp_field_name":"C6UnusualOperations",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"7. Transactions performed with different intermediates without any apparent business justification",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q7UnusualOperations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"WorkforceManagement" 
    },
    {
        "Title":"Transactions performed with different intermediates comments",
        "Description":"",
        "sp_field_name":"C7UnusualOperations",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"8. Operations structured in such a way as to circumvent criteria for their identification or for regulatory control and reporting procedures",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q8UnusualOperations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"TextDocumentShared" 
    },
    {
        "Title":"Operations structured comments",
        "Description":"",
        "sp_field_name":"C8UnusualOperations",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"9. Operations in high-risk countries",
        "Description":"Using the <a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/:x:/r/sites/ZAF-QRMTechnicalLibraryandApps/_layouts/15/Doc.aspx?sourcedoc=%7B22FC217A-44A9-49AF-955D-43C124FAD40A%7D&file=Firm%20Client%20Database.xlsx&action=default&mobileredirect=true&wdLOR=c5D998249-37A8-4F10-BDD1-13107A72007E'>link</a>, review the firm client database to confirm that the entity is not a high risk entity.<br>"+
                    "If you have selected yes, please add your reason, if no capture N/A in the box below"+
                    "<br>Using the <a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/:x:/r/sites/ZAF-QRMTechnicalLibraryandApps/_layouts/15/Doc.aspx?sourcedoc=%7B22FC217A-44A9-49AF-955D-43C124FAD40A%7D&file=Firm%20Client%20Database.xlsx&action=default&mobileredirect=true&wdLOR=c5D998249-37A8-4F10-BDD1-13107A72007E'>link</a>, review the firm client database to confirm that the entity is not a high risk entity",
        "sp_field_name":"Q9UnusualOperations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"ReportWarning" 
    },
    {
        "Title":"Operations in high-risk countries comments",
        "Description":"",
        "sp_field_name":"C9UnusualOperations",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"10. Is the client keen to keep their anonymity or have they requested that we conduct the engagement with undue secrecy?",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q10UnusualOperations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"AccountManagement" 
    },
    {
        "Title":"Is the client keen to keep their anonymity comments",
        "Description":"",
        "sp_field_name":"C10UnusualOperations",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"11. Any adverse publicity surrounding the client, of which we are aware",
        "Description":"If you have selected yes, please add your reason, if no capture N/A in the box below",
        "sp_field_name":"Q11UnusualOperations",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["N/A","Yes"],
        "field_icon":"MapPin" 
    },
    {
        "Title":"Any adverse publicity surrounding the client comments",
        "Description":"",
        "sp_field_name":"C11UnusualOperations",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title": "Back",
        "Description": "Back",
        "sp_field_name": "sp-unusual-operations-back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Next",
        "sp_field_name": "sp-unusual-operations-next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ],
    "conclusion":[

    {
        "Title": "Guidance",
        "Description": "Please follow the <a target='_blank' href='https://wecheck.my.salesforce.com/'>link</a> to the KAC tool to complete your risk for Anti Money Laundering and Know Your Client procedures. ",
        "sp_field_name": "appendix-c-placeholder-guidance-conclusion",
        "sp_field_type": "placeholder",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "placeholder none exclude-from-meta",
        "field_icon": "AccountManagement"
    },     
    {
        "Title":"1. Risk of money laundering activities or other criminal activities",
        "Description":"Please record the risk on the KAC report.",
        "sp_field_name":"MoneyLaunderingRisk",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low/Standard","Medium", "High"],
        "field_icon":"MapPin" 
    },
    {
        "Title":"Risk of money laundering activities comments",
        "Description":"",
        "sp_field_name":"MoneyLaunderingRiskComment",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
        "field_icon":"MapPin" 
    },  
    {
        "Title":"2. Is the nature of your offered service any of the below?",
        "Description":"If any of these services are selected it will make your submission Risky.",
        "sp_field_name":"NASRiskyServices",
        "sp_field_type":"select",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"single-select-drop-down-external-list remove-duplicates hide-field",
        "additional_filters":"",
        "drop_down_title_field":"Title",
        "drop_down_value_field":"Title",
        "drop_down_order_by":"Title asc",
        "list_name":"NASRiskyServices",
        "site_context":app_configuration.site_context                                    
    },   
    {
        "Title": "Back",
        "Description": "Upload",
        "sp_field_name": "sp-money-laundering-back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Upload",
        "sp_field_name": "sp-money-laundering-next-button",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ],
//  KNOW YOUR CLIENT (KYC) PROCEDURES PERFORMED >> WHERE APPLICABLE IS SELECTED
    "kyc_procedures_performed":[
    {
            "Title":"1. Please select your client type",
            "Description":"Individuals examples include:<br>"+
                            "- Has the entity you have been providing services to been in the process of The formation of entities, companies or trusts with no apparent commercial or other purpose?<br/>"+
                            "- Has there been Frequent and unjustified changes of the memorandum of incorporation, trust deed or founding statement?<br/>"+
                            "- Has the entity made use of financial, legal or other advisers (without any relationship to the entities, companies or trusts) "+
                                "who provide their names as executives, directors or trustees, with little or no commercial involvement?"+                               
                            "Private companies or Close Corporations include: <br/>" +
                            "- Directors or those who run the entity on a day to day basis including those that have payment approval rights<br/>"+
                            "- Justification for verifying the identities which could include obtaining copies of their ID documents.<br/><br/>"+
                            "Partnerships / Sole traders:<br/>"+
                            "- Sole trader or partners or those who run the business activities on a day to day basis including those that have cheque signing rights"+
                            "- Justification for verifying the identities which could include obtaining copies of their ID documents<br/><br/>"+
                            "Trusts: <br/>"+
                            "- Documentation of the nature and purpose of the trust, original source of funding, those authorised to make payments and decisions on behalf of the trust<br/>"+
                            "- Justification for verifying the identities of the trustees, which could include obtaining copies of their ID documents?",
            "sp_field_name":"Q1KYC",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["Individuals","Private companies or Close Corporations", "Partnerships / Sole traders","Trusts","None of the above", "NPO", "PBO", "NPC"],
            "field_icon":"MapPin" 
    },     
    {
        "Title":"Client type comments",
        "Description":"",
        "sp_field_name":"C1KYC",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },   
    {
        "Title":"2. For high risk clients - Is the client considered high risk?",
        "Description":"Particular types of high risk clients are:<br/></br>"+
            "- Clients that we have not met face to face and consider as high risk<br>"+
            "- Individual or principal directors and beneficial owners owning more than 25%<br>"+
            "- PEPs - Politically Exposed Persons",
        "sp_field_name":"Q4KYC",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No", "N/A"],
        "field_icon":"UserWarning" 
    },
    {
        "Title":"For high risk clients comments",
        "Description":"",
        "sp_field_name":"C5KYC",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"3. Clients that we have not met face to face and consider as high risk we need to obtain certified copies of the photographic evidence.",
        "Description":"Document the reasons, procedures performed and source information used to determine the answers.",
        "sp_field_name":"Q6KYC",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No", "N/A"],
        "field_icon":"AccountManagement" 
    },
    {
        "Title":"Clients that we have not met face to face comments",
        "Description":"",
        "sp_field_name":"C6KYC",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"4. PEPs - Politically Exposed Persons we need to understand and document the source of their funds",
        "Description":"Document the reasons, procedures performed and source information used to determine the answers.",
        "sp_field_name":"Q7KYC",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No", "N/A"],
        "field_icon":"WorkforceManagement" 
    },
    {
        "Title":"Politically exposed persons comments",
        "Description":"",
        "sp_field_name":"C7KYC",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"5. Need to carry out an adverse publicity check on the individual or on the entity and the principal directors and beneficial owners owning more than 5%",
        "Description":"Document the reasons, procedures performed and source information used to determine the answers.",
        "sp_field_name":"Q8KYC",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No", "N/A"],
        "field_icon":"ManagerSelfService" 
    },
    {
        "Title":"Need to carry out an adverse publicity check comments",
        "Description":"",
        "sp_field_name":"C8KYC",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },  
    {
        "Title": "Back",
        "Description": "Upload",
        "sp_field_name": "sp-kyc-back-button",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details ",
    },
    {
        "Title": "Next",
        "Description": "Upload",
        "sp_field_name": "sp-kyc-next-button",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ],

//APPENIX D > WHEN SELECTED  NON-ASSURUANCE ON EXISTING ASSURANCE CLIENT
    "appendix_d_assessment_of_compliance":[
    {
        "Title": "Nature of the proposed services",
        "Description": "Document the engagement specific nature of proposed services See guidance on permissible services below",
        "sp_field_name": "NatureOfProposedServicesAppD",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": true,
        "sp_additional_properties": "none display-field-commenting",
    },
    {
        "Title": "Independence rules and policies",
        "Description": "please select the tick boxes",
        "sp_field_name": "IndependanceRulesAndPolicies",
        "sp_field_type": "select",
        "field_width": "half-width",
        "field_validate": false,    
        "sp_additional_properties":"single-select-drop-down-external-list multi-select display-field-commenting",
        "additional_filters":"", 
        "drop_down_title_field":"Title",
        "drop_down_value_field":"Title",
        "drop_down_order_by":"Title asc", 
        "list_name":"IndependanceRulesAndPolicies",
        "site_context": app_configuration.site_context        
    },
    {
        "Title": "Nature of the threat",
        "Description": "please select the tick boxes",
        "sp_field_name": "NatureOfThreats",
        "sp_field_type": "select",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "single-select-drop-down-external-list multi-select display-field-commenting",    
        "additional_filters":"", 
        "drop_down_title_field":"Title",
        "drop_down_value_field":"Title",
        "drop_down_order_by":"Title asc", 
        "list_name":"NatureOfThreats",
        "site_context": app_configuration.site_context       
    },
    {
        "Title": "Safeguards",
        "Description": "Document the safeguards that will be put in place to reduce the threat to an acceptable level. See sec 90 of the Companies Act, Forvis Mazars CCOI and specific examples guidance below. Remember, section 90 takes preference over the Forvis Mazars code of conduct for objectivity and independence (CCOI)",
        "sp_field_name": "SafegaurdsForProposed",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none display-field-commenting"        
    },
    {
        "Title": "Acceptance or Decline",
        "Description": "Summarise the comments concerning matters taken into consideration by the lead audit engagement partner and, if applicable, by the audit committee or the local management of the client in accepting or refusing the proposed services.",
        "sp_field_name": "AcceptOrDecline",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none display-field-commenting",        
    },
    {
        "Title":"Have you enquired from the Audit engagement Partner whether the acceptance or continuance documents (Appendix A to C) has been completed.",
        "Description":"A completed copy of the questionnaire and its appendices (if any) should be sent to the lead audit engagement partner.<br/>"+
                       " In addition: <br/>"+
                       " - For all PIE and statutory audits, a completed copy should be sent to the quality officer additionally."+
                       " - For all PIE clients, a completed copy of the questionnaire should be sent to risk@mazars.co.za or QRM.",
        "sp_field_name":"IsEngagementACCompleted",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title": "Back",
        "Description": "Upload",
        "sp_field_name": "sp-appendix-d-back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Upload",
        "sp_field_name": "sp-appendix-d-next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ],

    "anti_corruption":[
    {
        "Title": "What is your Corruption perception index?",
        "Description": "Please click on this <a target='_blank' href='https://www.transparency.org/en/cpi/2021'>link</a> to find the score for which country your client is established. In this index, countries receive a score out of 100 that translates in ranking on the CPI. A higher score means that corruption is less likely to occur in the country, where as a lower score means that corruption is more likely.",
        "sp_field_name": "CorruptionPeceptionIndex",
        "sp_field_type": "input",
        "field_width": "full-width",
        "field_validate": true,
        "sp_additional_properties": "validate-whole-numbers display-field-commenting",     
        "field_icon": "CalendarAgenda"
    },
    {
        "Title": "Please review the attachment of the Egmonth Group Indicators (EGI)",
        "Description": "Please document your assessment of the Egmont Group Indicators and state if this increase your risk of the client - "+
            " if so please-assess the question above on the client 'Risk of money laundering activities or other criminal activities' and change it as per EGI assessment. "+
            "<br><a target='_blank' href='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices/Shared%20Documents/Egmont%20Corruption%20Indicators.xlsx'>Please see the EGI attachment</a>",
        "sp_field_name": "EGIComments-Placeholder",
        "sp_field_type": "egi-comments-attachment-to-download",
        "field_width": "full-width",
        "field_validate": true,
        "sp_additional_properties": "none exclude-from-meta display-field-commenting",        
        "field_icon": "Group"
    },
    {
        "Title": "The EGI are divided between:",
        "Description": "Indicators of corruption in public procurement<br> Indicators of unexplained wealth or income and General indicators<br> If there are a number of indicators that are applicable this increases the risk.",
        "sp_field_name": "EGIComments",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": true,
        "sp_additional_properties": "none"     
    },
    {
        "Title": "Back",
        "Description": "Back",
        "sp_field_name": "sp-anti-corruption-back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Next",
        "sp_field_name": "sp-anti-corruption-next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    ],
    "supporting_documents":[
        {
            "Title":"Supporting Documents",
            "Description":"",
            "sp_field_name":"supporting-documents-placeholder",
            "sp_field_type":"Placeholder",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties": "placeholder exclude-from-meta display-field-commenting",
        },       
        {
            "Title": "Resign from Engagement",
            "Description": "This will start the resignation process, please upload the resignation in order to set the engagment to 'resign'",
            "sp_field_name": "btn-resign-from-engagement",
            "sp_field_type": "button",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta display-field-commenting",
        }, 
        {
            "Title": "Create Rely Comply Assesment",
            "Description": "You are required to complete the RelyComply assesment as your submission has been flagged as a Non-Assuarnace service within "+
                " the corporate finance | tax consulting | company secretarial service line.<Br>"+
                "Please click the button below to create your assesment in the RelyComply Tool and upload the result under supporting documents.",
            "sp_field_name": "sp-button-nas-rely-comply-assesment-creation",
            "sp_field_type": "button",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-field"            
        }        
    ],
    "approvals":[
        {
            "Title":"Preview Approvers",
            "Description":"The below table outlines the intended approvals required",
            "sp_field_name":"preview-approval-section-placeholder",
            "sp_field_type":"Placeholder",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties": "placeholder exclude-from-meta hide-field",
        },
        {
            "Title": "Get Pre-Approval",
            "Description": "This will save the form and send a link to the select person for 'Pre-Approval'."+
                "Once they are happy with the form they will be able to submit on your behalf.",
            "sp_field_name": "btn-temp-pre-approval",
            "sp_field_type": "button",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-field",
        },
        {
            "Title": "Start Approval",
            "Description": "This will start the approval process and send out a notification to the first person in the table",
            "sp_field_name": "btn-start-approval-process",
            "sp_field_type": "button",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-field",
        },
        {
            "Title":"Current Approval Progress",
            "Description":"The below table outlines the progress on your approval",
            "sp_field_name":"current-approval-progress-section-placeholder",
            "sp_field_type":"Placeholder",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties": "placeholder exclude-from-meta hide-field",
        },       
        {
            "Title": "Query Approvers",
            "Description": "This will provide you with insight into the current approval structure",
            "sp_field_name": "btn-query-approver-configuration",
            "sp_field_type": "button",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta",
        },      
        {
            "Title": "Feedback complete",
            "Description": "Indicate to the current approver that the form has been ammended based on their comments",
            "sp_field_name": "btn-feedback-completed",
            "sp_field_type": "button",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-field",
        }
    ],
    "business_sustainability":
 [
    {
        "Title": "Part A: Risks considered as major",
        "Description":  "",
        "sp_field_name": "business-sustainability-header-part-a",
        "sp_field_type": "placeholder",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "placeholder none exclude-from-meta",
        "field_icon": "AccountManagement"
    },    
    {
        "Title":"What is the risk related to the security and stability of the business sector?",
        "Description":"(including sustainability risks in the sector) and media analysis (ESG controversy indicators).",
        "sp_field_name":"BSPAQ1",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low (Standard)","Medium","High"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title":"Comments",
        "Description":"Please provide additional comments below",
        "sp_field_name":"BSPAQ1Comments",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting" 
    },
    {
        "Title":"What is the risk to the company having (several) complex value chains with higher ESG risks?",
        "Description":"(eg pollution or human rights issues in upstream value chain)",
        "sp_field_name":"BSPAQ2",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low (Standard)","Medium","High"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title":"Comments",
        "Description":"Please provide additional comments below",
        "sp_field_name":"BSPAQ2Comments",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting" 
    },
    {
        "Title": "Part B: Risks considered normal",
        "Description":  "",
        "sp_field_name": "business-sustainability-header-part-b",
        "sp_field_type": "placeholder",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "placeholder none exclude-from-meta",
        "field_icon": "AccountManagement"
    }, 
    {
        "Title":"What is the risk related to the competence and stability of management (including existence of a board member with ESG responsibility/expertise, finance director and senior members of clients' sustainability team)?",
        "Description":"For sector risks guidance refer to Forvis Mazars 'Risk Appetite for sustainability assurance engagements' policy inlcuding mentioned prohibited/caution/watchlist",
        "sp_field_name":"BSPBQ1",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low (Standard)","Medium","High"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title":"Comments",
        "Description":"Please provide additional comments below",
        "sp_field_name":"BSPBQ1Comments",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting" 
    },
    {
        "Title":"What is the risk related to pressure for achievement of certain sustainability metrics and targets?",
        "Description":"eg. Variable remuneration, covenants, history of promises for general assembly",
        "sp_field_name":"BSPBQ2",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low (Standard)","Medium","High"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title":"Comments",
        "Description":"Please provide additional comments below",
        "sp_field_name":"BSPBQ2Comments",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting" 
    },
    {
        "Title":"What is the risk that the company value chain includes higher risk geographical locations?",
        "Description":"",
        "sp_field_name":"BSPBQ3",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low (Standard)","Medium","High"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title":"Comments",
        "Description":"Please provide additional comments below",
        "sp_field_name":"BSPBQ3Comments",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting" 
    },
    {
        "Title":"What is the risk related to company ESG reporting complexity?",
        "Description":"Low < 6 ESRS standards applicable; medium 6 or 7 ESRS; high > 7 ESRS standards applicable",
        "sp_field_name":"BSPBQ4",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low (Standard)","Medium","High"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title":"Comments",
        "Description":"Please provide additional comments below",
        "sp_field_name":"BSPBQ4Comments",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting" 
    },
    {
        "Title":"What is the risk related to the Fee level of ESG assurance?",
        "Description":"Proxy as a risk indicator to be commented on for sufficiency of the ESG fee as well as % of the financial audit fee",
        "sp_field_name":"BSPBQ5",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low (Standard)","Medium","High"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title":"Comments",
        "Description":"Please provide additional comments below",
        "sp_field_name":"BSPBQ5Comments",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting" 
    },
    {
        "Title":"What is the risk related to the Maturity of the existing ESG reporting and processes of the company?",
        "Description":"Low mateurity = high risk",
        "sp_field_name":"BSPBQ6",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Low (Standard)","Medium","High"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title":"Comments",
        "Description":"Please provide additional comments below",
        "sp_field_name":"BSPBQ6Comments",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting" 
    },
    {
        "Title": "Additional Questions",
        "Description":  "",
        "sp_field_name": "business-sustainability-header-additional-questions",
        "sp_field_type": "placeholder",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "placeholder none exclude-from-meta",
        "field_icon": "AccountManagement"
    }, 
    {
        "Title":"Is an independent assurance provider applicable?",
        "Description":"",
        "sp_field_name":"IsIndependant",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No","N/A"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title":"Is the group engagement partner unable to assess the independence and competence of the auditors or independent assurance providers (IASP)"+
            " of significant components, where he/she will not able to be directly involved in the assurance work of those component auditors/IASPs"+
            " to the extent necessary to obtain appropriate evidence and where these component auditors/IASPs do not operate in a "+
            "regulatory environment that actively oversees auditors or IASPs?",
        "Description":"Low Maturity = high risk",
        "sp_field_name":"IsGroupEngagementPartner",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No","N/A"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title":"Have contacts with the previous auditor or IASP identified problems?",
        "Description":"Scope limitation, inadequate or unpaid fees, fraud…",
        "sp_field_name":"PreviousAuditorOrIASP",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["Yes","No","N/A"],
        "field_icon":"ProductionFloorManagement" 
    },
    {
        "Title": "Back",
        "Description": "Back",
        "sp_field_name": "sp-bs-back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Next",
        "sp_field_name": "sp-bs-next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    }
 ]

}
// new business requirments cell 20
// This form is required when 
// 1. Acceptance =  Listed Entity +  Crypto currency + Transnational  + SPAC Reporting accountant Engagement IPO
// 2. Continuance = Crypto
global_giac_form_fields = {
    
    "giac_form":[
    {
        "Title": "Guidance",
        "Description":  "The decision to accept any assurance engagement in respect of a Listed Entity, Transnational PIE, or an SEC client or any "+
            "Digital Asset Sector (assurance or non-assurance) engagement requires the involvement and concurrence of the Forvis Mazars Group " + 
            "Independence and Acceptance Committee (GIAC), a sub-committee of the Forvis Mazars QRM Board. In order to avoid delays in the "+
            "process and the decision, and to make sure any required independence confirmations are carried out, the engagement partner "+
            "is required to notify the QRM as soon as negotiations are entered into with prospective clients. The below acceptance "+
            "evaluation documentation gathered will be reverted to GIAC via the Forvis Mazars acceptance desk by the QRM.",
        "sp_field_name": "appendix-c-placeholder-guidance-economic-activites",
        "sp_field_type": "placeholder",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "placeholder none exclude-from-meta",
        "field_icon": "AccountManagement"
    },
    {
        "Title": "Requestors Name",
        "Description": "",
        "sp_field_name": "RequestorsNameId",
        "sp_field_type": "select",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "number single-select-typeahead display-field-commenting",        
        "drop_down_title_field":"Title",
        "drop_down_value_field":"Id",
        "list_name": "User Information List",
        "site_context": app_configuration.people_picker_site_context,
        "field_icon": "AccountBrowser"
    },
    {
        "Title": "Requestors Cell/Landline tel. no",
        "Description": " ",
        "sp_field_name": "RequestorContactDetails",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties":"validate-whole-numbers display-field-commenting",    
        "field_icon": "AccountManagement"
    },
    {
        "Title": "Requestors Grade",
        "Description": " ",
        "sp_field_name": "RequestorsGrade",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "none display-field-commenting",       
        "field_icon": "UpgradeAnalysis"
    },
    {
        "Title": "Requestors Email address",
        "Description": "  ",
        "sp_field_name": "RequestorsEmail",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "none display-field-commenting",        
        "field_icon": "ArrangeByFrom"
    },
    {
        "Title": "Engagement Manager",
        "Description": "",
        "sp_field_name": "GiacEngagementManagerId",
        "sp_field_type": "select",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "number single-select-typeahead display-field-commenting",        
        "drop_down_title_field":"Title",
        "drop_down_value_field":"Id",
        "list_name": "User Information List",
        "site_context": app_configuration.people_picker_site_context,
        "field_icon": "AccountBrowser"
    },
    {
        "Title": "Deadline for answer",
        "Description": "",
        "sp_field_name": "AnswerDeadline",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": true,  
        "sp_additional_properties":"date display-field-commenting",     
        "date_format":app_configuration.date_format,
        "display_date_format":app_configuration.display_date_format,   
        "field_icon": "CalendarAgenda"
    },
    {
        "Title": "Where is the client listed (give name of market, if applicable)",
        "Description": " ",
        "sp_field_name": "ClientListedLocation",
        "sp_field_type": "input",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "none display-field-commenting",        
        "field_icon": "AccountManagement"
    },   
    {
        "Title": "Is the entity a subsidiary of a company listed on a recognised market?",
        "Description": "",
        "sp_field_name":"IsSubsidiary",
        "sp_field_type":"input",
        "field_width":"half-width",
        "field_validate":false,
        "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
        "own_values":["No","Yes"],
        "field_icon":"EMI"
    },
    {
        "Title": "It is important that sufficient detail is provided to enable the Committee to reach its decision.",
        "Description": " ",
        "sp_field_name": "AddtionalDetails",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none display-field-commenting",       
        "field_icon": "AccountManagement"
    },
    {
        "Title": "Summary of the reasons why the client has been accepted (at local level).",
        "Description": " ",
        "sp_field_name": "Summary",
        "sp_field_type": "textarea",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none display-field-commenting",       
        "field_icon": "AccountManagement"
    },
    {
        "Title": "Back",
        "Description": "Upload",
        "sp_field_name": "sp-giac-back-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    },
    {
        "Title": "Next",
        "Description": "Upload",
        "sp_field_name": "sp-giac-next-btn",
        "sp_field_type": "button",
        "field_width": "half-width",
        "field_validate": false,
        "sp_additional_properties": "exclude-from-meta hide-details",
    }
 ]
 
}