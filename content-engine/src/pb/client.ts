import PocketBase from 'pocketbase';
import { cfg, requirePocketBaseAdmin } from '../config.js';

let cached: PocketBase | null = null;

export async function getAdminPb(): Promise<PocketBase> {
  if (cached) return cached;
  requirePocketBaseAdmin();
  const pb = new PocketBase(cfg.pocketbaseUrl);
  await pb.collection('_superusers').authWithPassword(
    cfg.pocketbaseAdminEmail,
    cfg.pocketbaseAdminPassword,
  );
  cached = pb;
  return pb;
}
