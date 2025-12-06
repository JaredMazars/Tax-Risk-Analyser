import { prisma } from '../src/lib/db/prisma';

async function testAPIEndpoints() {
  try {
    console.log('\n=== Testing API Endpoints ===\n');

    // Test 1: Query clients (this was failing before)
    console.log('1. Testing Client query...');
    const clients = await prisma.client.findMany({
      take: 3,
      select: {
        id: true,
        ClientID: true,
        clientCode: true,
        clientNameFull: true,
        _count: {
          select: {
            Task: true,
          },
        },
      },
    });

    if (clients.length > 0) {
      console.log(`   ✓ Successfully queried ${clients.length} clients`);
      clients.forEach((client, i) => {
        console.log(`     ${i + 1}. ${client.clientNameFull} (${client._count.Task} tasks)`);
      });
    }

    // Test 2: Query tasks (this was failing before)
    console.log('\n2. Testing Task query with Client relation...');
    const tasks = await prisma.task.findMany({
      take: 3,
      where: {
        ClientCode: { not: null },
      },
      select: {
        id: true,
        TaskCode: true,
        TaskDesc: true,
        ClientCode: true,
        Client: {
          select: {
            id: true,
            ClientID: true,
            clientNameFull: true,
            clientCode: true,
          },
        },
      },
    });

    if (tasks.length > 0) {
      console.log(`   ✓ Successfully queried ${tasks.length} tasks with clients`);
      tasks.forEach((task, i) => {
        console.log(`     ${i + 1}. ${task.TaskCode}: ${task.TaskDesc}`);
        console.log(`        Client: ${task.Client?.clientNameFull || 'N/A'}`);
        console.log(`        ClientCode matches: ${task.ClientCode === task.Client?.ClientID ? 'Yes' : 'No'}`);
      });
    }

    // Test 3: Query internal tasks (without clients)
    console.log('\n3. Testing internal tasks (NULL ClientCode)...');
    const internalTasks = await prisma.task.findMany({
      take: 3,
      where: {
        ClientCode: null,
      },
      select: {
        id: true,
        TaskCode: true,
        TaskDesc: true,
        ClientCode: true,
      },
    });

    if (internalTasks.length > 0) {
      console.log(`   ✓ Successfully queried ${internalTasks.length} internal tasks`);
      internalTasks.forEach((task, i) => {
        console.log(`     ${i + 1}. ${task.TaskCode}: ${task.TaskDesc}`);
      });
    }

    // Test 4: Mixed query (with and without clients)
    console.log('\n4. Testing mixed query...');
    const mixedCount = await prisma.task.count();
    const withClientCount = await prisma.task.count({
      where: { ClientCode: { not: null } },
    });
    const withoutClientCount = await prisma.task.count({
      where: { ClientCode: null },
    });

    console.log(`   ✓ Total tasks: ${mixedCount}`);
    console.log(`     - With client: ${withClientCount}`);
    console.log(`     - Without client: ${withoutClientCount}`);
    console.log(`     - Match: ${mixedCount === (withClientCount + withoutClientCount) ? 'Yes' : 'No'}`);

    console.log('\n✅ All API endpoint tests passed!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIEndpoints();
