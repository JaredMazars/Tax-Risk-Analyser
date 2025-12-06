import { prisma } from '../src/lib/db/prisma';

async function analyzeUnmigratedTasks() {
  try {
    console.log('\n=== Analyzing Unmigrated Tasks ===\n');

    // First, let's check if we can find the old ClientCode values
    // by checking if there are any backup columns or tables
    
    // Let's look at all Task columns to see if there's any backup
    const taskColumns = await prisma.$queryRaw<Array<{
      COLUMN_NAME: string;
      DATA_TYPE: string;
    }>>`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Task'
      ORDER BY ORDINAL_POSITION
    `;

    console.log('Task table columns:');
    taskColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // Since the old ClientCode column was dropped, we can't recover
    // the old values directly. Let's check what happened.

    // Check if ClientCode_new column still exists
    const newColumnExists = taskColumns.some(col => col.COLUMN_NAME === 'ClientCode_new');
    
    if (newColumnExists) {
      console.log('\n⚠️  WARNING: ClientCode_new column still exists!');
      
      // Check values in both columns
      const sample = await prisma.$queryRaw<Array<{
        id: number;
        ClientCode: string | null;
        ClientCode_new: string | null;
        TaskCode: string;
      }>>`
        SELECT TOP 5
          id,
          ClientCode,
          ClientCode_new,
          TaskCode
        FROM Task
        WHERE ClientCode IS NULL
      `;

      console.log('\nSample records with NULL ClientCode:');
      sample.forEach(row => {
        console.log(`  ID ${row.id}: ClientCode=${row.ClientCode}, ClientCode_new=${row.ClientCode_new}, TaskCode=${row.TaskCode}`);
      });
    } else {
      console.log('\nClientCode_new column does not exist (migration cleanup completed)');
      console.log('\nThe 78,110 tasks with NULL ClientCode likely had clientCode values that');
      console.log('did not match any Client.clientCode in the database at migration time.');
      console.log('\nWithout the original ClientCode values, we cannot recover these relationships.');
      console.log('\nOptions:');
      console.log('  1. Accept NULL ClientCode for internal/orphaned tasks');
      console.log('  2. Modify the unique constraint to exclude NULL values');
      console.log('  3. Delete orphaned tasks if they are truly invalid');
      console.log('  4. Restore from backup and re-run migration with better data quality checks');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeUnmigratedTasks();
