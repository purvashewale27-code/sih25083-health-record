import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

async function cleanupUserEmails() {
  console.log('Fetching users from Supabase...');
  const users = await prisma.user.findMany();
  console.log('Current users in DB:', users);

  for (const user of users) {
    let newEmail = user.email;

    if (user.name.includes('Ananya')) {
      newEmail = 'dr.ananya.sharma@kerala.health.gov.in';
    } else if (user.name.includes('Priya')) {
      newEmail = 'dr.priya.menon@kerala.health.gov.in';
    } else if (user.name.includes('Rajesh')) {
      newEmail = 'dr.rajesh@kerala.health.gov.in';
    }

    if (newEmail !== user.email) {
      console.log(`Updating ${user.name} (${user.id}): ${user.email} -> ${newEmail}`);
      // Check if email already exists
      const existing = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existing && existing.id !== user.id) {
        console.log(`Deleting duplicate user ${existing.id} with email ${newEmail}...`);
        await prisma.user.delete({ where: { id: existing.id } });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { email: newEmail },
      });
    }
  }

  const updatedUsers = await prisma.user.findMany();
  console.log('\nUpdated users list in Supabase PostgreSQL:');
  console.table(updatedUsers.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
}

cleanupUserEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error cleaning user emails:', err);
    process.exit(1);
  });
