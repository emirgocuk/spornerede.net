import { createUser } from '../src/lib/repositories/auth';
import { hashPassword } from '../src/lib/auth/password';
import { hasDatabaseUrl } from '../src/db/client';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const password = process.argv[3] ?? '';
  const role = (process.argv[4] as 'admin' | 'club' | undefined) ?? 'club';

  if (!email || !password) {
    console.error('Kullanim: npm run user:create -- <email> <password> [admin|club]');
    process.exit(1);
  }

  if (!hasDatabaseUrl()) {
    console.error('DATABASE_URL tanimli degil.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash, role });
  console.log('Kullanici olusturuldu:', user);
}

main().catch((error) => {
  console.error('Kullanici olusturma hatasi:', error);
  process.exit(1);
});
