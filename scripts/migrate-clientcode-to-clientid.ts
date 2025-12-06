/**
 * Migration script to update Task.ClientCode and WipLTD.ClientCode
 * from clientCode (NVARCHAR(10)) to ClientID (UNIQUEIDENTIFIER)
 * 
 * This script updates existing Task and WipLTD records to use ClientID
 * instead of clientCode for the foreign key relationship.
 * 
 * Usage: npx tsx scripts/migrate-clientcode-to-clientid.ts
 */

import { prisma } from '../src/lib/db/prisma';

async function migrateClientCodeToClientID() {
  console.log('\n=== Migrating ClientCode to ClientID ===\n');

  try {
    // Step 1: Verify all clients have ClientID
    console.log('Step 1: Verifying all clients have ClientID...');
    const clientsWithoutID = await prisma.$queryRaw<Array<{ id: number; clientCode: string }>>`
      SELECT id, clientCode 
      FROM Client 
      WHERE ClientID IS NULL
    `;

    if (clientsWithoutID.length > 0) {
      console.log(`⚠️  Found ${clientsWithoutID.length} clients without ClientID. Generating ClientIDs...`);
      for (const client of clientsWithoutID) {
        await prisma.$executeRaw`
          UPDATE Client 
          SET ClientID = NEWID() 
          WHERE id = ${client.id}
        `;
        console.log(`  ✓ Generated ClientID for client ${client.clientCode} (id: ${client.id})`);
      }
    } else {
      console.log('✓ All clients have ClientID');
    }

    // Step 2: Get mapping of clientCode to ClientID
    console.log('\nStep 2: Building clientCode to ClientID mapping...');
    const clientMapping = await prisma.$queryRaw<Array<{ clientCode: string; ClientID: string }>>`
      SELECT clientCode, ClientID 
      FROM Client 
      WHERE clientCode IS NOT NULL AND ClientID IS NOT NULL
    `;

    const codeToIDMap = new Map<string, string>();
    for (const client of clientMapping) {
      codeToIDMap.set(client.clientCode, client.ClientID);
    }
    console.log(`✓ Mapped ${codeToIDMap.size} clients`);

    // Step 3: Update Task.ClientCode to use ClientID
    console.log('\nStep 3: Updating Task.ClientCode to ClientID...');
    let updatedTasks = 0;
    let skippedTasks = 0;

    for (const [clientCode, clientID] of codeToIDMap.entries()) {
      const result = await prisma.$executeRaw`
        UPDATE Task 
        SET ClientCode = ${clientID}
        WHERE ClientCode = ${clientCode}
      `;
      const count = Array.isArray(result) ? result.length : Number(result);
      updatedTasks += count;
      if (count > 0) {
        console.log(`  ✓ Updated ${count} tasks for client ${clientCode}`);
      }
    }

    // Check for tasks with invalid client codes
    const invalidTasks = await prisma.$queryRaw<Array<{ id: number; ClientCode: string }>>`
      SELECT id, ClientCode 
      FROM Task 
      WHERE ClientCode NOT IN (SELECT ClientID FROM Client WHERE ClientID IS NOT NULL)
        AND LEN(ClientCode) <= 10
    `;

    if (invalidTasks.length > 0) {
      console.log(`\n⚠️  Found ${invalidTasks.length} tasks with invalid client codes:`);
      for (const task of invalidTasks) {
        console.log(`  - Task ID ${task.id} has ClientCode: ${task.ClientCode}`);
      }
      skippedTasks = invalidTasks.length;
    }

    console.log(`✓ Updated ${updatedTasks} tasks`);
    if (skippedTasks > 0) {
      console.log(`⚠️  Skipped ${skippedTasks} tasks with invalid client codes`);
    }

    // Step 4: Update WipLTD.ClientCode to use ClientID
    console.log('\nStep 4: Updating WipLTD.ClientCode to ClientID...');
    let updatedWipLTD = 0;
    let skippedWipLTD = 0;

    for (const [clientCode, clientID] of codeToIDMap.entries()) {
      const result = await prisma.$executeRaw`
        UPDATE WipLTD 
        SET ClientCode = ${clientID}
        WHERE ClientCode = ${clientCode}
      `;
      const count = Array.isArray(result) ? result.length : Number(result);
      updatedWipLTD += count;
      if (count > 0) {
        console.log(`  ✓ Updated ${count} WipLTD records for client ${clientCode}`);
      }
    }

    // Check for WipLTD with invalid client codes
    const invalidWipLTD = await prisma.$queryRaw<Array<{ id: number; ClientCode: string }>>`
      SELECT id, ClientCode 
      FROM WipLTD 
      WHERE ClientCode NOT IN (SELECT ClientID FROM Client WHERE ClientID IS NOT NULL)
        AND LEN(ClientCode) <= 10
    `;

    if (invalidWipLTD.length > 0) {
      console.log(`\n⚠️  Found ${invalidWipLTD.length} WipLTD records with invalid client codes:`);
      for (const wip of invalidWipLTD) {
        console.log(`  - WipLTD ID ${wip.id} has ClientCode: ${wip.ClientCode}`);
      }
      skippedWipLTD = invalidWipLTD.length;
    }

    console.log(`✓ Updated ${updatedWipLTD} WipLTD records`);
    if (skippedWipLTD > 0) {
      console.log(`⚠️  Skipped ${skippedWipLTD} WipLTD records with invalid client codes`);
    }

    // Step 5: Verify data integrity
    console.log('\nStep 5: Verifying data integrity...');
    
    const orphanedTasks = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM Task t
      LEFT JOIN Client c ON t.ClientCode = c.ClientID
      WHERE c.ClientID IS NULL
    `;

    const orphanedWipLTD = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM WipLTD w
      LEFT JOIN Client c ON w.ClientCode = c.ClientID
      WHERE c.ClientID IS NULL
    `;

    const orphanedTasksCount = orphanedTasks[0]?.count || 0;
    const orphanedWipLTDCount = orphanedWipLTD[0]?.count || 0;

    if (orphanedTasksCount > 0) {
      console.log(`⚠️  Found ${orphanedTasksCount} orphaned tasks (no matching Client)`);
    } else {
      console.log('✓ All tasks have valid Client relationships');
    }

    if (orphanedWipLTDCount > 0) {
      console.log(`⚠️  Found ${orphanedWipLTDCount} orphaned WipLTD records (no matching Client)`);
    } else {
      console.log('✓ All WipLTD records have valid Client relationships');
    }

    // Summary
    console.log('\n=== Migration Summary ===');
    console.log(`✓ Clients processed: ${codeToIDMap.size}`);
    console.log(`✓ Tasks updated: ${updatedTasks}`);
    console.log(`⚠️  Tasks skipped: ${skippedTasks}`);
    console.log(`✓ WipLTD records updated: ${updatedWipLTD}`);
    console.log(`⚠️  WipLTD records skipped: ${skippedWipLTD}`);
    console.log(`⚠️  Orphaned tasks: ${orphanedTasksCount}`);
    console.log(`⚠️  Orphaned WipLTD: ${orphanedWipLTDCount}`);

    if (orphanedTasksCount === 0 && orphanedWipLTDCount === 0 && skippedTasks === 0 && skippedWipLTD === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with warnings. Please review the output above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateClientCodeToClientID()
  .then(() => {
    console.log('\nMigration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
