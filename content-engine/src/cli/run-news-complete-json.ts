import { runCompleteNewsPipeline } from '../jobs/complete-news-runner.js';

const idArg = process.argv[2];
const legacyId = Number(idArg);
if (!Number.isFinite(legacyId) || legacyId <= 0) {
  console.log(JSON.stringify({ ok: false, code: 'bad_id', message: 'legacyId gerekli' }));
  process.exit(1);
}

const result = await runCompleteNewsPipeline(legacyId);
console.log(JSON.stringify(result));
process.exit(result.ok ? 0 : 1);
