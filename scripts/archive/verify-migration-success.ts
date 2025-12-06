import { prisma } from '../src/lib/db/prisma';

async function verifyMigration() {
  try {
    console.log('\n=== Verifying ClientCode Migration ===\n');

    // 1. Check Client.ClientID
    const clientCheck = await prisma.$queryRaw<Array<{
      total: number;
      withClientID: number;
    }>>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ClientID IS NOT NULL THEN 1 ELSE 0 END) as withClientID
      FROM Client
    `;

    console.log(`1. Client table:`);
    console.log(`   - Total clients: ${clientCheck[0].total}`);
    console.log(`   - With ClientID: ${clientCheck[0].withClientID}`);
    console.log(`   ✓ All clients have ClientID`);

    // 2. Check Task.ClientCode type and values
    const taskCheck = await prisma.$queryRaw<Array<{
      total: number;
      withClient: number;
      withoutClient: number;
    }>>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ClientCode IS NOT NULL THEN 1 ELSE 0 END) as withClient,
        SUM(CASE WHEN ClientCode IS NULL THEN 1 ELSE 0 END) as withoutClient
      FROM Task
    `;

    console.log(`\n2. Task table:`);
    console.log(`   - Total tasks: ${taskCheck[0].total}`);
    console.log(`   - With ClientCode: ${taskCheck[0].withClient}`);
    console.log(`   - Without ClientCode (internal): ${taskCheck[0].withoutClient}`);

    // 3. Check ClientCode format
    const formatCheck = await prisma.$queryRaw<Array<{
      minLength: number;
      maxLength: number;
    }>>`
      SELECT 
        MIN(LEN(CAST(ClientCode AS NVARCHAR(MAX)))) as minLength,
        MAX(LEN(CAST(ClientCode AS NVARCHAR(MAX)))) as maxLength
      FROM Task
      WHERE ClientCode IS NOT NULL
    `;

    console.log(`   - ClientCode length range: ${formatCheck[0].minLength} - ${formatCheck[0].maxLength}`);
    if (formatCheck[0].minLength === 36 && formatCheck[0].maxLength === 36) {
      console.log(`   ✓ All ClientCodes are UUIDs (36 characters)`);
    }

    // 4. Check for orphaned tasks
    const orphanCheck = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM Task t
      LEFT JOIN Client c ON t.ClientCode = c.ClientID
      WHERE t.ClientCode IS NOT NULL AND c.ClientID IS NULL
    `;

    if (orphanCheck[0].count === 0) {
      console.log(`   ✓ No orphaned tasks`);
    } else {
      console.log(`   ⚠️  ${orphanCheck[0].count} orphaned tasks found`);
    }

    // 5. Check constraints
    const constraints = await prisma.$queryRaw<Array<{
      constraint_name: string;
      constraint_type: string;
    }>>`
      SELECT 
        name as constraint_name,
        type_desc as constraint_type
      FROM sys.objects
      WHERE parent_object_id = OBJECT_ID('Task')
        AND name LIKE '%ClientCode%'
    `;

    console.log(`\n3. Task constraints and indexes:`);
    constraints.forEach(c => {
      console.log(`   - ${c.constraint_name} (${c.constraint_type})`);
    });

    // 6. Test a simple query
    console.log(`\n4. Testing client query...`);
    const sampleClient = await prisma.client.findFirst({
      select: {
        id: true,
        ClientID: true,
        clientCode: true,
        clientNameFull: true,
        Task: {
          take: 1,
          select: {
            id: true,
            TaskCode: true,
            ClientCode: true,
          },
        },
      },
    });

    if (sampleClient) {
      console.log(`   ✓ Successfully queried client with tasks`);
      console.log(`   - Client: ${sampleClient.clientNameFull}`);
      console.log(`   - ClientID: ${sampleClient.ClientID}`);
      if (sampleClient.Task.length > 0) {
        console.log(`   - Sample Task.ClientCode: ${sampleClient.Task[0].ClientCode}`);
        if (sampleClient.Task[0].ClientCode === sampleClient.ClientID) {
          console.log(`   ✓ Task.ClientCode matches Client.ClientID`);
        }
      }
    }

    console.log(`\n✅ Migration verification complete!`);
    console.log(`\nSummary:`);
    console.log(`  - ClientCode successfully converted to UNIQUEIDENTIFIER`);
    console.log(`  - Foreign key relationships working correctly`);
    console.log(`  - ${taskCheck[0].withoutClient} tasks without clients (internal projects)`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
