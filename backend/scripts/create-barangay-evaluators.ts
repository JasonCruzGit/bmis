import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const barangays = [
  'Bagong Bayan',
  'Buena Suerte',
  'Barotuan',
  'Bebeladan',
  'Corong-corong',
  'Mabini',
  'Manlag',
  'Masagana',
  'New Ibajay',
  'Pasadeña',
  'Maligaya',
  'San Fernando',
  'Sibaltan',
  'Teneguiban',
  'Villa Libertad',
  'Villa Paz',
  'Bucana',
  'Aberawan',
];

async function createBarangayEvaluators() {
  try {
    const defaultPassword = process.env.EVALUATOR_PASSWORD || 'evaluator123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    console.log('🚀 Creating Barangay Evaluator accounts for El Nido...\n');

    const createdUsers = [];
    const skippedUsers = [];

    for (const barangay of barangays) {
      // Create email from barangay name
      const email = `evaluator.${barangay.toLowerCase().replace(/\s+/g, '.')}@elnido.gov.ph`;
      const firstName = barangay;
      const lastName = 'Evaluator';

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log(`⏭️  Skipping ${barangay} - User already exists (${email})`);
        skippedUsers.push({ barangay, email });
        continue;
      }

      // Create evaluator user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'BARANGAY_EVALUATOR',
          barangay,
          isActive: true,
        },
      });

      createdUsers.push({ barangay, email, id: user.id });
      console.log(`✅ Created evaluator for ${barangay}`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${defaultPassword}\n`);
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Created: ${createdUsers.length} evaluator accounts`);
    console.log(`⏭️  Skipped: ${skippedUsers.length} existing accounts`);

    if (createdUsers.length > 0) {
      console.log('\n📋 Created Accounts:');
      createdUsers.forEach(({ barangay, email }) => {
        console.log(`   - ${barangay}: ${email}`);
      });
    }

    if (skippedUsers.length > 0) {
      console.log('\n⏭️  Skipped Accounts (already exist):');
      skippedUsers.forEach(({ barangay, email }) => {
        console.log(`   - ${barangay}: ${email}`);
      });
    }

    console.log(`\n⚠️  Default password for all accounts: ${defaultPassword}`);
    console.log('⚠️  Please change passwords after first login!');
  } catch (error: any) {
    console.error('❌ Error creating barangay evaluators:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createBarangayEvaluators();



