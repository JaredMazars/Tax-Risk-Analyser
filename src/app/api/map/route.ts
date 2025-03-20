import { NextRequest, NextResponse } from 'next/server';
import { read, utils } from 'xlsx';
import OpenAI from 'openai';
import { mappingGuide } from '@/lib/mappingGuide';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const trialBalanceFile = formData.get('trialBalance') as File;

    if (!trialBalanceFile) {
      return NextResponse.json(
        { error: 'Trial Balance file is required.' },
        { status: 400 }
      );
    }

    // Parse Trial Balance
    const trialBalanceBuffer = await trialBalanceFile.arrayBuffer();
    const trialBalanceWorkbook = read(trialBalanceBuffer);
    const trialBalanceSheet = trialBalanceWorkbook.Sheets[trialBalanceWorkbook.SheetNames[0]];
    const trialBalanceData = utils.sheet_to_json(trialBalanceSheet);

    // Split trial balance data
    const incomeStatementData = trialBalanceData.filter(
      (row: any) => row['Section']?.toLowerCase() === 'income statement'
    );
    const balanceSheetData = trialBalanceData.filter(
      (row: any) => row['Section']?.toLowerCase() === 'balance sheet'
    );

    // Split mapping guide data
    const mappingGuideData = mappingGuide[0];
    const incomeStatementGuide = mappingGuideData.filter(
      item => item.rootName === 'Statement of comprehensive income'
    );
    const balanceSheetGuide = mappingGuideData.filter(
      item => item.rootName === 'Balance Sheet'
    );

    // Process Income Statement first
    const incomeStatementPrompt = generatePrompt(incomeStatementData, incomeStatementGuide, 'Income Statement');
    const incomeStatementCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an accounting assistant that maps trial balance accounts to an account structure. 
          You must return ONLY a valid JSON array with no additional text or explanation.
          Each object in the array must include: accountCode, account, section, balance (as number), subFSAName, and subFSAId.`
        },
        {
          role: "user",
          content: incomeStatementPrompt
        }
      ],
      model: "gpt-4o",
      temperature: 0.2, // Reduced temperature for more consistent output
    });

    const incomeStatementMapped = parseLLMResponse(incomeStatementCompletion.choices[0].message.content);

    // Process Balance Sheet
    const balanceSheetPrompt = generatePrompt(balanceSheetData, balanceSheetGuide, 'Balance Sheet');
    const balanceSheetCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an accounting assistant that maps trial balance accounts to an account structure. 
          You must return ONLY a valid JSON array with no additional text or explanation.
          Each object in the array must include: accountCode, account, section, balance (as number), subFSAName, and subFSAId.`
        },
        {
          role: "user",
          content: balanceSheetPrompt
        }
      ],
      model: "gpt-4o",
      temperature: 0.2,
    });

    const balanceSheetMapped = parseLLMResponse(balanceSheetCompletion.choices[0].message.content);

    // Combine results
    const combinedResults = [...incomeStatementMapped, ...balanceSheetMapped];
    return NextResponse.json(combinedResults);

  } catch (error) {
    console.error('Error processing files:', error);
    return NextResponse.json(
      { error: 'Error processing files: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

function generatePrompt(trialBalanceData: any[], mappingGuide: any[], section: string) {
  const trialBalanceStr = JSON.stringify(trialBalanceData, null, 2);
  const mappingGuideStr = JSON.stringify(mappingGuide, null, 2);

  return `Map the following ${section} trial balance accounts to their appropriate FSA categories.

Trial Balance Data:
${trialBalanceStr}

Mapping Guide:
${mappingGuideStr}

Rules:
1. Return ONLY a JSON array with no additional text
2. Each object must have: accountCode, account, section, balance (as number), subFSAName, and subFSAId
3. Match accounts to the most appropriate FSA category based on the account name
4. Keep original account details exactly as provided
5. Balance must be a number, not a string
6. The response must be a valid JSON array starting with '[' and ending with ']'

Example Response Format:
[
  {
    "accountCode": "1000",
    "account": "Cash at Bank",
    "section": "${section}",
    "balance": 50000.00,
    "subFSAName": "Cash and cash equivalents",
    "subFSAId": "BS1"
  }
]`;
}

function parseLLMResponse(llmResponse: string | null) {
  try {
    if (!llmResponse) throw new Error('Empty response from LLM');
    
    // Clean the response to find the JSON array
    const cleaned = llmResponse.trim();
    const startIndex = cleaned.indexOf('[');
    const endIndex = cleaned.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('Invalid response format. Full response:', llmResponse);
      throw new Error('No JSON array found in the LLM response');
    }

    const jsonString = cleaned.slice(startIndex, endIndex + 1);
    const parsed = JSON.parse(jsonString);
    
    // Validate the structure
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Validate each object in the array
    parsed.forEach((item, index) => {
      if (!item.accountCode || !item.account || !item.section || 
          typeof item.balance !== 'number' || !item.subFSAName || !item.subFSAId) {
        throw new Error(`Invalid object structure at index ${index}`);
      }
    });

    return parsed;
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    console.error('Raw response:', llmResponse);
    throw new Error('Failed to parse the mapping result: ' + (error as Error).message);
  }
} 