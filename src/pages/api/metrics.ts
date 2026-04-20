import type { APIRoute } from 'astro';
import { searchClubs, getAllCities, getAllBranches } from '../../lib/repositories/catalog';

export const prerender = false;

export const GET: APIRoute = async () => {
  const [clubs, cities, branches] = await Promise.all([
    searchClubs({}),
    getAllCities(),
    getAllBranches(),
  ]);
  const clubsWithPrograms = clubs.filter((club) => (club.programSayisi ?? 0) > 0).length;

  return new Response(
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      metrics: {
        activeClubCount: clubs.length,
        clubsWithPrograms,
        cityCoverageCount: cities.length,
        branchCount: branches.length,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

