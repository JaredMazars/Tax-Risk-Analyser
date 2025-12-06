/**
 * Script to check a user's access levels and task memberships
 * Usage: npx tsx scripts/check-user-access.ts <email>
 */

import { prisma } from '../../src/lib/db/prisma';

async function checkUserAccess(emailPattern: string) {
  console.log(`\n=== Checking Access for User: ${emailPattern} ===\n`);

  // 1. Find the user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: emailPattern } },
        { email: { equals: emailPattern } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('👤 User Details:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   System Role: ${user.role}`);
  console.log(`   User ID: ${user.id}`);
  console.log();

  // 2. Check service line access
  console.log('📋 Service Line Access:');
  const serviceLines = await prisma.serviceLineUser.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      serviceLine: true,
      role: true,
    },
    orderBy: { serviceLine: 'asc' },
  });

  if (serviceLines.length === 0) {
    console.log('   ❌ No service line access');
  } else {
    serviceLines.forEach(sl => {
      console.log(`   ✓ ${sl.serviceLine}: ${sl.role} (ID: ${sl.id})`);
    });
  }
  console.log();

  // 3. Check task memberships
  console.log('📁 Task Memberships:');
  const taskMemberships = await prisma.taskTeam.findMany({
    where: { userId: user.id },
    include: {
      Task: {
        select: {
          id: true,
          TaskDesc: true,
          ServLineCode: true,
        },
      },
    },
    orderBy: {
      Task: {
        ServLineCode: 'asc',
      },
    },
  });

  if (taskMemberships.length === 0) {
    console.log('   ❌ Not a member of any tasks');
  } else {
    taskMemberships.forEach(tm => {
      console.log(`   ✓ Task ${tm.Task.id}: ${tm.Task.TaskDesc}`);
      console.log(`     Service Line: ${tm.Task.ServLineCode}`);
      console.log(`     Role: ${tm.role}`);
      console.log(`     TaskTeam ID: ${tm.id}`);
      console.log();
    });
  }
  console.log();

  // 4. Show TAX tasks they can/cannot access
  console.log('🔍 TAX Tasks Analysis:');
  const taxTasks = await prisma.task.findMany({
    where: { ServLineCode: 'TAX' },
    select: {
      id: true,
      TaskDesc: true,
      createdBy: true,
      TaskTeam: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const taxServiceLine = serviceLines.find(sl => sl.serviceLine === 'TAX');
  const isTaxAdmin = taxServiceLine?.role === 'PARTNER' || taxServiceLine?.role === 'MANAGER';
  const isSystemAdmin = user.role === 'SYSTEM_ADMIN';

  console.log(`   Tax Service Line Role: ${taxServiceLine?.role || 'NONE'}`);
  console.log(`   Is Tax Admin/Partner: ${isTaxAdmin ? 'YES' : 'NO'}`);
  console.log(`   Is System Admin: ${isSystemAdmin ? 'YES' : 'NO'}`);
  console.log();

  taxTasks.forEach(task => {
    const isTeamMember = task.TaskTeam.some(tt => tt.userId === user.id);
    const canAccess = isSystemAdmin || isTaxAdmin || isTeamMember;
    const userTaskRole = task.TaskTeam.find(tt => tt.userId === user.id)?.role;

    const status = canAccess ? '✅ CAN ACCESS' : '❌ CANNOT ACCESS';
    const reason = isSystemAdmin
      ? '(System Admin)'
      : isTaxAdmin
      ? '(Tax Admin/Partner)'
      : isTeamMember
      ? `(Team Member: ${userTaskRole})`
      : '(Not a team member)';

    console.log(`   ${status} - Task ${task.id}: ${task.TaskDesc}`);
    console.log(`     Reason: ${reason}`);
    console.log(`     Team Members: ${task.TaskTeam.length}`);
    console.log();
  });
}

async function main() {
  const email = process.argv[2] || 'walter.taxadmin';

  try {
    await checkUserAccess(email);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


