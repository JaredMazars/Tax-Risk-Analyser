/**
 * Complete the ClientCode migration by adding the unique constraint 
 * on Client.ClientID and then creating the foreign keys
 */

import { prisma } from '../src/lib/db/prisma';

async function completeClientCodeMigration() {
  console.log('\n=== Completing ClientCode Migration ===\n');

  try {
    // Step 1: Create unique constraint on Client.ClientID
    console.log('Step 1: Creating unique constraint on Client.ClientID...');
    
    const clientIDIndexExists = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM sys.indexes
      WHERE object_id = OBJECT_ID('Client') 
        AND name = 'Client_ClientID_key'
    `;

    if (clientIDIndexExists[0].count === 0) {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX [Client_ClientID_key] ON [dbo].[Client]([ClientID])
      `;
      console.log('✓ Created unique index Client_ClientID_key');
    } else {
      console.log('✓ Client_ClientID_key already exists');
    }

    // Step 2: Create Task foreign key
    console.log('\nStep 2: Creating Task.ClientCode foreign key...');
    
    const taskFKExists = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM sys.foreign_keys
      WHERE name = 'Task_ClientCode_fkey' 
        AND parent_object_id = OBJECT_ID('Task')
    `;

    if (taskFKExists[0].count === 0) {
      await prisma.$executeRaw`
        ALTER TABLE [dbo].[Task] 
        ADD CONSTRAINT [Task_ClientCode_fkey] 
        FOREIGN KEY ([ClientCode]) REFERENCES [dbo].[Client]([ClientID]) 
        ON UPDATE NO ACTION ON DELETE NO ACTION
      `;
      console.log('✓ Created Task_ClientCode_fkey');
    } else {
      console.log('✓ Task_ClientCode_fkey already exists');
    }

    // Step 3: Create Task unique constraint (filtered to exclude NULL)
    console.log('\nStep 3: Creating Task unique index...');
    
    const taskUniqueExists = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM sys.indexes
      WHERE object_id = OBJECT_ID('Task') 
        AND name = 'Task_ClientCode_TaskCode_key'
    `;

    if (taskUniqueExists[0].count === 0) {
      // Create a filtered unique index that excludes NULL ClientCode
      // This allows tasks without clients to have duplicate TaskCodes
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX [Task_ClientCode_TaskCode_key] 
        ON [dbo].[Task]([ClientCode], [TaskCode])
        WHERE [ClientCode] IS NOT NULL
      `;
      console.log('✓ Created Task_ClientCode_TaskCode_key (filtered index)');
    } else {
      console.log('✓ Task_ClientCode_TaskCode_key already exists');
    }

    // Step 4: Create Task index
    console.log('\nStep 4: Creating Task.ClientCode index...');
    
    const taskIndexExists = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM sys.indexes
      WHERE object_id = OBJECT_ID('Task') 
        AND name = 'Task_ClientCode_idx'
    `;

    if (taskIndexExists[0].count === 0) {
      await prisma.$executeRaw`
        CREATE INDEX [Task_ClientCode_idx] ON [dbo].[Task]([ClientCode])
      `;
      console.log('✓ Created Task_ClientCode_idx');
    } else {
      console.log('✓ Task_ClientCode_idx already exists');
    }

    // Step 5: Create WipLTD index
    console.log('\nStep 5: Creating WipLTD.ClientCode index...');
    
    const wipIndexExists = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM sys.indexes
      WHERE object_id = OBJECT_ID('WipLTD') 
        AND name = 'WipLTD_ClientCode_idx'
    `;

    if (wipIndexExists[0].count === 0) {
      await prisma.$executeRaw`
        CREATE INDEX [WipLTD_ClientCode_idx] ON [dbo].[WipLTD]([ClientCode])
      `;
      console.log('✓ Created WipLTD_ClientCode_idx');
    } else {
      console.log('✓ WipLTD_ClientCode_idx already exists');
    }

    // Step 6: Verify the migration
    console.log('\nStep 6: Verifying migration...');
    
    // Check Task.ClientCode type
    const taskColumnInfo = await prisma.$queryRaw<Array<{
      DATA_TYPE: string;
    }>>`
      SELECT DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Task' AND COLUMN_NAME = 'ClientCode'
    `;

    if (taskColumnInfo[0]?.DATA_TYPE === 'uniqueidentifier') {
      console.log('✓ Task.ClientCode is UNIQUEIDENTIFIER');
    } else {
      console.log(`⚠️  Task.ClientCode type is: ${taskColumnInfo[0]?.DATA_TYPE}`);
    }

    // Check for orphaned tasks
    const orphanedTasks = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM Task t
      LEFT JOIN Client c ON t.ClientCode = c.ClientID
      WHERE t.ClientCode IS NOT NULL AND c.ClientID IS NULL
    `;

    if (orphanedTasks[0].count > 0) {
      console.log(`⚠️  Found ${orphanedTasks[0].count} orphaned tasks`);
    } else {
      console.log('✓ No orphaned tasks');
    }

    // Check sample data
    const sampleTasks = await prisma.$queryRaw<Array<{
      TaskID: number;
      ClientCode: string;
      ClientCodeLength: number;
    }>>`
      SELECT TOP 3
        id as TaskID,
        ClientCode,
        LEN(CAST(ClientCode AS NVARCHAR(MAX))) as ClientCodeLength
      FROM Task
      WHERE ClientCode IS NOT NULL
    `;

    console.log('\nSample Task data:');
    sampleTasks.forEach((task, i) => {
      console.log(`  ${i + 1}. Task ${task.TaskID}: ClientCode length = ${task.ClientCodeLength}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Regenerate Prisma client: npx prisma generate');
    console.log('  2. Restart your dev server');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

completeClientCodeMigration()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
