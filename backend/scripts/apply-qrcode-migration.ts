import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyQRCodeMigration() {
  try {
    console.log('Applying QR code migration...');
    
    // Check if column already exists
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'residents' 
      AND column_name = 'qr_code'
    `;

    if (result.length > 0) {
      console.log('✅ QR code column already exists');
      
      // Check if index exists
      const indexResult = await prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'residents' 
        AND indexname = 'residents_qr_code_key'
      `;

      if (indexResult.length > 0) {
        console.log('✅ QR code index already exists');
      } else {
        console.log('Creating QR code unique index...');
        await prisma.$executeRaw`CREATE UNIQUE INDEX "residents_qr_code_key" ON "residents"("qr_code")`;
        console.log('✅ QR code index created');
      }
    } else {
      console.log('Adding QR code column...');
      await prisma.$executeRaw`ALTER TABLE "residents" ADD COLUMN "qr_code" TEXT`;
      console.log('✅ QR code column added');
      
      console.log('Creating QR code unique index...');
      await prisma.$executeRaw`CREATE UNIQUE INDEX "residents_qr_code_key" ON "residents"("qr_code")`;
      console.log('✅ QR code index created');
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyQRCodeMigration();



