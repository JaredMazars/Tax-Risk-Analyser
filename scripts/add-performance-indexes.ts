/**
 * Script to add performance indexes to Task and TaskTeam tables
 * Run with: bun run scripts/add-performance-indexes.ts
 */

import { prisma } from '@/lib/db/prisma';

async function addPerformanceIndexes() {
  console.log('Adding performance indexes...');
  
  try {
    // Add composite index for Task table - ServLineCode + Active
    console.log('Creating Task_ServLineCode_Active_idx...');
    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'Task_ServLineCode_Active_idx' AND object_id = OBJECT_ID('dbo.Task'))
      BEGIN
        CREATE INDEX [Task_ServLineCode_Active_idx] ON [dbo].[Task]([ServLineCode], [Active]);
      END
    `);
    console.log('✓ Task_ServLineCode_Active_idx created');
    
    // Add index for Task table - updatedAt DESC
    console.log('Creating Task_updatedAt_idx...');
    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'Task_updatedAt_idx' AND object_id = OBJECT_ID('dbo.Task'))
      BEGIN
        CREATE INDEX [Task_updatedAt_idx] ON [dbo].[Task]([updatedAt] DESC);
      END
    `);
    console.log('✓ Task_updatedAt_idx created');
    
    // Add composite index for TaskTeam table - userId + taskId
    console.log('Creating TaskTeam_userId_taskId_idx...');
    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'TaskTeam_userId_taskId_idx' AND object_id = OBJECT_ID('dbo.TaskTeam'))
      BEGIN
        CREATE INDEX [TaskTeam_userId_taskId_idx] ON [dbo].[TaskTeam]([userId], [taskId]);
      END
    `);
    console.log('✓ TaskTeam_userId_taskId_idx created');
    
    console.log('\n✅ All performance indexes added successfully!');
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addPerformanceIndexes();
