import { prisma } from '../src/lib/db/prisma';

async function checkTaskColumns() {
  try {
    console.log('Checking Task table columns...\n');
    
    const columns = await prisma.$queryRaw<Array<{
      COLUMN_NAME: string;
      DATA_TYPE: string;
      CHARACTER_MAXIMUM_LENGTH: number | null;
      IS_NULLABLE: string;
    }>>`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Task' 
        AND COLUMN_NAME IN ('ClientCode', 'ClientCode_new')
      ORDER BY COLUMN_NAME
    `;
    
    console.log('Task table columns related to ClientCode:');
    if (columns.length === 0) {
      console.log('  (No ClientCode columns found!)');
    } else {
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }

    // Check for foreign key constraints
    const constraints = await prisma.$queryRaw<Array<{
      CONSTRAINT_NAME: string;
      CONSTRAINT_TYPE: string;
    }>>`
      SELECT 
        CONSTRAINT_NAME,
        CONSTRAINT_TYPE
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_NAME = 'Task' 
        AND CONSTRAINT_NAME LIKE '%ClientCode%'
    `;
    
    console.log('\nConstraints related to ClientCode:');
    if (constraints.length === 0) {
      console.log('  (No constraints found)');
    } else {
      constraints.forEach(c => {
        console.log(`  - ${c.CONSTRAINT_NAME} (${c.CONSTRAINT_TYPE})`);
      });
    }

    // Check indexes
    const indexes = await prisma.$queryRaw<Array<{
      index_name: string;
      column_name: string;
    }>>`
      SELECT 
        i.name as index_name,
        c.name as column_name
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.object_id = OBJECT_ID('Task')
        AND c.name LIKE '%ClientCode%'
    `;
    
    console.log('\nIndexes related to ClientCode:');
    if (indexes.length === 0) {
      console.log('  (No indexes found)');
    } else {
      indexes.forEach(idx => {
        console.log(`  - ${idx.index_name} on ${idx.column_name}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTaskColumns();
