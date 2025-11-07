import { createAzure } from '@ai-sdk/azure';

/**
 * Initialize Azure OpenAI provider with API key
 * Resource: walte-mflcntql-swedencentral
 * Region: Sweden Central
 */
const azure = createAzure({
  resourceName: 'walte-mflcntql-swedencentral',
  apiKey: process.env.AZURE_OPENAI_API_KEY || '',
});

/**
 * Get deployment name from environment variable
 * Defaults to 'gpt-5-mini' if not specified
 */
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5-mini';

/**
 * Model configurations for different use cases
 * All models use the same deployment on Azure (configurable via AZURE_OPENAI_DEPLOYMENT)
 */
export const models = {
  // GPT-5 Mini - for most AI generation tasks
  mini: azure(deploymentName),
  
  // Using same deployment for nano tasks (document extraction)
  nano: azure(deploymentName),
} as const;

/**
 * Default model for general use
 */
export const defaultModel = models.mini;

/**
 * Export the provider for advanced use cases
 */
export { azure };

