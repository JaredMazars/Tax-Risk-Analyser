import { prisma } from '../src/lib/db/prisma';

async function checkClientID() {
  try {
    // Check if ClientID column exists and has unique constraint
    const columnInfo = await prisma.$queryRaw<Array<{
      COLUMN_NAME: string;
      DATA_TYPE: string;
      IS_NULLABLE: string;
    }>>`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Client' AND COLUMN_NAME = 'ClientID'
    `;

    console.log('Client.ClientID column:', columnInfo);

    // Check for unique constraint/index
    const uniqueConstraints = await prisma.$queryRaw<Array<{
      index_name: string;
      is_unique: boolean;
    }>>`
      SELECT 
        i.name as index_name,
        i.is_unique
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.object_id = OBJECT_ID('Client')
        AND c.name = 'ClientID'
    `;

    console.log('\nIndexes on Client.ClientID:', uniqueConstraints);

    // Check for duplicates
    const duplicates = await prisma.$queryRaw<Array<{
      ClientID: string;
      count: number;
    }>>`
      SELECT ClientID, COUNT(*) as count
      FROM Client
      WHERE ClientID IS NOT NULL
      GROUP BY ClientID
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
      console.log('\n⚠️  WARNING: Found duplicate ClientIDs:', duplicates);
    } else {
      console.log('\n✓ No duplicate ClientIDs');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientID();
