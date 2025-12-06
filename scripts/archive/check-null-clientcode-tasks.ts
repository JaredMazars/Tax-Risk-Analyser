import { prisma } from '../src/lib/db/prisma';

async function checkNullClientCodeTasks() {
  try {
    // Count tasks with NULL ClientCode
    const nullCount = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM Task
      WHERE ClientCode IS NULL
    `;

    console.log(`\nTasks with NULL ClientCode: ${nullCount[0].count}`);

    // Check for duplicate TaskCodes among NULL ClientCode tasks
    const duplicateTaskCodes = await prisma.$queryRaw<Array<{
      TaskCode: string;
      count: number;
    }>>`
      SELECT TaskCode, COUNT(*) as count
      FROM Task
      WHERE ClientCode IS NULL
      GROUP BY TaskCode
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    console.log(`\nDuplicate TaskCodes (NULL ClientCode): ${duplicateTaskCodes.length}`);
    if (duplicateTaskCodes.length > 0) {
      console.log('\nTop 10 duplicates:');
      duplicateTaskCodes.slice(0, 10).forEach((dup, i) => {
        console.log(`  ${i + 1}. TaskCode "${dup.TaskCode}": ${dup.count} tasks`);
      });
    }

    // Sample tasks with NULL ClientCode
    const sampleNullTasks = await prisma.$queryRaw<Array<{
      id: number;
      TaskCode: string;
      TaskDesc: string;
      Active: string;
    }>>`
      SELECT TOP 5
        id,
        TaskCode,
        TaskDesc,
        Active
      FROM Task
      WHERE ClientCode IS NULL
    `;

    console.log('\nSample tasks with NULL ClientCode:');
    sampleNullTasks.forEach((task, i) => {
      console.log(`  ${i + 1}. ID ${task.id}: ${task.TaskCode} - ${task.TaskDesc} (${task.Active})`);
    });

    // Check how many tasks were not migrated (ClientCode_new exists?)
    const unmigrated = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM Task
      WHERE ClientCode IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'Task' AND COLUMN_NAME = 'ClientCode_new'
        )
    `;

    // Check the original ClientCode values for these NULL tasks
    // (This would only work if we had a backup, which we don't)
    console.log('\nNote: These NULL values may be:');
    console.log('  1. Tasks that never had a client (internal projects)');
    console.log('  2. Tasks whose clientCode did not match any Client.clientCode during migration');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNullClientCodeTasks();
