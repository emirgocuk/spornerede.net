import { eq } from 'drizzle-orm';
import { getDb, hasDatabaseUrl } from '../src/db/client';
import { assignUserToClub, findUserByEmail } from '../src/lib/repositories/auth';
import { kulupler } from '../src/db/schema';
import { slugify } from '../src/data/mockData';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const clubSlugInput = process.argv[3]?.trim();
  const role = (process.argv[4] as 'owner' | 'staff' | undefined) ?? 'owner';

  if (!email || !clubSlugInput) {
    console.error('Kullanim: npm run user:assign-club -- <email> <club-slug|club-name> [owner|staff]');
    process.exit(1);
  }
  if (!hasDatabaseUrl()) {
    console.error('DATABASE_URL tanimli degil.');
    process.exit(1);
  }

  const user = await findUserByEmail(email);
  if (!user) {
    console.error('Kullanici bulunamadi:', email);
    process.exit(1);
  }

  const db = getDb();
  const clubSlug = slugify(clubSlugInput);
  const [club] = await db
    .select({ id: kulupler.id, ad: kulupler.ad, slug: kulupler.slug })
    .from(kulupler)
    .where(eq(kulupler.slug, clubSlug))
    .limit(1);

  if (!club) {
    console.error('Kulup bulunamadi:', clubSlug);
    process.exit(1);
  }

  const assignment = await assignUserToClub(user.id, club.id, role);
  if (!assignment) {
    console.log('Atama zaten mevcut olabilir. Kullanici:', user.email, 'Kulup:', club.slug);
    process.exit(0);
  }

  console.log('Kulup atamasi tamam:', {
    user: user.email,
    club: club.slug,
    role: assignment.rol,
  });
}

main().catch((error) => {
  console.error('Atama hatasi:', error);
  process.exit(1);
});
