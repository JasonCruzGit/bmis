import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixColumns() {
  try {
    console.log('Checking database columns...');
    
    // Check password column
    const passwordResult = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'residents' 
      AND column_name = 'password'
    `;

    if (passwordResult.length === 0) {
      console.log('❌ Password column missing. Adding it...');
      await prisma.$executeRaw`ALTER TABLE "residents" ADD COLUMN "password" TEXT`;
      console.log('✅ Password column added');
    } else {
      console.log('✅ Password column exists');
    }

    // Check qr_code column
    const qrCodeResult = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'residents' 
      AND column_name = 'qr_code'
    `;

    if (qrCodeResult.length === 0) {
      console.log('❌ QR code column missing. Adding it...');
      await prisma.$executeRaw`ALTER TABLE "residents" ADD COLUMN "qr_code" TEXT`;
      console.log('✅ QR code column added');
      
      // Check if index exists
      const indexResult = await prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'residents' 
        AND indexname = 'residents_qr_code_key'
      `;

      if (indexResult.length === 0) {
        console.log('Creating QR code unique index...');
        await prisma.$executeRaw`CREATE UNIQUE INDEX "residents_qr_code_key" ON "residents"("qr_code")`;
        console.log('✅ QR code index created');
      }
    } else {
      console.log('✅ QR code column exists');
    }
    
    console.log('✅ All columns checked and fixed!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixColumns();






