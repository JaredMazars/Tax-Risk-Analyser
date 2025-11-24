var navigation_cube = {}
navigation_cube.navigation_set = []

let view_dashboard_navigation =
    {
        "title":"View dashboard",
        "icon":"ViewDashboard",
        "data_type": "static_page",
        "form_data": "Dashboard Landing Page",
        "sub_links":[
            {
                "title":"View My Clients",
                "sub_links":[]
            },
            {
                "title":"My Approval Tasks",
                "sub_links":[]
            },
            {
                "title":"My Submissions",
                "sub_links":[]
            }
        ]
    }

let client_risk_assessment = 
    {
        "title":"Client Acceptance and Continuance",          
        "icon":"OfficeFormsLogo",    
        "data_type": "static_page",
        "form_data":"Client Acceptance Landing Page",   
        "sub_links":[
            {
                "title": "Client Acceptance",
                "data_type": "next_link_selection",
                "form_data":null,
                "sub_links": [
                    {
                        "title":"General"                                            
                    },
                    {
                        "title":"Team Information"                       
                    },
                    {
                        "title":"Client Information", 
                        "data_type": "next_link_selection",
                        "form_data":null,
                        "sub_links":[
                            {
                                "title":"General Information About the Engagement"
                            },
                            {
                                "title":"PIE"                              
                            },
                            {
                                "title":"Transnational Calculator"                               
                            },
                            {
                                "title":"S90 Calculator"                            
                            },
                            {
                                "title":"S90 Considerations"                            
                            },
                            {
                                "title":"Fee Considerations"     // previously labled: Assurance vs Non Assurance Calculator                        
                            },
                            {
                                "title":"Key Figures - recent financial year"
                            }                           
                        ]
                    },
                    {
                        "title":"EQR Calculator"                       
                    },
                    {
                        "title":"GIAC Form"
                    },
                    {
                        "title":"Business Sustainability"
                    },
                    {
                        "title":"Appendix A Clients",
                        "data_type": "next_link_selection",
                        "form_data":null,
                        "sub_links":[
                            {
                                "title":"Part A - Risk Considered as Major"
                            },
                            {
                                "title":"Part B - Risk Considered as Normal"
                            },
                            {
                                "title":"Risk Status"
                            }
                        ]
                    },
                    {
                        "title":"Appendix B Engagements",   
                        "data_type": "next_link_selection",
                        "form_data":null,                    
                        "sub_links":[
                            {
                                "title":"Acceptance - Independence and other Considerations"
                            }
                        ]
                    },
                    {
                        "title":"Appendix C Money Laundering",
                        "data_type": "next_link_selection",
                        "sub_links": [                            
                            {
                                "title": "Conclusion"
                            }
                        ]
                    },
                    {
                        "title":"Appendix D",    
                        "data_type": "next_link_selection",                    
                        "sub_links": [
                            {
                                "title":"1. Assessment of compliance with Independence rules"
                            }
                        ]
                    },
                    {
                        "title":"Approvals"
                    },
                    {
                        "title":"Supporting Documents"
                    }
                ]
                
            },   
            {
                "title": "Client Continuance",
                "data_type": "next_link_selection",
                "form_data":null,
                "sub_links": [
                    {
                        "title":"General"                                            
                    },
                    {
                        "title":"Team Information"                       
                    },
                    {
                        "title":"EQR Calculator"                       
                    },
                    {
                        "title":"GIAC Form"
                    },
                    {
                        "title":"Business Sustainability"
                    },
                    {
                        "title":"Client Information", 
                        "data_type": "next_link_selection",
                        "form_data":null,                      
                        "sub_links":[
                            {
                                "title":"General Information About the Engagement"
                            },
                            {
                                "title":"PIE"                               
                            },
                            {
                                "title":"Transnational Calculator"                            
                            },
                            {
                                "title":"S90 Calculator"                            
                            },
                            {
                                "title":"S90 Considerations"                            
                            },
                            {
                                "title":"Fee Considerations"     // previously labled: Assurance vs Non Assurance Calculator                        
                            },
                            {
                                "title":"Key Figures - recent financial year"
                            } 
                            
                        ]
                    },
                    {
                        "title":"Appendix A Clients",
                        "data_type": "next_link_selection",
                        "form_data":null,
                        "sub_links":[
                            {
                                "title":"Part A - Risk Considered as Major"
                            },
                            {
                                "title":"Part B - Risk Considered as Normal"
                            },                                                                            
                            {
                                "title":"Risk Status"
                            }
                        ]
                    },
                    {
                        "title":"Appendix B Engagements",   
                        "data_type": "next_link_selection",
                        "form_data":null,                    
                        "sub_links":[
                            {
                                "title":"Continuance - Independence and other Considerations"
                            }
                        ]
                    },
                    {
                        "title":"Appendix C Money Laundering",
                        "data_type": "next_link_selection",
                        "sub_links": [                           
                            {
                                "title": "Conclusion"
                            }
                        ]
                    },
                    {
                        "title":"Appendix D",    
                        "data_type": "next_link_selection",                    
                        "sub_links": [
                            {
                                "title":"1. Assessment of compliance with Independence rules"
                            }
                        ]
                    },
                    {
                        "title":"Approvals"
                    },
                    {
                        "title":"Supporting Documents"
                    }
                ]                
            }
        ]             
}      
