BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AcceptanceAnswer] (
    [id] INT NOT NULL IDENTITY(1,1),
    [responseId] INT NOT NULL,
    [questionId] INT NOT NULL,
    [answer] NVARCHAR(max),
    [comment] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AcceptanceAnswer_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [AcceptanceAnswer_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK__Acceptan__3213E83F4AB0FF4B] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AcceptanceAnswer_responseId_questionId_key] UNIQUE NONCLUSTERED ([responseId],[questionId])
);

-- CreateTable
CREATE TABLE [dbo].[AcceptanceDocument] (
    [id] INT NOT NULL IDENTITY(1,1),
    [responseId] INT NOT NULL,
    [documentType] NVARCHAR(50) NOT NULL,
    [fileName] NVARCHAR(255) NOT NULL,
    [filePath] NVARCHAR(500) NOT NULL,
    [fileSize] INT NOT NULL,
    [uploadedBy] NVARCHAR(200) NOT NULL,
    [uploadedAt] DATETIME2 NOT NULL CONSTRAINT [AcceptanceDocument_uploadedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AcceptanceDocument_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK__Acceptan__3213E83FEBEE39E6] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AcceptanceQuestion] (
    [id] INT NOT NULL IDENTITY(1,1),
    [questionnaireType] NVARCHAR(50) NOT NULL,
    [sectionKey] NVARCHAR(100) NOT NULL,
    [questionKey] NVARCHAR(100) NOT NULL,
    [questionText] NVARCHAR(max) NOT NULL,
    [description] NVARCHAR(max),
    [fieldType] NVARCHAR(50) NOT NULL,
    [options] NVARCHAR(max),
    [required] BIT NOT NULL CONSTRAINT [AcceptanceQuestion_required_df] DEFAULT 1,
    [order] INT NOT NULL,
    [riskWeight] FLOAT(53) NOT NULL CONSTRAINT [AcceptanceQuestion_riskWeight_df] DEFAULT 1.0,
    [highRiskAnswers] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AcceptanceQuestion_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [AcceptanceQuestion_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK__Acceptan__3213E83FB3075BED] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AcceptanceQuestion_questionnaireType_questionKey_key] UNIQUE NONCLUSTERED ([questionnaireType],[questionKey])
);

-- CreateTable
CREATE TABLE [dbo].[Account] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [provider] NVARCHAR(1000) NOT NULL,
    [providerAccountId] NVARCHAR(1000) NOT NULL,
    [refresh_token] NVARCHAR(1000),
    [access_token] NVARCHAR(1000),
    [expires_at] INT,
    [token_type] NVARCHAR(1000),
    [scope] NVARCHAR(1000),
    [id_token] NVARCHAR(1000),
    [session_state] NVARCHAR(1000),
    CONSTRAINT [Account_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Account_provider_providerAccountId_key] UNIQUE NONCLUSTERED ([provider],[providerAccountId])
);

