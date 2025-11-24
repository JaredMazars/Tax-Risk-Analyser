// let global = global_field_set_navigation

let continuance_fields = {
    ...global_field_set_navigation,  
    "continuance_independence_and_other_considerations":[
        {
    
            "Title":"1. Is there any indication of a change in the client risk assessment?",
            "Description":"If Yes, re-perform the risk rating and acceptance process above if the client becomes risky.",
            "sp_field_name":"Q1Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"ReportWarning"
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C1Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
        },
        {
            "Title":"2. Has any new situation been identified which creates a potential threat to independence?",
            "Description":"Possible safeguards include independent review, periodic quality control review, use of separate engagement team etc.",
            "sp_field_name":"Q2Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"EaseOfAccess" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C2Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
        },
        {
            "Title":"3. Are you aware of any personal, family or financial relationships between the firm, partners, consultants, other members of the network*** and the client?",
            "Description":"Possible safeguards include independent review, periodic quality control review, use of separate engagement team etc.",
            "sp_field_name":"Q3Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"Group" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C3Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
        },
        {
            "Title":"4. Are gifts or hospitality given and received other than insignificant?",
            "Description":"Monthly gift or hospitality confirmations are sent to all Forvis Mazars employees and reported to the quality officers and QRM",
            "sp_field_name":"Q4Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"AssessmentGroup" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C4Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
        },
        {
            "Title":"5. Do any disputes or litigation exist that could affect independence between the client and the firm, consultants, one of the partners, directors or a member of the network?",
            "Description":"Document the description of the safeguards if answered, Yes or capture N/A, if No. Decline the engagement if no appropriate safeguards can be identified. Possible safeguards includes:<br> - Notifying the clients(s) and all known relevant parties of the possible conflict and obtaining their consent to act in such circumstances. <br>- Use of separate engagement teams, with clear guidelines to each team on applicable security and confidentiality issues.",
            "sp_field_name":"Q5Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"AddGroup" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C5Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
        },
        {
            "Title":"6. Are total fees generated by this client likely to be greater than 10% of the office department\\'s total fees?",
            "Description":"Document the description of the safeguards if answered, Yes or capture N/A, if No. "+
            "Decline the engagement if no appropriate safeguards can be identified. "+
            "Possible safeguards include: <br>"+
                "- Advising the client of the engagement terms and the basis on which fees are charged.<br>"+
                "- Ensuring appropriate time and staff are allocated.<br>"+
                "- Performing quality assurance review of the work done by another professional of the firm.<br/>"+
                "- Asking the risk management function to validate the decision to continue the assignment.<br/><br/>"+
                "Please include the following calculations <br>"+
                "- Estimated Engagement Fee<br>"+
                "- Estimated department budget for the year<br>"+
                "- Engagement fee as % of department budget (Fee / Budget)",
            "sp_field_name":"Q6Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"Money" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C6Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
        },
        {
            "Title":"7. Does the client represent more than 50% of the engagement leader's portfolio?",
            "Description":"Document the description of the safeguards if answered, Yes or capture N/A, if No. Decline the engagement if no appropriate safeguards can be identified. Possible safeguards include<br>- Advising the client of the engagement terms and the basis on which fees are charged.<br>- Ensuring appropriate time and staff are allocated.<br> - Performing quality assurance review of the work done by another professional of the firm.<bt>- Asking the risk management function to validate the decision to continue the assignment.<br>Please include the following calculations<br>    - Estimated Engagement Fee<br>- Estimated department budget for the year<br>- Engagement fee as % of department budget (Fee / Budget)",
            "sp_field_name":"Q7Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"AccountManagement" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C7Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
        },
        {
            "Title":"8. Has the client developed new activities, through normal growth or acquisition, that require additional competencies or that significantly increase the service risk?",
            "Description":"Document the description of the safeguards if answered, Yes or capture N/A, if No. Decline the engagement if no appropriate safeguards can be identified. Possible safeguards: an engagement quality control reviewer, an experienced industry or service internal or external experts, or other additional risk procedures etc.",
            "sp_field_name":"Q8Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"AccountBrowser" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C8Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
        },
        {
            "Title":"9. Is the fee budget inadequate to perform the assignment properly?",
            "Description":"",
            "sp_field_name":"Q9Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"AllCurrency" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C9Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
            "field_icon":"MapPin" 
        },
        {
            "Title":"10. Are there scope limitations imposed by the client or lack of information to perform the assignment properly?",
            "Description":"",
            "sp_field_name":"Q10Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"TextDocument" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C10Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
        },
        {
            "Title":"11. Are there unpaid fees? Inspect the debtors ledger to identify and analyse any outstanding fees.",
            "Description":"Inspect the debtors ledger to identify and analyse any outstanding fees. Possible safeguards include an agreed payment plan, not delivering any services before settlement of the outstanding fees etc. Decline the engagement if no appropriate safeguards can be identified.",
            "sp_field_name":"Q11Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"AllCurrency" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C11Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
        },
        {
            "Title":"12. Is there any breach of the requirements for partner or senior staff rotation?",
            "Description": "",
            "sp_field_name":"Q12Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes", "N/A"],
            "field_icon":"MapPin" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C12Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
            "field_icon":"MapPin" 
        },
        {
            "Title":"13. Are there problems carrying out an EQR e.g. where required in terms of Forvis Mazars policy?",
            "Description":"Document the description of the safeguards if answered, Yes or capture N/A, if No. Decline the engagement if no appropriate safeguards can be identified. Possible safeguards: an engagement quality control reviewer, an experienced industry or service internal or external experts, or other additional risk procedures etc.",
            "sp_field_name":"Q13Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes", "N/A"],
            "field_icon":"MicrosoftTranslatorLogo" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C13Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
        },
        {
            "Title":"14. Has the client or audit committee raised issues regarding independence or other factors affecting the appointment of the firm?",
            "Description":"",
            "sp_field_name":"Q14Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes"],
            "field_icon":"MapPin" 
        },
        {
            "Title":"15. If you are on WeCheck please select 'Yes' and attach the WeCheck report under 'Supporting Documents'. If you use an alternative to WeCheck (Conflict check) please attach an alternative confirmation of acceptance.",
            "Description":"Document the description of the safeguards if answered, Yes or capture N/A, if No. Decline the engagement if no appropriate safeguards can be identified. Possible safeguards: an engagement quality control reviewer, an experienced industry or service internal or external experts, or other additional risk procedures etc.",
            "sp_field_name":"Q15Independence",
            "sp_field_type":"input",
            "field_width":"full-width",
            "field_validate":true,
            "sp_additional_properties":"radio-buttons-own-values display-field-commenting",
            "own_values":["No","Yes", "N/A"],
            "field_icon":"MapPin" 
        },
        {
            "Title":"",
            "Description":"",
            "sp_field_name":"C14Independence",
            "sp_field_type":"textarea",
            "field_width":"full-width",
            "field_validate":false,
            "sp_additional_properties":"none display-field-commenting",
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
    // based on original form - when Non-assurnace is selected continuance_indepence_and_other_considerations falls under AC Lite Accordion

}
