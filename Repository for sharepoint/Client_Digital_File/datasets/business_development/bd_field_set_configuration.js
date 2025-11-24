let bd_intiation_field_set_configuration = {

    "allocation_fields":[      
        
        {
                "Title": "Allocated Approvers and Associated Visiblity",
                "Description":  "The table below indicates the various approvers that will be responsible for approver the sections as well as " +
                "the associated members whom have visibility over this request.",
                "sp_field_name": "allocation-placeholder-guidance",
                "sp_field_type": "placeholder",
                "field_width": "full-width",
                "field_validate": false,
                "sp_additional_properties": "placeholder none exclude-from-meta",
                "field_icon": "AccountManagement"
        }, 
        {
            "Title": "placeholder",
            "Description": "placeholder",
            "sp_field_name": "bd_allocation_placeholder",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        }, 
        {
            "Title": "placeholder",
            "Description": "placeholder",
            "sp_field_name": "bd-allocation-team-members-table-placeholder",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        {
            "Title": "Role Reference",
            "Description": "Description",
            "sp_field_name": "RoleReferenceId",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "field_icon": "AccountBrowser"            
        },
        {
            "Title": "Role Details",
            "Description": "Description",
            "sp_field_name": "RoleDetails",
            "sp_field_type": "textarea",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "hide-field",
            "field_icon": "AccountBrowser"            
        },        
        {
            "Title": "Add New",
            "Description": "Add New",
            "sp_field_name": "sp-button-add-new",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },       
        {
            "Title": "Approve Allocation",
            "Description": "Next",
            "sp_field_name": "sp-button-approve-and-start-evaluation",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        } 
    ],    
    "initiation_fields_general":[
        {
            "Title": "Proposal Number",
            "Description": "Unique number for this proposal",
            "sp_field_name": "ProposalNumber",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "disabled exclude-from-meta"            
        },
        {
             "Title": "placeholder",
             "Description": "placeholder",
             "sp_field_name": "bd_intiation_placeholder",
             "sp_field_type": "placeholder",
             "field_width": "full-width",
             "field_validate": false,
             "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        },        
        {
            "Title": "Request Intitated Via",
            "Description": "Please specify how the request was intitated",
            "sp_field_name": "RequestInitiatedVia",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties":"single-select-drop-down-external-list",
            "additional_filters":"Title eq 'InitiatedVia'",
            "drop_down_title_field":"AssociatedValue",
            "drop_down_value_field":"AssociatedValue",
            "drop_down_order_by":"AssociatedValue asc",
            "list_name":'BDLookupFields',
            "site_context": app_configuration.site_context,
            "field_icon":"MapPin"            
        },
        {
            "Title": "Client Name",
            "Description": "Please enter the client name",
            "sp_field_name": "ClientName",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "",
            "field_icon":"EMI"           
        },
        {
            "Title": "Type of Entity",
            "Description": "Please specify the entity type",
            "sp_field_name": "EntityType",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties":"single-select-drop-down-external-list",
            "additional_filters":"Title eq 'EntityType'",
            "drop_down_title_field":"AssociatedValue",
            "drop_down_value_field":"AssociatedValue",
            "drop_down_order_by":"AssociatedValue asc",
            "list_name":'BDLookupFields',
            "site_context": app_configuration.site_context,          
            "field_icon":"EMI"            
        },
        {
            "Title": "ID / Registration Number",
            "Description": "Please enter the company id or registration number",
            "sp_field_name": "IdRegistration",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "",
            "field_icon":"EMI"           
        }, 
        {
            "Title":"Income Tax Number",
            "Description":"Please enter the company income tax number",
            "sp_field_name":"IncomeTax",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":true,             
            "sp_additional_properties":"",
            "field_icon":"Money"               
        },
        {
            "Title":"VAT Number",
            "Description":"Please enter the company VAT number",
            "sp_field_name":"VATNumber",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":true,             
            "sp_additional_properties":"",
            "field_icon":"Money"               
        },
        {
            "Title":"Year End",
            "Description":"Please select the financial year end date",
            "sp_field_name":"YearEnd",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":true,   
            "sp_additional_properties":"date",        
            "date_format": app_configuration.date_format,
            "display_date_format": app_configuration.display_date_format,
            "field_icon":"CalendarAgenda"     
        },          
        {
            "Title": "Contact Information",
            "Description": "",
            "sp_field_name": "bd_independence_contact_info_header",
            "sp_field_type": "bd_intiation_placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder none exclude-from-meta",
            "field_icon": "AccountManagement"
        },
        {
            "Title": "Contact Person",
            "Description": "Please enter the contact person",
            "sp_field_name": "ContactPerson",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "",
            "field_icon": "Contact"            
        },
        {
            "Title": "Designation",
            "Description": "Please enter the designation",
            "sp_field_name": "Designation",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "",
            "field_icon": "AccountManagement"            
        },
        {
            "Title":"Telephone Number",
            "Description":"Please enter the contact number",
            "sp_field_name":"PhoneNumber",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":true,             
            "sp_additional_properties":"",
            "field_icon":"Phone"               
        },
        {
            "Title": "Email Address",
            "Description": "Please enter the primary email address",
            "sp_field_name": "Email",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "",
            "field_icon": "Mail"            
        },
        {
            "Title": "Physical Address",
            "Description": "Please enter the Street Number, Street Name, Suburb and City",
            "sp_field_name": "PhysicalAddress",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "",
            "field_icon": "MapPin"            
        },
        {
            "Title":"Province / State / Region",
            "Description":"Please select the state or region",
            "sp_field_name":"StateRegion",
            "sp_field_type":"select",
            "field_width":"half-width",
            "field_validate":true,
            "sp_additional_properties":"single-select-drop-down-external-list",
            "additional_filters":"Title eq 'Province'",
            "drop_down_title_field":"AssociatedValue",
            "drop_down_value_field":"AssociatedValue",
            "drop_down_order_by":"AssociatedValue asc",
            "list_name":'BDLookupFields',
            "site_context": app_configuration.site_context,
            "field_icon":"MapPin" 
        },
        {
            "Title": "Zip Code",
            "Description": "Please enter the company's Zip Code",
            "sp_field_name": "ZipCode",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "",
            "field_icon": "MapPin"            
        },
        {
            "Title": "Postal Address",
            "Description": "Please tick the box if postal address is the same as physical address",
            "sp_field_name": "PostalAddress",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "",
            "field_icon": "MapPin"            
        },
        {
            "Title": "Business Type",
            "Description": "",
            "sp_field_name": "bd_independence_contact_info_header",
            "sp_field_type": "bd_intiation_placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder none exclude-from-meta",
            "field_icon": "AccountManagement"
        },
        {
            "Title": "Entity Registration Type",
            "Description": "Please enter the entity registration type",
            "sp_field_name": "EntityRegType",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties":"single-select-drop-down-external-list",
            "additional_filters":"Title eq 'EntityRegistrationType'",
            "drop_down_title_field":"AssociatedValue",
            "drop_down_value_field":"AssociatedValue",
            "drop_down_order_by":"AssociatedValue asc",
            "list_name":'BDLookupFields',
            "site_context": app_configuration.site_context, 
            "field_icon":"EMI"            
        },
        {
            "Title": "Service Lines",
            "Description": "This is for general services required from a specific service line",
            "sp_field_name": "ServiceLines",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties":"single-select-drop-down-external-list",
            "additional_filters":"Title eq 'ServiceLines'",
            "drop_down_title_field":"AssociatedValue",
            "drop_down_value_field":"AssociatedValue",
            "drop_down_order_by":"AssociatedValue asc",
            "list_name":'BDLookupFields',
            "site_context": app_configuration.site_context,
            "field_icon":"EMI"            
        },
        {
            "Title": "Industry",
            "Description": "Please select the industry",
            "sp_field_name": "Industry",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties":"single-select-drop-down-external-list",
            "additional_filters":"Title eq 'Industry'",
            "drop_down_title_field":"AssociatedValue",
            "drop_down_value_field":"AssociatedValue",
            "drop_down_order_by":"AssociatedValue asc",
            "list_name":'BDLookupFields',
            "site_context": app_configuration.site_context,
            "field_icon":"EMI"            
        },
        {
            "Title": "Other Industry",
            "Description": "Please specify if applicable",
            "sp_field_name": "OtherIndustry",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "",
            "field_icon": "MapPin"            
        },
        {
            "Title": "Scope of services required",
            "Description": "Please select the services required",
            "sp_field_name": "ScopeOfServices",
            "sp_field_type": "select",
            "field_width": "full-width",
            "field_validate": true,
            "sp_additional_properties": "single-select-drop-down-external-list multi-select",
            "additional_filters": "Title eq 'ScopeOfServices'",
            "drop_down_title_field": "AssociatedValue",
            "drop_down_value_field": "AssociatedValue",
            "drop_down_order_by": "AssociatedValue asc",
            "list_name": 'BDLookupFields',
            "site_context": app_configuration.site_context,
            "field_icon": ""
        },
        {
            "Title":"Description of Specific Services Required",
            "Description":"Please provide more details if any specific services are required",
            "sp_field_name":"DescriptionOfServices",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"plain-text-field",
            "field_icon":"ContactCard"              
        },  
        {
            "Title": "Primary Assigned Engagement Partner",
            "Description": "Please select the primary assigned partner",
            "sp_field_name": "PrimaryAssignedEngagementPartnerId",
            "sp_field_type": "select",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "Number single-select-typeahead display-field-commenting",        
            "drop_down_title_field":"Title",
            "drop_down_value_field":"Id",
            "list_name": "User Information List",
            "site_context": app_configuration.people_picker_site_context,
            "field_icon": "AccountBrowser"
       },   
       {
            "Title": "Engagement Type",
            "Description": "Please select the Engagement Type",
            "sp_field_name": "EngagementType",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["Assurance","Non-Assurance"],        
            "site_context": app_configuration.site_context,
            "field_icon":"EMI"            
        },
        {
            "Title": "Budgeted Fee",
            "Description": "Please provide the budgeted fee",
            "sp_field_name": "BudgetedFee",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "display-field-commenting",
            "field_icon": "AccountBrowser"            
        },
        {
            "Title": "placeholder",
            "Description": "placeholder",
            "sp_field_name": "placeholder-engagement-partner",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        },
        {
            "Title": "Approver Allocation Preview",
            "Description": "placeholder",
            "sp_field_name": "placeholder-allocation-preview-approver-container",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-field"      
        },
        {
            "Title": "Preview Approvals",
            "Description": "Preview Approvers",
            "sp_field_name": "sp-button-preview-approvers",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },  
        {
            "Title": "Submit Client",
            "Description": "Next",
            "sp_field_name": "sp-button-next-to-internally-captured",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        }                
        
        
    ],
    "initiation_fields_internally_captured":[            
       
        {
             "Title": "placeholder",
             "Description": "placeholder",
             "sp_field_name": "bd_intiation_placeholder",
             "sp_field_type": "placeholder",
             "field_width": "half-width",
             "field_validate": false,
             "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        },
        {
            "Title": "Additional Comments",
            "Description": "<br/>",
            "sp_field_name": "InitiationComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": ""            
        },
        {
            "Title":"Upload Supporting Documents",
            "Description":"",
            "sp_field_name":"intitation-internally-captured-details-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"display-field-commenting", 
            "field_icon":"CalendarAgenda"     
        },        
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "internally-captured-details-supporting-documents-table",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details display-field-commenting"          
        },        
        {
            "Title": "Back",
            "Description": "Back",
            "sp_field_name": "sp-button-back-to-general-and-contact-details",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },
        {
            "Title": "Complete Application",
            "Description": "Next",
            "sp_field_name": "sp-button-approve-and-start-allocation",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        }          
    ]
}

let evaluation_field_set_configuration = {

    "evaluation_fields_restricted_entity":[
        {
            "Title":"Manager Allocation",
            "Description": "All relevant parties can at this stage allocate a manager to "+
                "the workflow to assist with completing the evaluation and proposals",
            "sp_field_name": "evaluation-manager-allocation-placeholder",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder none exclude-from-meta",
            "field_icon": "AccountManagement"
        },       
        {
            "Title": "Entity Database Check",
            "Description": "Entity Database Check",
            "sp_field_name": "sp-button-database-check",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },
        {
            "Title": "placeholder",
            "Description": "placeholder",
            "sp_field_name": "bd_allocation_placeholder",
            "sp_field_type": "placeholder",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        },
        {
            "Title":"Is the entity a restricted entity?",
            "Description":"Please select yes or no",
            "sp_field_name":"RestrictedEntity",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["Yes","No"],
            "field_icon":"EMI" 
        },
        {
            "Title": "Comments",
            "Description": "Please provide more information about the identified risk",
            "sp_field_name": "RestrictedEntityComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": ""            
        }
        
    ],
    "evaluation_fields_risk_factors":[
        {
            "Title":"Part of the Adult Entertainment Sector?",
            "Description":"Automatically populated based on the provided information",
            "sp_field_name":"AdultEntertainmentSector",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":false,
            "sp_additional_properties":"radio-buttons-own-values",
            "own_values":["Yes","No"],
            "field_icon":"EMI" 
        },
        {
            "Title":"Part of the Gambling Sector?",
            "Description":"Automatically populated based on the provided information",
            "sp_field_name":"GamblingSector",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":false,
            "sp_additional_properties":"radio-buttons-own-values",
            "own_values":["Yes","No"],
            "field_icon":"EMI" 
        },
        {
            "Title":"Part of the Cryptocurrency Sector?",
            "Description":"Automatically populated based on the provided information",
            "sp_field_name":"CryptoSector",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":false,
            "sp_additional_properties":"radio-buttons-own-values",
            "own_values":["Yes","No"],
            "field_icon":"EMI" 
        },
        {
            "Title":"Risk Identified?",
            "Description":"This is based on the industry selected in the initiation module",
            "sp_field_name":"RiskIdentified",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values",
            "own_values":["Yes","No"],
            "field_icon":"EMI" 
        },
        {
            "Title": "Comments",
            "Description": "Please provide more information about the identified risk",
            "sp_field_name": "RiskIdentifiedComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false, // Se tto true if answered yes to the RiskIdentified radio button
            "sp_additional_properties": ""            
        },
        {
            "Title":"Upload Supporting Documents",
            "Description":"",
            "sp_field_name":"evaluation-risk-factors-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"display-field-commenting", 
            "field_icon":"CalendarAgenda"     
        },        
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "risk-factors-supporting-documents-table",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        {
            "Title": "Back",
            "Description": "Back",
            "sp_field_name": "sp-button-back-to-restricted-entity",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },
        {
            "Title": "Next",
            "Description": "Next",
            "sp_field_name": "Continue to location",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        }
    ],
    "evaluation_fields_needs_analysis":[
        // Start Question
        {
            "Title":"Question 1: Will this client opportunity help us achieve our strategy?",
            "Description":"Please select yes or no and document your reason below",
            "sp_field_name":"AchieveStrategy",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values",
            "own_values":["Yes","No"],
            "field_icon":"EMI" 
        },
        {
            "Title": "Achieve Strategy Comments",
            "Description": "",
            "sp_field_name": "AchieveStrategyComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "hide-details"            
        },
        {
            "Title":"Upload Supporting Documents",
            "Description":"",
            "sp_field_name":"achieve-strategy-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"", 
            "field_icon":"CalendarAgenda"     
        },        
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "client-opportunities-supporting-documents-table",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        // END Question

        // Start Question
        {
            "Title":"Question 2: Does the client carry any reputational risk?",
            "Description":"Please select yes or no and document your reason below",
            "sp_field_name":"ReputationalRisk",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values",
            "own_values":["Yes","No"],
            "field_icon":"EMI" 
        },
        {
            "Title": "Reputational Risk Comments",
            "Description": "",
            "sp_field_name": "ReputationalRiskComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "hide-details"            
        },
        {
            "Title":"Upload Supporting Documents",
            "Description":"",
            "sp_field_name":"reputational-risk-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"", 
            "field_icon":"CalendarAgenda"     
        },        
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "reputational-risk-supporting-documents-table",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        // END Question

        // Start Question
        {
            "Title":"Question 3: Do we have the skills and available resources to deliver the required services?",
            "Description":"Please select yes or no and document your reason below",
            "sp_field_name":"SkillsAndResources",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values",
            "own_values":["Yes","No"],
            "field_icon":"EMI" 
        },
        {
            "Title": "Skills And Resources Comments",
            "Description": "",
            "sp_field_name": "SkillsAndResourcesComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "hide-details"            
        },
        {
            "Title":"Upload Supporting Documents",
            "Description":"",
            "sp_field_name":"skills-and-resources-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"", 
            "field_icon":"CalendarAgenda"     
        },        
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "skills-and-available-resources-supporting-documents-table",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        // END Question

        // Start Question
        {
            "Title":"Question 4: Is this opportunity capable of being delivered profitably reaching thresholds set for recovery and margins?",
            "Description":"Please select yes or no and document your reason below",
            "sp_field_name":"ProfitMargins",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values",
            "own_values":["Yes","No"],
            "field_icon":"EMI" 
        },
        {
            "Title": "Profit Margins Comments",
            "Description": "",
            "sp_field_name": "ProfitMarginsComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "hide-details"            
        },
        {
            "Title":"Upload Supporting Documents",
            "Description":"",
            "sp_field_name":"profit-margins-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"", 
            "field_icon":"CalendarAgenda"     
        },        
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "profitability-supporting-documents-table",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        // END Question

        // Start Question
        {
            "Title":"Question 5: What is the probability of us winning the tender?",
            "Description":"Please select yes or no and document your reason below",
            "sp_field_name":"WinningProbability",
            "sp_field_type":"input",
            "field_width":"half-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values",
            "own_values":["Yes","No"],
            "field_icon":"EMI" 
        },
        {
            "Title": "Winning Probability Comments",
            "Description": "",
            "sp_field_name": "WinningProbabilityComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "hide-details"            
        },
        {
            "Title":"Upload Supporting Documents",
            "Description":"",
            "sp_field_name":"winning-probability-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"", 
            "field_icon":"CalendarAgenda"     
        },        
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "tender-probability-supporting-documents-tables",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        // END Question

        {
            "Title": "Back",
            "Description": "Back",
            "sp_field_name": "sp-button-back-to-risk-factors",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },
        {
            "Title": "Next",
            "Description": "Next",
            "sp_field_name": "Continue to location",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        }
    ],
    "evaluation_fields_conclusion":[
        // Insert question table here

        {
            "Title": "placeholder",
            "Description": "placeholder",
            "sp_field_name": "bd-conclusion-and-results-table-placeholder",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details display-field-commenting"          
        },
        {
            "Title": "Conclusion",
            "Description": "Final conclusion based on needs analysis",
            "sp_field_name": "ConclusionComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": true,
            "sp_additional_properties": ""            
        },
        {
            "Title": "Recommendation Result:",
            "Description": "This will be a dynamic message populated based on the result of previous questions",
            "sp_field_name": "bd_evaluation_recommendation_header",
            "sp_field_type": "bd_evaluation_placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder none exclude-from-meta",
            "field_icon": "AccountManagement"
        },
        {
            "Title": "Additional Concluding Comments",
            "Description": "Additional comments on why the conclusion was chosen",
            "sp_field_name": "AddConcludingComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": ""            
        },        
        {
            "Title": "QRM Approval History",
            "Description": "",
            "sp_field_name": "placeholder-on-qrm-approval-tasks",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder"          
        },       
        // Based on the provided answers either the "Approve" or "Mitigating Factors" button will show 
        {
            "Title": "Approve Application",
            "Description": "Next",
            "sp_field_name": "sp-button-approve-and-start-independence",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },        
        {
            "Title": "Request QRM Assistance",
            "Description": "Mitigating Factors",
            "sp_field_name": "sp-button-mitigating-factors",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details hide-field" // hidden by default       
        },    
        {
            "Title": "QRM Approval",
            "Description": "Apply QRM Approval",
            "sp_field_name": "sp-button-apply-qrm-approval",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details hide-field" // hidden by default       
        }, 
        {
            "Title": "Decline Application",
            "Description": "Decline Application",
            "sp_field_name": "sp-button-decline-evaluation",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },   
        {
            "Title": "Back",
            "Description": "Back",
            "sp_field_name": "sp-button-back-to-risk-considerations",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        }       
    ]
}

let bd_independence_field_set_configuration = {
    "independence_fields_independence":[
        {
            "Title": "Step 1: Perform WeCheck",
            "Description": "WeCheck is a tool that Forvis Mazars Group utilises to ensure that the larger global firm is independent from any clients. It is the tool to ensure independence regarding the rendered services. This is applicable for assurance and non-assurance.",
            "sp_field_name": "bd_independence_header",
            "sp_field_type": "bd_independence_placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder none exclude-from-meta",
            "field_icon": "AccountManagement"
        },
        {
            "Title": "Complete WeCheck 🔗",
            "Description": "Complete WeCheck",
            "sp_field_name": "sp-button-complete-we-check",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },
        {
            "Title": "placeholder",
            "Description": "placeholder",
            "sp_field_name": "bd_independance_placeholder",
            "sp_field_type": "placeholder",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        },
        {
            "Title": "WeCheck Number",
            "Description": "Please enter the WeCheck number",
            "sp_field_name": "WeCheckNumber",
            "sp_field_type": "input",
            "field_width": "half-width",
            "field_validate": true,
            "sp_additional_properties": "",
            "field_icon": "Search"            
        },
        {
            "Title": "placeholder",
            "Description": "placeholder",
            "sp_field_name": "bd_independance_placeholder",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        },
        {
            "Title":"Independence Issues Found?",
            "Description":"Please indicate results",
            "sp_field_name":"WeCheckIssues",
            "sp_field_type":"input",
            "field_width":"v-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No Issues","Declined", "Accepted Under Conditions"],
            "field_icon":"EMI" 
        },
        {
            "Title":"Upload Supporting Documents",
            "Description":"",
            "sp_field_name":"we-check-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"", 
            "field_icon":"CalendarAgenda"     
        },        
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "independence-issues-supporting-documents-table",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        {
            "Title": "Step 2: PONG",
            "Description": "PONGS address the independence threats that may occur due to personal scenarios. This is an internal independence check. This is applicable for assurance and non-assurance.",
            "sp_field_name": "bd_independence_header",
            "sp_field_type": "bd_independence_placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder none exclude-from-meta",
            "field_icon": "AccountManagement"
        },
        {
            "Title":"Independence Issues Found?",
            "Description":"Please indicate results",
            "sp_field_name":"PongIssues",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No Issues","Declined", "Accepted Under Conditions"],
            "field_icon":"EMI" 
        },
        {
            "Title":"Upload Supporting Documents",
            "Description":"",
            "sp_field_name":"pong-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"", 
            "field_icon":"CalendarAgenda"     
        },
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "pong-issues-supporting-documents-table",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        {
            "Title": "Step 3: Hubspot",
            "Description": "Lorem ipsum dolor sit amet. Non earum molestias cum soluta laudantium est porro omnis ex consectetur laboriosam.",
            "sp_field_name": "bd_independence_header",
            "sp_field_type": "bd_independence_placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder none exclude-from-meta",
            "field_icon": "AccountManagement"
        },
        {
            "Title": "Link To Hubspot Website 🔗",
            "Description": "Hubspot Website",
            "sp_field_name": "sp-button-link-to-hubspot",
            "sp_field_type": "button",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },        
        {
            "Title":"Have you updated Hubspot accordingly?",
            "Description":"Please select yes or no",
            "sp_field_name":"Hubspot",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["Yes","No"],
            "field_icon":"EMI" 
        },
        {
            "Title": "placeholder",
            "Description": "placeholder",
            "sp_field_name": "bd_independance_placeholder",
            "sp_field_type": "placeholder",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"      
        },
        {
            "Title":"Upload Supporting Documents",
            "Description":"",
            "sp_field_name":"hubspot-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"", 
            "field_icon":"CalendarAgenda"     
        },        
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "hub-spot-issues-supporting-documents-table",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        {
            "Title": "Back",
            "Description": "Back",
            "sp_field_name": "sp-button-back-to-evaluation",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },
        {
            "Title": "Next",
            "Description": "Next",
            "sp_field_name": "Continue to location",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        }
    ],
    "independence_fields_acceptance":[
        {
            "Title":"Acceptance",
            "Description":"Acceptance",
            "sp_field_name":"AcceptanceContinuance",
            "sp_field_type":"select",
            "field_width":"half-width", 
            "field_validate":true,
            "sp_additional_properties": "number single-select-drop-down-external-list display-field-commenting",        
            "drop_down_title_field":"AcceptanceDisplayField",
            "drop_down_value_field":"Id",
            "additional_filters":"Form_x0020_Status eq 'Completed' and FinancialYearEnd ne null",
            "list_name": app_configuration.ac_submission,
            "site_context": app_configuration.site_context,           
            "field_icon":"EMI" 
        },
        {
            "Title":"QRM Acceptance Documents",
            "Description":"Please upload a pdf of your approved acceptance or continuance (If Applicable)",
            "sp_field_name":"qrm-ac-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"display-field-commenting", 
            "field_icon":"CalendarAgenda"     
        },
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "qrm-acceptance-supporting-documents-table",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        {
            "Title":"DPA and NDA",
            "Description":"Please upload the DPA and NDA (If Applicable)",
            "sp_field_name":"dpa-nda-upload",
            "sp_field_type":"file-upload",
            "field_width":"full-width",
            "field_validate":false,   
            "sp_additional_properties":"display-field-commenting", 
            "field_icon":"CalendarAgenda"     
        },        
        {
            "Title": "placeholder",
            "Description": "This is a placeholder used to show a table of uploaded support documents - supporting documents file must take care of this",
            "sp_field_name": "dpa-and-nda-supporting-documents-table",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta placeholder hide-details"          
        },
        {
            "Title": "QRM Approval",
            "Description": "For the allocated QRM to action if there were mitigating factors",
            "sp_field_name": "bd_independence_contact_info_header",
            "sp_field_type": "bd_intiation_placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder none exclude-from-meta",
            "field_icon": "AccountManagement"
        },
        {
            "Title": "Approve and Complete",
            "Description": "Next",
            "sp_field_name": "sp-button-approve-and-start-completion",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },
        {
            "Title": "Decline Application",
            "Description": "Decline",
            "sp_field_name": "sp-button-decline-independence-acceptance",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        },
        {
            "Title": "Approval Comments",
            "Description": "Please provide any extra information regarding the approval or declination",
            "sp_field_name": "ApprovalComments",
            "sp_field_type": "textarea",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "hide-details"            
        },
        {
            "Title": "Back",
            "Description": "Back",
            "sp_field_name": "sp-button-back-to-independence",
            "sp_field_type": "button",
            "field_width": "half-width",
            "field_validate": false,
            "sp_additional_properties": "exclude-from-meta hide-details"           
        }        
    ]
}

let bd_field_set_configuration = {
    "overview":[
        {
            "Title": "Business Development Overview",
            "Description": "",
            "sp_field_name": "bd-overview-header",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder none exclude-from-meta",
            "field_icon": "AccountManagement"
        }, 
        {
            "Title":"Business development table history",
            "Description":"business development table history",
            "sp_field_name":"temp-bd-answers-table",          
            "sp_field_type":"placeholder",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"placehoslder exclude-from-meta hide-details"                
        }
    ]    
}

let bd_approval_field_set = {
    "approvals":[
        {
            "Title": "Business Development Approvals Overview",
            "Description": "",
            "sp_field_name": "bd-approval-overview-header",
            "sp_field_type": "placeholder",
            "field_width": "full-width",
            "field_validate": false,
            "sp_additional_properties": "placeholder none exclude-from-meta",
            "field_icon": "AccountManagement"
        }, 
        {
            "Title":"Business development table history",
            "Description":"business development table history",
            "sp_field_name":"temp-bd-approval-table",          
            "sp_field_type":"placeholder",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"placehoslder exclude-from-meta hide-details"                
        }
    ]    
}