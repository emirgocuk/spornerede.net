import type PocketBase from 'pocketbase';

/** PB OR filtresi / sort bazen 400 verir; client-side filtre. */
export async function listGuideRecords(
  pb: PocketBase,
  opts?: { durumIn?: string[] },
): Promise<Array<Record<string, unknown>>> {
  const pageSize = 50;
  const out: Array<Record<string, unknown>> = [];
  let page = 1;
  while (true) {
    const batch = await pb.collection('rehber_yazilari').getList(page, pageSize);
    for (const row of batch.items as Array<Record<string, unknown>>) {
      if (!opts?.durumIn?.length) {
        out.push(row);
        continue;
      }
      const d = String(row.durum ?? '');
      if (opts.durumIn.includes(d)) out.push(row);
    }
    if (batch.items.length < pageSize) break;
    page += 1;
  }
  return out;
}
