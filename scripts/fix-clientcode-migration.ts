/**
 * Fix ClientCode migration - properly convert Task.ClientCode and WipLTD.ClientCode
 * from NVARCHAR(10) clientCode to UNIQUEIDENTIFIER ClientID
 */

import { prisma } from '../src/lib/db/prisma';

async function fixClientCodeMigration() {
  console.log('\n=== Fixing ClientCode Migration ===\n');

  try {
    // Step 1: Ensure all clients have ClientID
    console.log('Step 1: Verifying all clients have ClientID...');
    const clientsWithoutID = await prisma.$queryRaw<Array<{ id: number; clientCode: string }>>`
      SELECT id, clientCode 
      FROM Client 
      WHERE ClientID IS NULL
    `;

    if (clientsWithoutID.length > 0) {
      console.log(`⚠️  Found ${clientsWithoutID.length} clients without ClientID. Generating...`);
      for (const client of clientsWithoutID) {
        await prisma.$executeRaw`
          UPDATE Client 
          SET ClientID = NEWID() 
          WHERE id = ${client.id}
        `;
      }
      console.log(`✓ Generated ClientIDs`);
    } else {
      console.log('✓ All clients have ClientID');
    }

    // Step 2: Add new columns for Task and WipLTD
    console.log('\nStep 2: Adding new UNIQUEIDENTIFIER columns...');
    
    const taskColumnExists = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Task' AND COLUMN_NAME = 'ClientCode_new'
    `;

    if (taskColumnExists[0].count === 0) {
      await prisma.$executeRaw`
        ALTER TABLE [dbo].[Task] ADD [ClientCode_new] UNIQUEIDENTIFIER NULL
      `;
      console.log('✓ Added Task.ClientCode_new column');
    } else {
      console.log('✓ Task.ClientCode_new already exists');
    }

    const wipColumnExists = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'WipLTD' AND COLUMN_NAME = 'ClientCode_new'
    `;

    if (wipColumnExists[0].count === 0) {
      await prisma.$executeRaw`
        ALTER TABLE [dbo].[WipLTD] ADD [ClientCode_new] UNIQUEIDENTIFIER NULL
      `;
      console.log('✓ Added WipLTD.ClientCode_new column');
    } else {
      console.log('✓ WipLTD.ClientCode_new already exists');
    }

    // Step 3: Populate new columns with ClientID values
    console.log('\nStep 3: Populating new columns with ClientID values...');
    
    const taskUpdateCount = await prisma.$executeRaw`
      UPDATE t
      SET t.ClientCode_new = c.ClientID
      FROM [dbo].[Task] t
      INNER JOIN [dbo].[Client] c ON t.ClientCode = c.clientCode
      WHERE t.ClientCode_new IS NULL
    `;
    console.log(`✓ Updated ${taskUpdateCount} Task records`);

    const wipUpdateCount = await prisma.$executeRaw`
      UPDATE w
      SET w.ClientCode_new = c.ClientID
      FROM [dbo].[WipLTD] w
      INNER JOIN [dbo].[Client] c ON w.ClientCode = c.clientCode
      WHERE w.ClientCode_new IS NULL
    `;
    console.log(`✓ Updated ${wipUpdateCount} WipLTD records`);

    // Step 4: Drop existing constraints and indexes
    console.log('\nStep 4: Dropping old constraints and indexes...');
    
    // Drop Task foreign key
    await prisma.$executeRaw`
      IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'Task_ClientCode_fkey' AND parent_object_id = OBJECT_ID('Task'))
      BEGIN
        ALTER TABLE [dbo].[Task] DROP CONSTRAINT [Task_ClientCode_fkey]
      END
    `;
    console.log('✓ Dropped Task_ClientCode_fkey');

    // Drop Task unique constraint
    await prisma.$executeRaw`
      IF EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'Task_ClientCode_TaskCode_key' AND parent_object_id = OBJECT_ID('Task'))
      BEGIN
        ALTER TABLE [dbo].[Task] DROP CONSTRAINT [Task_ClientCode_TaskCode_key]
      END
    `;
    console.log('✓ Dropped Task_ClientCode_TaskCode_key');

    // Drop Task index
    await prisma.$executeRaw`
      IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Task') AND name = 'Task_ClientCode_idx')
      BEGIN
        DROP INDEX [Task_ClientCode_idx] ON [dbo].[Task]
      END
    `;
    console.log('✓ Dropped Task_ClientCode_idx');

    // Drop WipLTD index
    await prisma.$executeRaw`
      IF EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('WipLTD') AND name = 'WipLTD_ClientCode_idx')
      BEGIN
        DROP INDEX [WipLTD_ClientCode_idx] ON [dbo].[WipLTD]
      END
    `;
    console.log('✓ Dropped WipLTD_ClientCode_idx');

    // Step 5: Drop old ClientCode columns
    console.log('\nStep 5: Dropping old ClientCode columns...');
    
    await prisma.$executeRaw`
      ALTER TABLE [dbo].[Task] DROP COLUMN [ClientCode]
    `;
    console.log('✓ Dropped Task.ClientCode');

    await prisma.$executeRaw`
      ALTER TABLE [dbo].[WipLTD] DROP COLUMN [ClientCode]
    `;
    console.log('✓ Dropped WipLTD.ClientCode');

    // Step 6: Rename new columns to ClientCode
    console.log('\nStep 6: Renaming new columns...');
    
    await prisma.$executeRaw`
      EXEC sp_rename 'dbo.Task.ClientCode_new', 'ClientCode', 'COLUMN'
    `;
    console.log('✓ Renamed Task.ClientCode_new to ClientCode');

    await prisma.$executeRaw`
      EXEC sp_rename 'dbo.WipLTD.ClientCode_new', 'ClientCode', 'COLUMN'
    `;
    console.log('✓ Renamed WipLTD.ClientCode_new to ClientCode');

    // Step 7: Create new foreign key and constraints
    console.log('\nStep 7: Creating new constraints and indexes...');
    
    await prisma.$executeRaw`
      ALTER TABLE [dbo].[Task] 
      ADD CONSTRAINT [Task_ClientCode_fkey] 
      FOREIGN KEY ([ClientCode]) REFERENCES [dbo].[Client]([ClientID]) 
      ON UPDATE NO ACTION ON DELETE NO ACTION
    `;
    console.log('✓ Created Task_ClientCode_fkey');

    await prisma.$executeRaw`
      ALTER TABLE [dbo].[Task] 
      ADD CONSTRAINT [Task_ClientCode_TaskCode_key] UNIQUE ([ClientCode], [TaskCode])
    `;
    console.log('✓ Created Task_ClientCode_TaskCode_key');

    await prisma.$executeRaw`
      CREATE INDEX [Task_ClientCode_idx] ON [dbo].[Task]([ClientCode])
    `;
    console.log('✓ Created Task_ClientCode_idx');

    await prisma.$executeRaw`
      CREATE INDEX [WipLTD_ClientCode_idx] ON [dbo].[WipLTD]([ClientCode])
    `;
    console.log('✓ Created WipLTD_ClientCode_idx');

    // Step 8: Verify migration
    console.log('\nStep 8: Verifying migration...');
    
    const taskColumnInfo = await prisma.$queryRaw<Array<{
      DATA_TYPE: string;
    }>>`
      SELECT DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Task' AND COLUMN_NAME = 'ClientCode'
    `;

    if (taskColumnInfo[0]?.DATA_TYPE === 'uniqueidentifier') {
      console.log('✓ Task.ClientCode is now UNIQUEIDENTIFIER');
    } else {
      console.log(`⚠️  Task.ClientCode type is: ${taskColumnInfo[0]?.DATA_TYPE}`);
    }

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

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixClientCodeMigration()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
