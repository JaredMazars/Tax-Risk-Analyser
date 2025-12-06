import { prisma } from '../src/lib/db/prisma';

async function checkClientCode() {
  try {
    console.log('Checking Task.ClientCode column status...\n');
    
    // Check Task.ClientCode column type and sample data
    const taskSample = await prisma.$queryRaw<Array<{
      id: number;
      ClientCode: string;
      TaskCode: string;
      ClientCodeLength: number;
      DataType: string;
    }>>`
      SELECT TOP 5 
        id, 
        ClientCode, 
        TaskCode,
        LEN(CAST(ClientCode AS NVARCHAR(MAX))) as ClientCodeLength,
        CASE 
          WHEN TRY_CAST(ClientCode AS UNIQUEIDENTIFIER) IS NOT NULL THEN 'GUID'
          ELSE 'String'
        END as DataType
      FROM Task 
      WHERE ClientCode IS NOT NULL
    `;
    
    console.log('Task ClientCode samples:');
    taskSample.forEach((task, i) => {
      console.log(`  ${i + 1}. Task ID ${task.id}: ClientCode="${task.ClientCode}" (Length: ${task.ClientCodeLength}, Type: ${task.DataType})`);
    });
    
    // Check for non-GUID values
    const invalidClientCodes = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM Task
      WHERE ClientCode IS NOT NULL
        AND LEN(CAST(ClientCode AS NVARCHAR(MAX))) <= 10
    `;
    
    const invalidCount = invalidClientCodes[0]?.count || 0;
    console.log(`\nTasks with old clientCode format (length <= 10): ${invalidCount}`);
    
    // Check column metadata
    const columnInfo = await prisma.$queryRaw<Array<{
      COLUMN_NAME: string;
      DATA_TYPE: string;
      CHARACTER_MAXIMUM_LENGTH: number | null;
    }>>`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Task' AND COLUMN_NAME = 'ClientCode'
    `;
    
    console.log('\nTask.ClientCode column schema:');
    columnInfo.forEach(col => {
      console.log(`  Column: ${col.COLUMN_NAME}`);
      console.log(`  Type: ${col.DATA_TYPE}`);
      console.log(`  Max Length: ${col.CHARACTER_MAXIMUM_LENGTH || 'N/A (fixed size)'}`);
    });

    if (invalidCount > 0) {
      console.log('\n⚠️  WARNING: Found tasks with old clientCode format. Data migration needed.');
    } else {
      console.log('\n✅ All tasks have valid ClientID format.');
    }
    
  } catch (error) {
    console.error('Error checking ClientCode status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientCode();