-- CreateTable
CREATE TABLE [dbo].[AdjustmentDocument] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [taxAdjustmentId] INT,
    [fileName] NVARCHAR(1000) NOT NULL,
    [fileType] NVARCHAR(1000) NOT NULL,
    [fileSize] INT NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [uploadedBy] NVARCHAR(1000),
    [extractionStatus] NVARCHAR(1000) NOT NULL CONSTRAINT [AdjustmentDocument_extractionStatus_df] DEFAULT 'PENDING',
    [extractedData] NVARCHAR(1000),
    [extractionError] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AdjustmentDocument_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [AdjustmentDocument_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AITaxReport] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [executiveSummary] NVARCHAR(max) NOT NULL,
    [risks] NVARCHAR(max) NOT NULL,
    [taxSensitiveItems] NVARCHAR(max) NOT NULL,
    [detailedFindings] NVARCHAR(max) NOT NULL,
    [recommendations] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AITaxReport_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [AITaxReport_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BDActivity] (
    [id] INT NOT NULL IDENTITY(1,1),
    [opportunityId] INT NOT NULL,
    [contactId] INT,
    [activityType] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [BDActivity_status_df] DEFAULT 'SCHEDULED',
    [dueDate] DATETIME2,
    [completedAt] DATETIME2,
    [duration] INT,
    [location] NVARCHAR(1000),
    [assignedTo] NVARCHAR(1000) NOT NULL,
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BDActivity_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [BDActivity_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BDContact] (
    [id] INT NOT NULL IDENTITY(1,1),
    [companyName] NVARCHAR(1000),
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [mobile] NVARCHAR(1000),
    [jobTitle] NVARCHAR(1000),
    [linkedin] NVARCHAR(1000),
    [industry] NVARCHAR(1000),
    [sector] NVARCHAR(1000),
    [website] NVARCHAR(1000),
    [address] NVARCHAR(1000),
    [city] NVARCHAR(1000),
    [province] NVARCHAR(1000),
    [postalCode] NVARCHAR(1000),
    [country] NVARCHAR(1000) CONSTRAINT [BDContact_country_df] DEFAULT 'South Africa',
    [notes] NVARCHAR(max),
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BDContact_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [BDContact_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BDNote] (
    [id] INT NOT NULL IDENTITY(1,1),
    [opportunityId] INT NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [isPrivate] BIT NOT NULL CONSTRAINT [BDNote_isPrivate_df] DEFAULT 0,
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BDNote_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [BDNote_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BDOpportunity] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [companyName] NVARCHAR(1000),
    [contactId] INT,
    [serviceLine] NVARCHAR(1000) NOT NULL,
    [stageId] INT NOT NULL,
    [value] FLOAT(53),
    [probability] FLOAT(53),
    [expectedCloseDate] DATETIME2,
    [source] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [BDOpportunity_status_df] DEFAULT 'OPEN',
    [lostReason] NVARCHAR(1000),
    [assignedTo] NVARCHAR(1000) NOT NULL,
    [convertedToClientId] INT,
    [convertedAt] DATETIME2,
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BDOpportunity_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [clientId] INT,
    CONSTRAINT [BDOpportunity_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BDProposal] (
    [id] INT NOT NULL IDENTITY(1,1),
    [opportunityId] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [fileName] NVARCHAR(1000) NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [fileSize] INT NOT NULL,
    [proposedValue] FLOAT(53),
    [validUntil] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [BDProposal_status_df] DEFAULT 'DRAFT',
    [sentAt] DATETIME2,
    [viewedAt] DATETIME2,
    [respondedAt] DATETIME2,
    [version] INT NOT NULL CONSTRAINT [BDProposal_version_df] DEFAULT 1,
    [uploadedBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BDProposal_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [BDProposal_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BDStage] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [order] INT NOT NULL,
    [probability] FLOAT(53) NOT NULL,
    [serviceLine] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [BDStage_isActive_df] DEFAULT 1,
    [isDefault] BIT NOT NULL CONSTRAINT [BDStage_isDefault_df] DEFAULT 0,
    [color] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BDStage_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [BDStage_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [BDStage_serviceLine_name_key] UNIQUE NONCLUSTERED ([serviceLine],[name])
);

-- CreateTable
CREATE TABLE [dbo].[Client] (
    [id] INT NOT NULL IDENTITY(1,1),
    [clientCode] NVARCHAR(10) NOT NULL,
    [clientNameFull] NVARCHAR(255),
    [groupCode] NVARCHAR(10) NOT NULL,
    [groupDesc] NVARCHAR(150) NOT NULL,
    [clientPartner] NVARCHAR(10) NOT NULL,
    [clientManager] NVARCHAR(10) NOT NULL,
    [clientIncharge] NVARCHAR(10) NOT NULL,
    [active] VARCHAR(3) NOT NULL,
    [clientDateOpen] DATETIME2,
    [clientDateTerminate] DATETIME2,
    [industry] NVARCHAR(255),
    [sector] NVARCHAR(255),
    [forvisMazarsIndustry] NVARCHAR(255),
    [forvisMazarsSector] NVARCHAR(255),
    [forvisMazarsSubsector] NVARCHAR(255),
    [clientOCFlag] BIT NOT NULL,
    [clientTaxFlag] BIT,
    [clientSecFlag] BIT,
    [creditor] BIT,
    [rolePlayer] BIT NOT NULL,
    [typeCode] NVARCHAR(10) NOT NULL,
    [typeDesc] NVARCHAR(50) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Client_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [GSClientID] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [Client_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Client_clientCode_key] UNIQUE NONCLUSTERED ([clientCode]),
    CONSTRAINT [Client_GSClientID_key] UNIQUE NONCLUSTERED ([GSClientID])
);

-- CreateTable
CREATE TABLE [dbo].[ClientAcceptanceResponse] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [clientId] INT NOT NULL,
    [questionnaireType] NVARCHAR(50) NOT NULL,
    [overallRiskScore] FLOAT(53),
    [riskRating] NVARCHAR(20),
    [riskSummary] NVARCHAR(max),
    [completedAt] DATETIME2,
    [completedBy] NVARCHAR(200),
    [reviewedBy] NVARCHAR(200),
    [reviewedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ClientAcceptanceResponse_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [ClientAcceptanceResponse_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK__ClientAc__3213E83F94B62F25] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientAnalyticsDocument] (
    [id] INT NOT NULL IDENTITY(1,1),
    [clientId] INT NOT NULL,
    [documentType] NVARCHAR(1000) NOT NULL,
    [fileName] NVARCHAR(1000) NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [fileSize] INT NOT NULL,
    [uploadedBy] NVARCHAR(1000) NOT NULL,
    [uploadedAt] DATETIME2 NOT NULL CONSTRAINT [ClientAnalyticsDocument_uploadedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [extractedData] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ClientAnalyticsDocument_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ClientAnalyticsDocument_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ClientCreditRating] (
    [id] INT NOT NULL IDENTITY(1,1),
    [clientId] INT NOT NULL,
    [ratingScore] FLOAT(53) NOT NULL,
    [ratingGrade] NVARCHAR(1000) NOT NULL,
    [ratingDate] DATETIME2 NOT NULL CONSTRAINT [ClientCreditRating_ratingDate_df] DEFAULT CURRENT_TIMESTAMP,
    [analysisReport] NVARCHAR(max) NOT NULL,
    [financialRatios] NVARCHAR(max) NOT NULL,
    [confidence] FLOAT(53) NOT NULL,
    [analyzedBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ClientCreditRating_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ClientCreditRating_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ComplianceChecklist] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [dueDate] DATETIME2,
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [ComplianceChecklist_priority_df] DEFAULT 'MEDIUM',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ComplianceChecklist_status_df] DEFAULT 'PENDING',
    [assignedTo] NVARCHAR(1000),
    [completedAt] DATETIME2,
    [completedBy] NVARCHAR(1000),
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ComplianceChecklist_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ComplianceChecklist_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CreditRatingDocument] (
    [id] INT NOT NULL IDENTITY(1,1),
    [creditRatingId] INT NOT NULL,
    [analyticsDocumentId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CreditRatingDocument_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CreditRatingDocument_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CreditRatingDocument_creditRatingId_analyticsDocumentId_key] UNIQUE NONCLUSTERED ([creditRatingId],[analyticsDocumentId])
);

-- CreateTable
CREATE TABLE [dbo].[EmailLog] (
    [id] INT NOT NULL IDENTITY(1,1),
    [recipientEmail] NVARCHAR(1000) NOT NULL,
    [recipientUserId] NVARCHAR(1000),
    [emailType] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [errorMessage] NVARCHAR(1000),
    [metadata] NVARCHAR(max),
    [sentAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [EmailLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [EmailLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Employee] (
    [id] INT NOT NULL IDENTITY(1,1),
    [GSEmployeeID] UNIQUEIDENTIFIER NOT NULL,
    [EmpCode] NVARCHAR(10) NOT NULL,
    [EmpName] NVARCHAR(50) NOT NULL,
    [EmpNameFull] NVARCHAR(63) NOT NULL,
    [OfficeCode] NVARCHAR(10) NOT NULL,
    [SLGroup] NVARCHAR(10) NOT NULL,
    [ServLineCode] NVARCHAR(10) NOT NULL,
    [ServLineDesc] NVARCHAR(150) NOT NULL,
    [SubServLineCode] NVARCHAR(10) NOT NULL,
    [SubServLineDesc] NVARCHAR(50) NOT NULL,
    [EmpCatCode] NVARCHAR(5) NOT NULL,
    [EmpCatDesc] NVARCHAR(50) NOT NULL,
    [EmpCatType] NVARCHAR(1),
    [RateValue] MONEY NOT NULL,
    [EmpDateLeft] DATETIME2,
    [Active] VARCHAR(3) NOT NULL,
    [EmpDateStarted] DATETIME2,
    [Team] NVARCHAR(100),
    [WinLogon] NVARCHAR(100),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Employee_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Employee_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Employee_GSEmployeeID_key] UNIQUE NONCLUSTERED ([GSEmployeeID]),
    CONSTRAINT [Employee_EmpCode_key] UNIQUE NONCLUSTERED ([EmpCode])
);

-- CreateTable
CREATE TABLE [dbo].[FilingStatus] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [filingType] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [FilingStatus_status_df] DEFAULT 'PENDING',
    [deadline] DATETIME2,
    [submittedDate] DATETIME2,
    [approvedDate] DATETIME2,
    [referenceNumber] NVARCHAR(1000),
    [notes] NVARCHAR(max),
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [FilingStatus_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [FilingStatus_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[InAppNotification] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [taskId] INT,
    [type] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [message] NVARCHAR(max) NOT NULL,
    [actionUrl] NVARCHAR(1000),
    [isRead] BIT NOT NULL CONSTRAINT [InAppNotification_isRead_df] DEFAULT 0,
    [readAt] DATETIME2,
    [metadata] NVARCHAR(max),
    [fromUserId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [InAppNotification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [InAppNotification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[LegalPrecedent] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [caseName] NVARCHAR(1000) NOT NULL,
    [citation] NVARCHAR(1000) NOT NULL,
    [court] NVARCHAR(1000),
    [year] INT,
    [summary] NVARCHAR(max) NOT NULL,
    [relevance] NVARCHAR(max),
    [link] NVARCHAR(1000),
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [LegalPrecedent_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [LegalPrecedent_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MappedAccount] (
    [id] INT NOT NULL IDENTITY(1,1),
    [accountCode] NVARCHAR(1000) NOT NULL,
    [accountName] NVARCHAR(1000) NOT NULL,
    [section] NVARCHAR(1000) NOT NULL,
    [subsection] NVARCHAR(1000) NOT NULL,
    [balance] FLOAT(53) NOT NULL,
    [priorYearBalance] FLOAT(53) NOT NULL CONSTRAINT [MappedAccount_priorYearBalance_df] DEFAULT 0,
    [sarsItem] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [MappedAccount_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [taskId] INT NOT NULL,
    CONSTRAINT [MappedAccount_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[NotificationPreference] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [taskId] INT,
    [notificationType] NVARCHAR(1000) NOT NULL,
    [emailEnabled] BIT NOT NULL CONSTRAINT [NotificationPreference_emailEnabled_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [NotificationPreference_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [NotificationPreference_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [NotificationPreference_userId_taskId_notificationType_key] UNIQUE NONCLUSTERED ([userId],[taskId],[notificationType])
);

-- CreateTable
CREATE TABLE [dbo].[OpinionChatMessage] (
    [id] INT NOT NULL IDENTITY(1,1),
    [opinionDraftId] INT NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [metadata] NVARCHAR(max),
    [sectionGenerationId] NVARCHAR(1000),
    [sectionType] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OpinionChatMessage_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [OpinionChatMessage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[OpinionDocument] (
    [id] INT NOT NULL IDENTITY(1,1),
    [opinionDraftId] INT NOT NULL,
    [fileName] NVARCHAR(1000) NOT NULL,
    [fileType] NVARCHAR(1000) NOT NULL,
    [fileSize] INT NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [extractedText] NVARCHAR(max),
    [vectorized] BIT NOT NULL CONSTRAINT [OpinionDocument_vectorized_df] DEFAULT 0,
    [uploadedBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OpinionDocument_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [OpinionDocument_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[OpinionDraft] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [version] INT NOT NULL CONSTRAINT [OpinionDraft_version_df] DEFAULT 1,
    [title] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [OpinionDraft_status_df] DEFAULT 'DRAFT',
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OpinionDraft_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [OpinionDraft_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[OpinionSection] (
    [id] INT NOT NULL IDENTITY(1,1),
    [opinionDraftId] INT NOT NULL,
    [sectionType] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [aiGenerated] BIT NOT NULL CONSTRAINT [OpinionSection_aiGenerated_df] DEFAULT 0,
    [reviewed] BIT NOT NULL CONSTRAINT [OpinionSection_reviewed_df] DEFAULT 0,
    [reviewedBy] NVARCHAR(1000),
    [reviewedAt] DATETIME2,
    [order] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OpinionSection_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [OpinionSection_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ResearchNote] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [tags] NVARCHAR(1000),
    [category] NVARCHAR(1000),
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ResearchNote_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ResearchNote_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SarsResponse] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [referenceNumber] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [SarsResponse_status_df] DEFAULT 'PENDING',
    [responseType] NVARCHAR(1000) NOT NULL,
    [deadline] DATETIME2,
    [sentDate] DATETIME2,
    [receivedDate] DATETIME2,
    [documentPath] NVARCHAR(1000),
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SarsResponse_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [SarsResponse_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ServiceLineMaster] (
    [code] NVARCHAR(50) NOT NULL,
    [name] NVARCHAR(200) NOT NULL,
    [description] NVARCHAR(500),
    [active] BIT NOT NULL CONSTRAINT [ServiceLineMaster_active_df] DEFAULT 1,
    [sortOrder] INT NOT NULL CONSTRAINT [ServiceLineMaster_sortOrder_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ServiceLineMaster_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ServiceLineMaster_pkey] PRIMARY KEY CLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[ServiceLineExternal] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ServLineCode] NVARCHAR(10),
    [ServLineDesc] NVARCHAR(150),
    [GLPrefix] NVARCHAR(10),
    [SLGroup] NVARCHAR(10),
    [masterCode] NVARCHAR(50),
    [SubServlineGroupCode] NVARCHAR(10),
    [SubServlineGroupDesc] NVARCHAR(150),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ServiceLineExternal_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ServiceLineExternal_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ServiceLineUser] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [subServiceLineGroup] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [ServiceLineUser_role_df] DEFAULT 'USER',
    [assignmentType] NVARCHAR(1000) NOT NULL CONSTRAINT [ServiceLineUser_assignmentType_df] DEFAULT 'SPECIFIC_SUBGROUP',
    [parentAssignmentId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ServiceLineUser_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ServiceLineUser_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ServiceLineUser_userId_subServiceLineGroup_key] UNIQUE NONCLUSTERED ([userId],[subServiceLineGroup])
);

-- CreateTable
CREATE TABLE [dbo].[Session] (
    [id] NVARCHAR(1000) NOT NULL,
    [sessionToken] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [Session_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Session_sessionToken_key] UNIQUE NONCLUSTERED ([sessionToken])
);

-- CreateTable
CREATE TABLE [dbo].[Task] (
    [id] INT NOT NULL IDENTITY(1,1),
    [clientId] INT,
    [GSTaskID] UNIQUEIDENTIFIER NOT NULL,
    [GSClientID] UNIQUEIDENTIFIER,
    [TaskCode] NVARCHAR(10) NOT NULL,
    [TaskDesc] NVARCHAR(150) NOT NULL,
    [TaskPartner] NVARCHAR(10) NOT NULL,
    [TaskPartnerName] NVARCHAR(50) NOT NULL,
    [TaskManager] NVARCHAR(10) NOT NULL,
    [TaskManagerName] NVARCHAR(50) NOT NULL,
    [OfficeCode] NVARCHAR(10) NOT NULL,
    [SLGroup] NVARCHAR(10) NOT NULL,
    [ServLineCode] NVARCHAR(10) NOT NULL,
    [ServLineDesc] NVARCHAR(150) NOT NULL,
    [Active] VARCHAR(3) NOT NULL,
    [TaskDateOpen] DATETIME2 NOT NULL,
    [TaskDateTerminate] DATETIME2,
    [createdBy] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Task_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Task_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Task_GSTaskID_key] UNIQUE NONCLUSTERED ([GSTaskID])
);

-- CreateTable
CREATE TABLE [dbo].[TaskTeam] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [TaskTeam_role_df] DEFAULT 'VIEWER',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TaskTeam_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TaskTeam_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TaskTeam_taskId_userId_key] UNIQUE NONCLUSTERED ([taskId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[TaskAcceptance] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [acceptanceApproved] BIT NOT NULL CONSTRAINT [TaskAcceptance_acceptanceApproved_df] DEFAULT 0,
    [approvedBy] NVARCHAR(1000),
    [approvedAt] DATETIME2,
    [questionnaireType] NVARCHAR(1000),
    [overallRiskScore] FLOAT(53),
    [riskRating] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TaskAcceptance_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [TaskAcceptance_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TaskAcceptance_taskId_key] UNIQUE NONCLUSTERED ([taskId])
);

-- CreateTable
CREATE TABLE [dbo].[TaskEngagementLetter] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [generated] BIT NOT NULL CONSTRAINT [TaskEngagementLetter_generated_df] DEFAULT 0,
    [uploaded] BIT NOT NULL CONSTRAINT [TaskEngagementLetter_uploaded_df] DEFAULT 0,
    [filePath] NVARCHAR(1000),
    [content] NVARCHAR(max),
    [templateId] INT,
    [generatedAt] DATETIME2,
    [generatedBy] NVARCHAR(1000),
    [uploadedAt] DATETIME2,
    [uploadedBy] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TaskEngagementLetter_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [TaskEngagementLetter_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TaskEngagementLetter_taskId_key] UNIQUE NONCLUSTERED ([taskId])
);

-- CreateTable
CREATE TABLE [dbo].[TaskDocument] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [fileName] NVARCHAR(1000) NOT NULL,
    [fileType] NVARCHAR(1000) NOT NULL,
    [fileSize] INT NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [version] INT NOT NULL CONSTRAINT [TaskDocument_version_df] DEFAULT 1,
    [uploadedBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TaskDocument_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [TaskDocument_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TaxAdjustment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [taskId] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [amount] FLOAT(53) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [TaxAdjustment_status_df] DEFAULT 'SUGGESTED',
    [sourceDocuments] NVARCHAR(1000),
    [extractedData] NVARCHAR(1000),
    [calculationDetails] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    [sarsSection] NVARCHAR(1000),
    [confidenceScore] FLOAT(53),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TaxAdjustment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [TaxAdjustment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Template] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL,
    [serviceLine] NVARCHAR(1000),
    [projectType] NVARCHAR(1000),
    [content] NVARCHAR(max) NOT NULL,
    [active] BIT NOT NULL CONSTRAINT [Template_active_df] DEFAULT 1,
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Template_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Template_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TemplateSection] (
    [id] INT NOT NULL IDENTITY(1,1),
    [templateId] INT NOT NULL,
    [sectionKey] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [isRequired] BIT NOT NULL CONSTRAINT [TemplateSection_isRequired_df] DEFAULT 1,
    [isAiAdaptable] BIT NOT NULL CONSTRAINT [TemplateSection_isAiAdaptable_df] DEFAULT 0,
    [order] INT NOT NULL,
    [applicableServiceLines] NVARCHAR(max),
    [applicableProjectTypes] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TemplateSection_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [TemplateSection_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [email] NVARCHAR(1000) NOT NULL,
    [emailVerified] DATETIME2,
    [image] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'USER',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Debtors] (
    [id] INT NOT NULL IDENTITY(1,1),
    [clientId] INT,
    [PeriodRef] INT,
    [PeriodStart] DATETIME2,
    [PeriodEnd] DATETIME2,
    [GSClientID] UNIQUEIDENTIFIER NOT NULL,
    [Biller] NVARCHAR(10) NOT NULL,
    [OfficeCode] NVARCHAR(10) NOT NULL,
    [ServLineCode] NVARCHAR(10) NOT NULL,
    [LTDInv] MONEY,
    [LTDFee] MONEY,
    [LTDVat] MONEY,
    [LTDCn] MONEY,
    [LTDRec] MONEY,
    [LTDInt] MONEY,
    [LTDPLFC] MONEY,
    [YTDInv] MONEY,
    [YTDFee] MONEY,
    [YTDVat] MONEY,
    [YTDCn] MONEY,
    [YTDRec] MONEY,
    [YTDInt] MONEY,
    [YTDPLFC] MONEY,
    [PTDInv] MONEY,
    [PTDFee] MONEY,
    [PTDVat] MONEY,
    [PTDCn] MONEY,
    [PTDRec] MONEY,
    [PTDInt] MONEY,
    [PTDPLFC] MONEY,
    [CBal] MONEY,
    [BalCurr] MONEY,
    [Bal30] MONEY,
    [Bal60] MONEY,
    [Bal90] MONEY,
    [Bal120] MONEY,
    [Bal150] MONEY,
    [Bal180] MONEY,
    [DebtorProvision] MONEY,
    [PTDDebtorProvision] MONEY,
    [YTDDebtorProvision] MONEY,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Debtors_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Debtors_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[VerificationToken] (
    [identifier] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [VerificationToken_token_key] UNIQUE NONCLUSTERED ([token]),
    CONSTRAINT [VerificationToken_identifier_token_key] UNIQUE NONCLUSTERED ([identifier],[token])
);

-- CreateTable
CREATE TABLE [dbo].[Wip] (
    [id] INT NOT NULL IDENTITY(1,1),
    [clientId] INT,
    [taskId] INT,
    [GSWipID] UNIQUEIDENTIFIER NOT NULL,
    [PeriodRef] INT,
    [PeriodStart] DATETIME2,
    [PeriodEnd] DATETIME2,
    [GSClientID] UNIQUEIDENTIFIER NOT NULL,
    [GSTaskID] UNIQUEIDENTIFIER NOT NULL,
    [ClientCode] NVARCHAR(10) NOT NULL,
    [TaskCode] NVARCHAR(10) NOT NULL,
    [OfficeCode] NVARCHAR(10) NOT NULL,
    [ServLineCode] NVARCHAR(10) NOT NULL,
    [TaskPartner] NVARCHAR(10) NOT NULL,
    [LTDTime] MONEY,
    [LTDDisb] MONEY,
    [LTDFeeTime] MONEY,
    [LTDFeeDisb] MONEY,
    [LTDAdjTime] MONEY,
    [LTDAdjDisb] MONEY,
    [LTDCost] MONEY,
    [YTDTime] MONEY,
    [YTDDisb] MONEY,
    [YTDFeeTime] MONEY,
    [YTDFeeDisb] MONEY,
    [YTDAdjTime] MONEY,
    [YTDAdjDisb] MONEY,
    [YTDCost] MONEY,
    [PTDTime] MONEY,
    [PTDDisb] MONEY,
    [PTDFeeTime] MONEY,
    [PTDFeeDisb] MONEY,
    [PTDAdjTime] MONEY,
    [PTDAdjDisb] MONEY,
    [PTDCost] MONEY,
    [BalTime] MONEY,
    [BalDisb] MONEY,
    [BalWIP] MONEY,
    [WipProvision] MONEY,
    [PTDProvision] MONEY,
    [YTDProvision] MONEY,
    [PTDPendingTime] MONEY,
    [YTDPendingTime] MONEY,
    [LTDPendingTime] MONEY,
    [PTDCostExcludeCP] MONEY,
    [YTDCostExcludeCP] MONEY,
    [LTDCostExcludeCP] MONEY,
    [LTDHours] MONEY,
    [YTDHours] MONEY,
    [PTDHours] MONEY,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Wip_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Wip_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Wip_GSWipID_key] UNIQUE NONCLUSTERED ([GSWipID])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AcceptanceAnswer_questionId_idx] ON [dbo].[AcceptanceAnswer]([questionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AcceptanceAnswer_responseId_idx] ON [dbo].[AcceptanceAnswer]([responseId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AcceptanceDocument_documentType_idx] ON [dbo].[AcceptanceDocument]([documentType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AcceptanceDocument_responseId_idx] ON [dbo].[AcceptanceDocument]([responseId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AcceptanceQuestion_questionnaireType_idx] ON [dbo].[AcceptanceQuestion]([questionnaireType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AcceptanceQuestion_questionnaireType_order_idx] ON [dbo].[AcceptanceQuestion]([questionnaireType], [order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AcceptanceQuestion_questionnaireType_sectionKey_idx] ON [dbo].[AcceptanceQuestion]([questionnaireType], [sectionKey]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Account_userId_idx] ON [dbo].[Account]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AdjustmentDocument_extractionStatus_idx] ON [dbo].[AdjustmentDocument]([extractionStatus]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AdjustmentDocument_extractionStatus_taskId_idx] ON [dbo].[AdjustmentDocument]([extractionStatus], [taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AdjustmentDocument_taskId_idx] ON [dbo].[AdjustmentDocument]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AdjustmentDocument_taxAdjustmentId_idx] ON [dbo].[AdjustmentDocument]([taxAdjustmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AITaxReport_taskId_idx] ON [dbo].[AITaxReport]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDActivity_activityType_idx] ON [dbo].[BDActivity]([activityType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDActivity_assignedTo_idx] ON [dbo].[BDActivity]([assignedTo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDActivity_assignedTo_status_dueDate_idx] ON [dbo].[BDActivity]([assignedTo], [status], [dueDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDActivity_contactId_idx] ON [dbo].[BDActivity]([contactId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDActivity_dueDate_idx] ON [dbo].[BDActivity]([dueDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDActivity_opportunityId_createdAt_idx] ON [dbo].[BDActivity]([opportunityId], [createdAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDActivity_opportunityId_idx] ON [dbo].[BDActivity]([opportunityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDActivity_status_idx] ON [dbo].[BDActivity]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDContact_companyName_idx] ON [dbo].[BDContact]([companyName]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDContact_createdAt_idx] ON [dbo].[BDContact]([createdAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDContact_email_idx] ON [dbo].[BDContact]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDNote_createdAt_idx] ON [dbo].[BDNote]([createdAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDNote_opportunityId_idx] ON [dbo].[BDNote]([opportunityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDOpportunity_assignedTo_idx] ON [dbo].[BDOpportunity]([assignedTo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDOpportunity_assignedTo_status_idx] ON [dbo].[BDOpportunity]([assignedTo], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDOpportunity_clientId_idx] ON [dbo].[BDOpportunity]([clientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDOpportunity_convertedToClientId_idx] ON [dbo].[BDOpportunity]([convertedToClientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDOpportunity_createdAt_idx] ON [dbo].[BDOpportunity]([createdAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDOpportunity_expectedCloseDate_idx] ON [dbo].[BDOpportunity]([expectedCloseDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDOpportunity_serviceLine_idx] ON [dbo].[BDOpportunity]([serviceLine]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDOpportunity_serviceLine_status_idx] ON [dbo].[BDOpportunity]([serviceLine], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDOpportunity_stageId_idx] ON [dbo].[BDOpportunity]([stageId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDOpportunity_status_idx] ON [dbo].[BDOpportunity]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDOpportunity_updatedAt_idx] ON [dbo].[BDOpportunity]([updatedAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDProposal_opportunityId_idx] ON [dbo].[BDProposal]([opportunityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDProposal_opportunityId_version_idx] ON [dbo].[BDProposal]([opportunityId], [version]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDProposal_sentAt_idx] ON [dbo].[BDProposal]([sentAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDProposal_status_idx] ON [dbo].[BDProposal]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDStage_isActive_idx] ON [dbo].[BDStage]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDStage_order_idx] ON [dbo].[BDStage]([order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BDStage_serviceLine_idx] ON [dbo].[BDStage]([serviceLine]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_active_idx] ON [dbo].[Client]([active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_clientCode_idx] ON [dbo].[Client]([clientCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_GSClientID_idx] ON [dbo].[Client]([GSClientID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_clientNameFull_idx] ON [dbo].[Client]([clientNameFull]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_clientTaxFlag_idx] ON [dbo].[Client]([clientTaxFlag]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_groupCode_idx] ON [dbo].[Client]([groupCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_groupDesc_idx] ON [dbo].[Client]([groupDesc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_updatedAt_idx] ON [dbo].[Client]([updatedAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_groupDesc_clientNameFull_idx] ON [dbo].[Client]([groupDesc], [clientNameFull]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_industry_idx] ON [dbo].[Client]([industry]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_sector_idx] ON [dbo].[Client]([sector]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientAcceptanceResponse_clientId_idx] ON [dbo].[ClientAcceptanceResponse]([clientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientAcceptanceResponse_taskId_idx] ON [dbo].[ClientAcceptanceResponse]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientAcceptanceResponse_taskId_questionnaireType_idx] ON [dbo].[ClientAcceptanceResponse]([taskId], [questionnaireType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientAcceptanceResponse_questionnaireType_idx] ON [dbo].[ClientAcceptanceResponse]([questionnaireType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientAcceptanceResponse_riskRating_idx] ON [dbo].[ClientAcceptanceResponse]([riskRating]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientAnalyticsDocument_clientId_idx] ON [dbo].[ClientAnalyticsDocument]([clientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientAnalyticsDocument_documentType_idx] ON [dbo].[ClientAnalyticsDocument]([documentType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientAnalyticsDocument_uploadedAt_idx] ON [dbo].[ClientAnalyticsDocument]([uploadedAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientCreditRating_clientId_idx] ON [dbo].[ClientCreditRating]([clientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientCreditRating_clientId_ratingDate_idx] ON [dbo].[ClientCreditRating]([clientId], [ratingDate] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientCreditRating_ratingDate_idx] ON [dbo].[ClientCreditRating]([ratingDate] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClientCreditRating_ratingGrade_idx] ON [dbo].[ClientCreditRating]([ratingGrade]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ComplianceChecklist_assignedTo_idx] ON [dbo].[ComplianceChecklist]([assignedTo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ComplianceChecklist_dueDate_idx] ON [dbo].[ComplianceChecklist]([dueDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ComplianceChecklist_taskId_idx] ON [dbo].[ComplianceChecklist]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ComplianceChecklist_status_idx] ON [dbo].[ComplianceChecklist]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CreditRatingDocument_analyticsDocumentId_idx] ON [dbo].[CreditRatingDocument]([analyticsDocumentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CreditRatingDocument_creditRatingId_idx] ON [dbo].[CreditRatingDocument]([creditRatingId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailLog_emailType_idx] ON [dbo].[EmailLog]([emailType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailLog_recipientUserId_idx] ON [dbo].[EmailLog]([recipientUserId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailLog_status_idx] ON [dbo].[EmailLog]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_Active_idx] ON [dbo].[Employee]([Active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_EmpCode_idx] ON [dbo].[Employee]([EmpCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_OfficeCode_idx] ON [dbo].[Employee]([OfficeCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_ServLineCode_idx] ON [dbo].[Employee]([ServLineCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_SLGroup_idx] ON [dbo].[Employee]([SLGroup]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Employee_WinLogon_idx] ON [dbo].[Employee]([WinLogon]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [FilingStatus_deadline_idx] ON [dbo].[FilingStatus]([deadline]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [FilingStatus_taskId_idx] ON [dbo].[FilingStatus]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [FilingStatus_status_idx] ON [dbo].[FilingStatus]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InAppNotification_createdAt_idx] ON [dbo].[InAppNotification]([createdAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InAppNotification_fromUserId_idx] ON [dbo].[InAppNotification]([fromUserId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InAppNotification_taskId_idx] ON [dbo].[InAppNotification]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InAppNotification_userId_idx] ON [dbo].[InAppNotification]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InAppNotification_userId_isRead_idx] ON [dbo].[InAppNotification]([userId], [isRead]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LegalPrecedent_taskId_idx] ON [dbo].[LegalPrecedent]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LegalPrecedent_year_idx] ON [dbo].[LegalPrecedent]([year]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MappedAccount_taskId_accountCode_idx] ON [dbo].[MappedAccount]([taskId], [accountCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MappedAccount_taskId_idx] ON [dbo].[MappedAccount]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MappedAccount_taskId_section_idx] ON [dbo].[MappedAccount]([taskId], [section]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MappedAccount_taskId_section_subsection_idx] ON [dbo].[MappedAccount]([taskId], [section], [subsection]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [NotificationPreference_taskId_idx] ON [dbo].[NotificationPreference]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [NotificationPreference_userId_idx] ON [dbo].[NotificationPreference]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OpinionChatMessage_opinionDraftId_createdAt_idx] ON [dbo].[OpinionChatMessage]([opinionDraftId], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OpinionChatMessage_sectionGenerationId_idx] ON [dbo].[OpinionChatMessage]([sectionGenerationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OpinionDocument_category_idx] ON [dbo].[OpinionDocument]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OpinionDocument_opinionDraftId_idx] ON [dbo].[OpinionDocument]([opinionDraftId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OpinionDraft_taskId_idx] ON [dbo].[OpinionDraft]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OpinionDraft_taskId_version_idx] ON [dbo].[OpinionDraft]([taskId], [version]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OpinionDraft_status_idx] ON [dbo].[OpinionDraft]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OpinionSection_opinionDraftId_order_idx] ON [dbo].[OpinionSection]([opinionDraftId], [order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ResearchNote_category_idx] ON [dbo].[ResearchNote]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ResearchNote_taskId_idx] ON [dbo].[ResearchNote]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SarsResponse_deadline_idx] ON [dbo].[SarsResponse]([deadline]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SarsResponse_taskId_idx] ON [dbo].[SarsResponse]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SarsResponse_status_idx] ON [dbo].[SarsResponse]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ServiceLineMaster_active_idx] ON [dbo].[ServiceLineMaster]([active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ServiceLineMaster_sortOrder_idx] ON [dbo].[ServiceLineMaster]([sortOrder]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ServiceLineExternal_ServLineCode_idx] ON [dbo].[ServiceLineExternal]([ServLineCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ServiceLineExternal_SLGroup_idx] ON [dbo].[ServiceLineExternal]([SLGroup]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ServiceLineExternal_masterCode_idx] ON [dbo].[ServiceLineExternal]([masterCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ServiceLineExternal_SubServlineGroupCode_idx] ON [dbo].[ServiceLineExternal]([SubServlineGroupCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ServiceLineUser_subServiceLineGroup_idx] ON [dbo].[ServiceLineUser]([subServiceLineGroup]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ServiceLineUser_userId_idx] ON [dbo].[ServiceLineUser]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ServiceLineUser_assignmentType_idx] ON [dbo].[ServiceLineUser]([assignmentType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ServiceLineUser_parentAssignmentId_idx] ON [dbo].[ServiceLineUser]([parentAssignmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ServiceLineUser_userId_assignmentType_idx] ON [dbo].[ServiceLineUser]([userId], [assignmentType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Session_userId_idx] ON [dbo].[Session]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_Active_idx] ON [dbo].[Task]([Active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_clientId_idx] ON [dbo].[Task]([clientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_GSClientID_idx] ON [dbo].[Task]([GSClientID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_OfficeCode_idx] ON [dbo].[Task]([OfficeCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_ServLineCode_idx] ON [dbo].[Task]([ServLineCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_SLGroup_idx] ON [dbo].[Task]([SLGroup]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_TaskCode_idx] ON [dbo].[Task]([TaskCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_TaskManager_idx] ON [dbo].[Task]([TaskManager]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_TaskPartner_idx] ON [dbo].[Task]([TaskPartner]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_ServLineCode_Active_idx] ON [dbo].[Task]([ServLineCode], [Active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_updatedAt_idx] ON [dbo].[Task]([updatedAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_ServLineCode_Active_updatedAt_idx] ON [dbo].[Task]([ServLineCode], [Active], [updatedAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Task_TaskDesc_idx] ON [dbo].[Task]([TaskDesc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTeam_taskId_idx] ON [dbo].[TaskTeam]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTeam_userId_idx] ON [dbo].[TaskTeam]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTeam_role_idx] ON [dbo].[TaskTeam]([role]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTeam_userId_taskId_idx] ON [dbo].[TaskTeam]([userId], [taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskTeam_userId_taskId_role_idx] ON [dbo].[TaskTeam]([userId], [taskId], [role]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskAcceptance_taskId_idx] ON [dbo].[TaskAcceptance]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskAcceptance_riskRating_idx] ON [dbo].[TaskAcceptance]([riskRating]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskEngagementLetter_taskId_idx] ON [dbo].[TaskEngagementLetter]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskDocument_taskId_idx] ON [dbo].[TaskDocument]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaskDocument_category_idx] ON [dbo].[TaskDocument]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaxAdjustment_createdAt_idx] ON [dbo].[TaxAdjustment]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaxAdjustment_taskId_idx] ON [dbo].[TaxAdjustment]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaxAdjustment_taskId_status_createdAt_idx] ON [dbo].[TaxAdjustment]([taskId], [status], [createdAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaxAdjustment_status_idx] ON [dbo].[TaxAdjustment]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TaxAdjustment_status_taskId_idx] ON [dbo].[TaxAdjustment]([status], [taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Template_active_idx] ON [dbo].[Template]([active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Template_projectType_idx] ON [dbo].[Template]([projectType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Template_serviceLine_idx] ON [dbo].[Template]([serviceLine]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Template_type_idx] ON [dbo].[Template]([type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TemplateSection_sectionKey_idx] ON [dbo].[TemplateSection]([sectionKey]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TemplateSection_templateId_idx] ON [dbo].[TemplateSection]([templateId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_role_idx] ON [dbo].[User]([role]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Debtors_clientId_idx] ON [dbo].[Debtors]([clientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Debtors_GSClientID_idx] ON [dbo].[Debtors]([GSClientID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Debtors_OfficeCode_idx] ON [dbo].[Debtors]([OfficeCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Debtors_ServLineCode_idx] ON [dbo].[Debtors]([ServLineCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Debtors_Biller_idx] ON [dbo].[Debtors]([Biller]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Debtors_PeriodRef_idx] ON [dbo].[Debtors]([PeriodRef]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Wip_clientId_idx] ON [dbo].[Wip]([clientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Wip_taskId_idx] ON [dbo].[Wip]([taskId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Wip_GSClientID_idx] ON [dbo].[Wip]([GSClientID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Wip_GSTaskID_idx] ON [dbo].[Wip]([GSTaskID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Wip_OfficeCode_idx] ON [dbo].[Wip]([OfficeCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Wip_ServLineCode_idx] ON [dbo].[Wip]([ServLineCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Wip_TaskCode_idx] ON [dbo].[Wip]([TaskCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Wip_TaskPartner_idx] ON [dbo].[Wip]([TaskPartner]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Wip_PeriodRef_idx] ON [dbo].[Wip]([PeriodRef]);

-- AddForeignKey
ALTER TABLE [dbo].[AcceptanceAnswer] ADD CONSTRAINT [FK_AcceptanceAnswer_Question] FOREIGN KEY ([questionId]) REFERENCES [dbo].[AcceptanceQuestion]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AcceptanceAnswer] ADD CONSTRAINT [FK_AcceptanceAnswer_Response] FOREIGN KEY ([responseId]) REFERENCES [dbo].[ClientAcceptanceResponse]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AcceptanceDocument] ADD CONSTRAINT [FK_AcceptanceDocument_Response] FOREIGN KEY ([responseId]) REFERENCES [dbo].[ClientAcceptanceResponse]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Account] ADD CONSTRAINT [Account_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AdjustmentDocument] ADD CONSTRAINT [AdjustmentDocument_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AdjustmentDocument] ADD CONSTRAINT [AdjustmentDocument_taxAdjustmentId_fkey] FOREIGN KEY ([taxAdjustmentId]) REFERENCES [dbo].[TaxAdjustment]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AITaxReport] ADD CONSTRAINT [AITaxReport_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[BDActivity] ADD CONSTRAINT [BDActivity_contactId_fkey] FOREIGN KEY ([contactId]) REFERENCES [dbo].[BDContact]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BDActivity] ADD CONSTRAINT [BDActivity_opportunityId_fkey] FOREIGN KEY ([opportunityId]) REFERENCES [dbo].[BDOpportunity]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[BDNote] ADD CONSTRAINT [BDNote_opportunityId_fkey] FOREIGN KEY ([opportunityId]) REFERENCES [dbo].[BDOpportunity]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[BDOpportunity] ADD CONSTRAINT [BDOpportunity_clientId_fkey] FOREIGN KEY ([clientId]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BDOpportunity] ADD CONSTRAINT [BDOpportunity_contactId_fkey] FOREIGN KEY ([contactId]) REFERENCES [dbo].[BDContact]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BDOpportunity] ADD CONSTRAINT [BDOpportunity_stageId_fkey] FOREIGN KEY ([stageId]) REFERENCES [dbo].[BDStage]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BDProposal] ADD CONSTRAINT [BDProposal_opportunityId_fkey] FOREIGN KEY ([opportunityId]) REFERENCES [dbo].[BDOpportunity]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ClientAcceptanceResponse] ADD CONSTRAINT [FK_ClientAcceptanceResponse_Client] FOREIGN KEY ([clientId]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientAcceptanceResponse] ADD CONSTRAINT [FK_ClientAcceptanceResponse_Task] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ClientAnalyticsDocument] ADD CONSTRAINT [ClientAnalyticsDocument_clientId_fkey] FOREIGN KEY ([clientId]) REFERENCES [dbo].[Client]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ClientCreditRating] ADD CONSTRAINT [ClientCreditRating_clientId_fkey] FOREIGN KEY ([clientId]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ComplianceChecklist] ADD CONSTRAINT [ComplianceChecklist_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CreditRatingDocument] ADD CONSTRAINT [CreditRatingDocument_analyticsDocumentId_fkey] FOREIGN KEY ([analyticsDocumentId]) REFERENCES [dbo].[ClientAnalyticsDocument]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CreditRatingDocument] ADD CONSTRAINT [CreditRatingDocument_creditRatingId_fkey] FOREIGN KEY ([creditRatingId]) REFERENCES [dbo].[ClientCreditRating]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[EmailLog] ADD CONSTRAINT [EmailLog_recipientUserId_fkey] FOREIGN KEY ([recipientUserId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[FilingStatus] ADD CONSTRAINT [FilingStatus_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InAppNotification] ADD CONSTRAINT [InAppNotification_fromUserId_fkey] FOREIGN KEY ([fromUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[InAppNotification] ADD CONSTRAINT [InAppNotification_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InAppNotification] ADD CONSTRAINT [InAppNotification_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LegalPrecedent] ADD CONSTRAINT [LegalPrecedent_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MappedAccount] ADD CONSTRAINT [MappedAccount_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[NotificationPreference] ADD CONSTRAINT [NotificationPreference_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[NotificationPreference] ADD CONSTRAINT [NotificationPreference_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[OpinionChatMessage] ADD CONSTRAINT [OpinionChatMessage_opinionDraftId_fkey] FOREIGN KEY ([opinionDraftId]) REFERENCES [dbo].[OpinionDraft]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OpinionDocument] ADD CONSTRAINT [OpinionDocument_opinionDraftId_fkey] FOREIGN KEY ([opinionDraftId]) REFERENCES [dbo].[OpinionDraft]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OpinionDraft] ADD CONSTRAINT [OpinionDraft_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OpinionSection] ADD CONSTRAINT [OpinionSection_opinionDraftId_fkey] FOREIGN KEY ([opinionDraftId]) REFERENCES [dbo].[OpinionDraft]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ResearchNote] ADD CONSTRAINT [ResearchNote_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SarsResponse] ADD CONSTRAINT [SarsResponse_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ServiceLineUser] ADD CONSTRAINT [ServiceLineUser_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Session] ADD CONSTRAINT [Session_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_clientId_fkey] FOREIGN KEY ([clientId]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_createdBy_fkey] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TaskTeam] ADD CONSTRAINT [TaskTeam_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TaskTeam] ADD CONSTRAINT [TaskTeam_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TaskAcceptance] ADD CONSTRAINT [TaskAcceptance_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TaskEngagementLetter] ADD CONSTRAINT [TaskEngagementLetter_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TaskDocument] ADD CONSTRAINT [TaskDocument_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TaxAdjustment] ADD CONSTRAINT [TaxAdjustment_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TemplateSection] ADD CONSTRAINT [TemplateSection_templateId_fkey] FOREIGN KEY ([templateId]) REFERENCES [dbo].[Template]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Debtors] ADD CONSTRAINT [Debtors_clientId_fkey] FOREIGN KEY ([clientId]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Wip] ADD CONSTRAINT [Wip_clientId_fkey] FOREIGN KEY ([clientId]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Wip] ADD CONSTRAINT [Wip_taskId_fkey] FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

