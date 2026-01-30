/**
 * BD Opportunity Wizard Type Definitions
 * Types for the multi-step opportunity creation wizard
 */

export interface BDWizardData {
  // Step 1: Client/Prospect Selection
  workflowType: 'existing' | 'prospect';
  clientId?: number; // For existing clients
  
  // Step 2: Prospect Details (new prospects only)
  prospectDetails?: {
    companyName: string;
    industry?: string;
    sector?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    groupCode: string;
    groupDesc?: string;
  };
  
  // Step 3: Team Assignment (new prospects only)
  teamAssignment?: {
    partnerCode: string;
    managerCode: string;
    inchargeCode: string;
  };
  
  // Step 4: Client Acceptance (new prospects only)
  clientAcceptanceId?: number;
  clientAcceptanceCompleted?: boolean;
  
  // Step 5: Opportunity Details
  opportunityDetails: {
    title: string;
    description?: string;
    value?: number;
    probability?: number;
    expectedCloseDate?: string;
    source?: string;
    serviceLine: string; // Master service line (TAX, AUDIT, etc.)
    servLineCode?: string; // Specific service line code from ServiceLineExternal
    stageId: number;
    // Assignment scheduling
    assignmentType?: 'ONCE_OFF' | 'RECURRING';
    startDate?: string;
    endDate?: string;
    recurringFrequency?: 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'YEARLY';
  };
  
  // Step 6: Proposal Type
  proposalType: 'quick' | 'custom';
  templateId?: number; // For quick proposals
  
  // Step 7: Proposal Upload (custom only)
  proposalFile?: {
    fileName: string;
    filePath: string;
    fileSize: number;
  };
}

/**
 * Props for wizard step components
 */
export interface StepProps {
  wizardData: BDWizardData;
  updateWizardData: (updates: Partial<BDWizardData>) => void;
  onNext: () => void;
  onBack?: () => void;
  opportunityId?: number | null;
}

/**
 * Wizard step configuration
 */
export interface WizardStep {
  id: number;
  label: string;
  component: React.ComponentType<StepProps>;
  required: (data: BDWizardData) => boolean; // Conditional steps
}

/**
 * Employee data for team assignment
 */
export interface EmployeeOption {
  EmpCode: string;
  EmpName: string;
  EmpNameFull: string;
  ServLineDesc: string;
  EmpCatCode: string;
  EmpCatDesc: string;
}

/**
 * Client search result
 */
export interface ClientSearchResult {
  id: number;
  clientCode: string;
  clientNameFull: string | null;
  groupDesc: string | null;
  groupCode: string;
}

/**
 * Template option for proposal generation
 */
export interface TemplateOption {
  id: number;
  name: string;
  description: string | null;
  type: string;
  serviceLine: string | null;
}
