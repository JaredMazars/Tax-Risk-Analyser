//ENGAGEMENT LITE - A&C LITE - ASSESSMENT OF THE RISK OF MONEY LAUNDERING AND TERRORIST FINANCING ACTS
let a_and_c_lite_assessment_of_risk = [
    {
        "Title":"1. Is there evidence of dummy entities, companies or trusts?",
        "Description":"Examples include:<br>- The formation of entities, companies or trusts with no apparent commercial or other purpose.<br>- Frequent and unjustified changes of the entities' constitution/trust deed/articles/memorandum of incorporation etc... <br>- The use of financial, legal or other advisers who provide their names as executives, directors or trustees, with little or no commercial involvement.",
        "sp_field_name":"Q1ACLiteMoney",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"AccountManagement" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C1ACLiteMoney",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"2. Is there evidence of unusual operations regarding the economic activities of the client?",
        "Description":"Examples include: "+
            "<br>-Lack of documentation on the source of the client's funds or wealth."+
            "<br>- Transactions that appear inconsistent with the client's business, or using unusual circuits, "+
            "or transactions in which the identity of the beneficial owners is difficult to determine or there is unauthorised or "+
            "improperly recorded transactions or interrupted audit trial.<br>- Large unusual monetary transactions, "+
            "particular the exchange of tradable financial instruments or the transfer of funds to accounts in 'off-shore' locations."+
            "<br>- Where the client is keen to keep their anonymity, or actively avoids personal contact, or request that we conduct the "+
            "engagement with undue secrecy?",
            
        "sp_field_name":"Q2ACLiteMoney",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"MapPin" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C2ACLiteMoney",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
        "field_icon":"MapPin" 
    },
    {
        "Title": "Risk Outome",
        "Description": "",
        "sp_field_name": "RiskStatusACLiteMoney",
        "sp_field_type": "input",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none exclude-from-meta",
        "field_icon": "ReportWarning"
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
]


//ENGAGEMENT LITE  - INDEPENDENCE AND OTHER CONSIDERATIONS
let independence_and_other_considerations = [
    {

        "Title":"Mark all as No",
        "Description":"You can use this button to mark all the sections below",
        "sp_field_name":"sp-temp-bulk-mark-risks-as-no-independence",
        "sp_field_type":"button",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"exclude-from-meta hide-details"   
       
    },
    {
        "Title":"1. Are you aware of any personal, family or financial relationships between the firm, partners, consultants, directors other members of the network and the client?",
        "Description":"Use the engagement team independence template below if close personal or business relationships exists. Engagament Team Independence TemplatePossible safeguards include independent review, periodic quality control review, use of separate engagement team etc..",
        "sp_field_name":"Q1ACLiteINDP",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"Group" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C1ACLiteINDP",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"2. Do any potential conflicts of interest, arising from work carried out by the firm or a member of the Forvis Mazars network exist?",
        "Description":"Possible safeguards include:<br>Consulting the head of ethics of the firm.<br>Notifying the clients(s) and all known relevant parties of the possible conflict and obtaining their consent to act in such circumstances.<br> Use of separate engagement teams, with clear guidelines to each team on applicable security and confidentiality issues.Request an independence check",
        "sp_field_name":"Q2ACLiteINDP",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"ViewListGroup" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C2ACLiteINDP",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"3. Is the engagement team competent to perform the engagement and do they have the necessary capabilities, including time and resources to complete the engagement?",
        "Description":"Q31ACLiteINDP",
        "sp_field_name":"manual-drop-down-options",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"MicrosoftTranslatorLogo" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C3ACLiteINDP",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title": "Risk Outome",
        "Description": "",
        "sp_field_name": "RiskStatusACLiteINDP",
        "sp_field_type": "input",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none exclude-from-meta",
        "field_icon": "ReportWarning"
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
    }
]


//ENGAGEMENT LITE  - KNOW YOUR CLIENT (KYC) PROCEDURES - NEW CLIENT OR CHANGES TO EXISTING CLIENT'S CIRCUMSTANCES
let engagement_lite_know_your_client = [
    {
        "Title":"Please select your client type",
        "Description":"Individuals examples include:<br>"+
                        "- The formation of entities, companies or trusts with no apparent commercial or other purpose.<br/>"+
                        "- Frequent and unjustified changes of the entities' constitution/trust deed/articles/memorandum of incorporation etc...<br/>"+
                        "- The use of financial, legal or other advisers who provide their names as executives, directors or trustees, with little "+
                            "or no commercial involvement.<br/><br/>"+
                        "Private companies or Close Corporations include: <br/>" +
                        "- Directors or those who run the entity on a day to day basis including those that have payment approval rights<br/>"+
                        "- Justification for verifying the identities which could include obtaining copies of their ID documents.<br/><br/>"+
                        "Partnerships / Sole traders:<br/>"+
                        "- Sole trader or partners or those who run the business activities on a day to day basis including those that have cheque signing rights"+
                        "- Justification for verifying the identities which could include obtaining copies of their ID documents<br/><br/>"+
                        "Trusts: <br/>"+
                        "- Documentation of the nature and propose of the trust, original source of funding, those authorised to make payments and decisions on behalf of the trust<br/>"+
                        "- Justification for verifying the identities of the trustees, which could include obtaining copies of their ID documents?",
        "sp_field_name":"Q1ACLiteKYC",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["Individuals","Private companies or Close Corporations", "Partnerships / Sole traders","Trusts","None of the above"],
        "field_icon":"MapPin" 
    },  
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C1ACLiteKYC",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title": "Risk Outome",
        "Description": "",
        "sp_field_name": "RiskStatusACLiteKYC",
        "sp_field_type": "input",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none exclude-from-meta",
        "field_icon": "CalendarAgenda"
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
]


//CLIENT A&C LITE : PART A - RISK CONSIDERED AS MAJOR
let part_a_risk_considered_as_major = [
    {

        "Title":"Mark all as No",
        "Description":"You can use this button to mark all the sections below",
        "sp_field_name":"sp-temp-bulk-mark-risks-as-no-part-a",
        "sp_field_type":"button",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"exclude-from-meta hide-details"   
       
    },
    {
        "Title":"1. Have fraud risks, risk of money laundering and/or other criminal activities been identified from your knowledge and understanding of the client's activities?",
        "Description":"",
        "sp_field_name":"Q1ACLitePartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"TextDocumentShared" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C1ACLitePartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"2. How would we rate the risk associated with the reputation and integrity of high level management? The business reputation and integrity of related parties? Any undue pressure to achieve certain financial or other results?",
        "Description":"",
        "sp_field_name":"Q2ACLitePartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"AddGroup" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C2ACLitePartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"3. The type and extent of media coverage of the company or management, problems encountered with regulators e.g. market, industry etc.?",
        "Description":"",
        "sp_field_name":"Q3ACLitePartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"News" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C3ACLitePartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"4. The attitude of the company towards their service providers e.g. litigation, no access to certain information, the client is aggressive in maintaining the fees as low as possible, not accepting our engagement letter's standard terms and conditions?",
        "Description":"",
        "sp_field_name":"Q4ACLitePartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"BusinessCenterLogo" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C4ACLitePartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"5. Going concern issues?",
        "Description":"",
        "sp_field_name":"Q5ACLitePartA",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"ServerProcesses" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C5ACLitePartA",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title": "Risk Outome",
        "Description": "",
        "sp_field_name": "RiskStatusACLitePartA",
        "sp_field_type": "input",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none exclude-from-meta",
        "field_icon": "ReportWarning"
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
]

//CLIENT A&C LITE : PART B - RISK CONSIDERED AS NORMAL
let part_b_risk_considered_as_normal = [
    {

        "Title":"Mark all as No",
        "Description":"You can use this button to mark all the sections below",
        "sp_field_name":"sp-temp-bulk-mark-risks-as-no-part-b",
        "sp_field_type":"button",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"exclude-from-meta hide-details"   
       
    },
    {
        "Title":"1. Does the entity have problems in the application of standards or legislation, any non-compliance with regulations or a history of Reportable Irregularities or Non Compliance with Laws and Regulations?",
        "Description":"",
        "sp_field_name":"Q1ACLitePartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"TextDocumentShared" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C1ACLitePartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"2. Do we have clarity of legal structure and identification of ultimate beneficial owners",
        "Description":"",
        "sp_field_name":"Q2ACLitePartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"MapPin" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C2ACLitePartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"3. Any tax risks? (eg. features of the entity or business that would indicate tax risk)",
        "Description":"Document the reasons for the risk rating in terms of the underlying service you provide e.g.The tax department need to consider in terms of the underlying service they provide. The type, their experience and the complexity of each case.For other lines of services the tax risks will probably indicate a higher risk and the rating will depend on the significance.",
        "sp_field_name":"Q3ACLitePartB",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"ReportWarning" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C3ACLitePartB",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none", 
    },
    {
        "Title": "Risk Outome",
        "Description": "",
        "sp_field_name": "RiskStatusACLitePartB",
        "sp_field_type": "input",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none none exclude-from-meta",
        "field_icon": "CalendarAgenda"
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
]


//AC LITE >> AC LITE
let ac_lite = [
    {

        "Title":"Mark all as No",
        "Description":"You can use this button to mark all the sections below",
        "sp_field_name":"sp-temp-bulk-mark-risks-as-no-ac-lite",
        "sp_field_type":"button",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"exclude-from-meta hide-details"   
       
    },
    {
        "Title":"1. Standalone client that does not form part of a group (Client's group)?",
        "Description":"",
        "sp_field_name":"Q1ACLite",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"AccountManagement" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C1ACLite",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"2. Less-complex client with little or no significant judgments and estimates involved in the engagement?",
        "Description":"",
        "sp_field_name":"Q2ACLite",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"MapPin" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C2ACLite",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"3. Our total estimated annual fee for all lines of service is less than R250,000?",
        "Description":"",
        "sp_field_name":"Q3ACLite",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"Money" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C3ACLite",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"4. Client is NOT a Public Interest Entity (PIE) nor a Transnational client?",
        "Description":"",
        "sp_field_name":"Q4ACLite",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"Group" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C4ACLite",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"5. No Politically Exposed Persons are involved with the client (PEPs)?",
        "Description":"",
        "sp_field_name":"Q5ACLite",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"EngineeringGroup" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C5ACLite",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title":"6. Client is not a restricted entity?",
        "Description":"",
        "sp_field_name":"Q6ACLite",
        "sp_field_type":"input",
        "field_width":"full-width",
        "field_validate":true,
        "sp_additional_properties":"radio-buttons-own-values",
        "own_values":["No","Yes"],
        "field_icon":"UserWarning" 
    },
    {
        "Title":"",
        "Description":"",
        "sp_field_name":"C6ACLite",
        "sp_field_type":"textarea",
        "field_width":"full-width",
        "field_validate":false,
        "sp_additional_properties":"none",
    },
    {
        "Title": "Risk Outome",
        "Description": "",
        "sp_field_name": "RiskStatusACLite",
        "sp_field_type": "input",
        "field_width": "full-width",
        "field_validate": false,
        "sp_additional_properties": "none exclude-from-meta",
        "field_icon": "TextDocumentShared"
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
]


let continuance_lite_fields = {
    ...global_field_set_navigation,
    "a_and_c_lite_assessment_of_risk":a_and_c_lite_assessment_of_risk,
    "independence_and_other_considerations": independence_and_other_considerations,
    "engagement_lite_know_your_client": engagement_lite_know_your_client,
    "part_a_risk_considered_as_major": part_a_risk_considered_as_major,
    "part_b_risk_considered_as_normal":part_b_risk_considered_as_normal,
    "ac_lite":ac_lite
}

