import PocketBase from 'pocketbase';
import { cfg, requirePocketBaseAdmin } from '../config.js';

let cached: PocketBase | null = null;

export function resetAdminPb() {
  cached = null;
}

async function authAdmin(pb: PocketBase) {
  await pb.collection('_superusers').authWithPassword(
    cfg.pocketbaseAdminEmail,
    cfg.pocketbaseAdminPassword,
  );
}

export async function getAdminPb(): Promise<PocketBase> {
  if (cached) return cached;
  requirePocketBaseAdmin();
  const pb = new PocketBase(cfg.pocketbaseUrl);
  await authAdmin(pb);
  cached = pb;
  return pb;
}

/** Koleksiyon sil/yeniden olustur sonrasi — eski istemci 404 verebilir */
export async function createFreshAdminPb(): Promise<PocketBase> {
  resetAdminPb();
  return getAdminPb();
}
