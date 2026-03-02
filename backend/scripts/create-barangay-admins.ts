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

async function createBarangayAdmins() {
  try {
    const defaultPassword = process.env.BARANGAY_ADMIN_PASSWORD || 'barangay@admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    console.log('🚀 Creating Barangay Admin accounts for El Nido...\n');

    const createdUsers = [];
    const skippedUsers = [];
    const updatedUsers = [];

    for (const barangay of barangays) {
      // Create email from barangay name
      const email = `admin.${barangay.toLowerCase().replace(/\s+/g, '.').replace(/-/g, '')}@elnido.gov.ph`;
      const firstName = barangay;
      const lastName = 'Admin';

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Update existing user to ensure correct role and barangay
        if (existingUser.role !== 'BARANGAY_CHAIRMAN' || existingUser.barangay !== barangay) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              role: 'BARANGAY_CHAIRMAN',
              barangay: barangay,
              isActive: true,
              password: hashedPassword, // Reset password to default
            },
          });
          updatedUsers.push({ barangay, email, id: existingUser.id });
          console.log(`🔄 Updated ${barangay} admin account (${email})`);
          console.log(`   Role changed to: BARANGAY_CHAIRMAN\n`);
        } else {
          console.log(`⏭️  Skipping ${barangay} - User already exists with correct settings (${email})`);
          skippedUsers.push({ barangay, email });
        }
        continue;
      }

      // Create admin user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'BARANGAY_CHAIRMAN',
          barangay,
          isActive: true,
        },
      });

      createdUsers.push({ barangay, email, id: user.id });
      console.log(`✅ Created admin for ${barangay}`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${defaultPassword}\n`);
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Created: ${createdUsers.length} admin accounts`);
    console.log(`🔄 Updated: ${updatedUsers.length} existing accounts`);
    console.log(`⏭️  Skipped: ${skippedUsers.length} existing accounts`);

    if (createdUsers.length > 0) {
      console.log('\n📋 Created Accounts:');
      createdUsers.forEach(({ barangay, email }) => {
        console.log(`   - ${barangay}: ${email}`);
      });
    }

    if (updatedUsers.length > 0) {
      console.log('\n🔄 Updated Accounts:');
      updatedUsers.forEach(({ barangay, email }) => {
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
    console.log('\n📝 Note: These accounts can manage inventory for their respective barangays only.');
  } catch (error: any) {
    console.error('❌ Error creating barangay admins:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createBarangayAdmins();

