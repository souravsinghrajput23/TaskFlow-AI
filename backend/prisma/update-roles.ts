import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetEmail = 'animiizzweeb@gmail.com';
  const defaultAdminEmail = 'admin@taskflow.com';

  console.log(`Searching for user: ${targetEmail}`);
  
  // 1. Promote Sourav Singh to ADMIN
  const user = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (user) {
    await prisma.user.update({
      where: { email: targetEmail },
      data: { role: Role.ADMIN },
    });
    console.log(`✔ Promoted ${user.name} (${targetEmail}) to ADMIN role.`);
  } else {
    console.log(`✖ User ${targetEmail} not found in database.`);
  }

  // 2. Remove default admin Sarah Jenkins
  const defaultAdmin = await prisma.user.findUnique({ where: { email: defaultAdminEmail } });
  if (defaultAdmin) {
    await prisma.user.delete({ where: { email: defaultAdminEmail } });
    console.log(`✔ Deleted default seed admin Sarah Jenkins (${defaultAdminEmail}).`);
  } else {
    console.log(`ℹ Default admin ${defaultAdminEmail} was already removed.`);
  }
}

main()
  .catch((e) => {
    console.error('Error executing database update script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
