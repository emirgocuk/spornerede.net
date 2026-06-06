import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** process.cwd() bagimsiz — preview/standalone icin */
export function getContentEngineRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '../../../content-engine');
}
