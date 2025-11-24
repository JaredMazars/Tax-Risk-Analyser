var app_configuration = {    
  
    "date_format":"YYYY-MM-DD", 
    "display_date_format":"ll",
    
    "people_picker_site_context":"https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM",

    //sytem lookup and admin lists
    "client_list_name":"NationalClientList",
    "list_of_countries":"ListOfCountries",
    "list_of_industries":"ListOfIndustries",
    "list_of_services":"ListOfServices",
    "nas_list_of_services":"NASListOfServices",
    "help_file_list_name":"Help Guides",

    "help_pop_up_lists":"HelpList",

    //acceptance and continuance configuration
    "ac_list_name":"Client Information",
    "ac_submission":"ACSubmissions",
    "ac_current_supporting_documents_library":"AcceptanceContinuanceDocuments",
    "ac_archive_supporting_documents_library":"AcceptanceContinuanceDocuments",
    "archive_ac_submission_site_context":"https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices",
    "archive_list_name":"Client Information",
    "ac_general_notifications":"GeneralNotifications",
    "ac_risk_appetite_policy_link":"https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRMTechnicalLibraryandApps/New%20content%20for%20Tech%20Library/Forms/AllItems.aspx?ga=1&id=%2Fsites%2FZAF%2DQRMTechnicalLibraryandApps%2FNew%20content%20for%20Tech%20Library%2FQuality%20Management%2FPolicies%20%26%20Processes%2F04%2E%20Acceptance%20and%20continuance%2FRisk%2Dappetite%2Dcommunication%2Epdf&viewid=839f1978%2D1924%2D4f8a%2Dbbad%2Dd4474fad733f&parent=%2Fsites%2FZAF%2DQRMTechnicalLibraryandApps%2FNew%20content%20for%20Tech%20Library%2FQuality%20Management%2FPolicies%20%26%20Processes%2F04%2E%20Acceptance%20and%20continuance",
    "ac_risk_entity_database_link":"https://mazarsglobalcloud.sharepoint.com/:x:/r/sites/ZAF-QRMTechnicalLibraryandApps/_layouts/15/Doc.aspx?sourcedoc=%7B22FC217A-44A9-49AF-955D-43C124FAD40A%7D&file=Firm%20Client%20Database.xlsx&action=default&mobileredirect=true&wdLOR=c5D998249-37A8-4F10-BDD1-13107A72007E",
    "firm_client_database_link": "https://mazarsglobalcloud.sharepoint.com/:x:/r/sites/ZAF-QRMTechnicalLibraryandApps/_layouts/15/Doc.aspx?sourcedoc=%7B10AC1CA2-2365-4CDA-959C-B2EB48119828%7D&file=Firm%20Client%20Database%20FY2025.xlsx&action=default&mobileredirect=true",
    "ac_us_desk_link":"mailto:usdesk@mazars.fr",
    "ac_archive_link_url":"https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/QCAppendices/Lists/Client%20Information/",        
    "mazars_intranet":"https://mazarsglobalcloud.sharepoint.com/sites/ZAF-Mazars/SitePages/Mazars.aspx",
    "ac_client_black_listed_link":"https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRMTechnicalLibraryandApps/New%20content%20for%20Tech%20Library/Forms/AllItems.aspx?id=%2Fsites%2FZAF%2DQRMTechnicalLibraryandApps%2FNew%20content%20for%20Tech%20Library%2FRestricted%20Entity%20Database&p=true&ga=1",
    //business development    
    "bd_assignees":"BDSubmissions",
    "bd_initiation":"Initiation",
    "bd_evaluation":"Evaluation",
    "bd_independence":"Independence",
    "bd_supporting_documents_library":"BusinessDevelopmentDocuments",
    "bd_general_notifications":"BDGeneralNotifications",
    "bd_approval_tasks":"BDApprovalTasks",
    "bd_qrm_approval_tasks":"BDQRMApprovalTasks",
    "bd_approver_rules":"BDApproverRules",
    "bd_approver_roles":"BDApproverRoles",
    "bd_entity_database_url":"https://mazarsglobalcloud.sharepoint.com/:x:/r/sites/ZAF-QRMTechnicalLibraryandApps/_layouts/15/Doc.aspx?sourcedoc=%7B10AC1CA2-2365-4CDA-959C-B2EB48119828%7D&file=Firm%20Client%20Database%20FY2025.xlsx&action=default&mobileredirect=true",
    "bd_wecheck_url":"https://wecheck.my.salesforce.com/?ec=302&startURL=%2Fa0E1v000018SasGEAS",
    "bd_hubspot_url":"https://app.hubspot.com/login?_ga=2.103597376.1162338959.1562827198-232429434.1542272672",
      //lockdown
    "lockdown_general_notifications":"LockdownGeneralNotifications",
    "lockdown_task_list":"LockdownApprovalTasks",

    //comments list
    "ac_comments_list_name":"CRAComments",
    "bd_comments_list_name":"BDComments",

    //external lists
    "office_list_name":"Office Contact Info",
    "office_list_site_context":"https://mazarsglobalcloud.sharepoint.com/sites/ZAF-Mazars",

    //client name lookup data source
    "site_context":"https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/ClientDigitalFileDev",     
    "client_list_site_context":"https://mazarsglobalcloud.sharepoint.com/sites/ZAF-MPwr",

    //giac form references
    "giac_list_name":"GIAC Form",

    //business_sustainability references
    "business_sustainability_list_name":"ACBusinessSustainQuestions",

    //app specific lists
    "lockdown_list_name":"Lockdown List",  
    "lockdown_archive_site_context":"https://mazarsglobalcloud.sharepoint.com/sites/ZAF-QRM/LockDown",

    //client survery list
    "clp_list_name":"CLP_Survey_Submissions",
    "clp_results_list_name":"CLP_Survey_Results",
    "clp_general_notifications":"CLP_GeneralNotifications",
    "clp_task_list":"ClpApprovalTasks",
    "clp_admin_list":"CLP_Admin",

    //consultation app
    "consultations_list_name":"ConsultationFeedbackSubmissions",
    "consultations_general_notifications":"ConsultationFeedbackGeneralNotifications",
    "consultations_task_list":"ConsultationFeedbackTasks",

    //modules
    "display_client_risk_assesment_module":true,
    "display_lockdown_module":true,
    "display_bd_module":true,
    "display_client_listening_programme_module":true,
    "display_consultation_module":true,
    "display_rely_comply_module":true,  
    
    //loader
    "app_loader":"<img src='https://mazarsglobalcloud.sharepoint.com/sites/ZAF-SharedData/MPowerFrameworkCDN/img/SavingGif.gif' class='app-loader' style='width:50px;'/>",
  
    "supporting_documents_library":"AcceptanceContinuanceDocuments",
     "list_of_document_types":[
        "Annual Financial Statements", "CRM approval of EQR","CRM Approval of CRP","Draft Engagement Letter","Greatsoft Report",
        "Percentage Group Coverage","Group Structure","GIAC Background Memorandum","CEO/CRM Approval of a non-CARL Partner", "PONG Report", 
        "Resignation Letter", "Subcontractor Certificate","KAC report", "WeCheck Report","Rely Comply Risk Assesment"
    ]
}