import { cfg } from '../config.js';
import { runDraftPipeline } from './draft-runner.js';

async function main() {
  const result = await runDraftPipeline();
  if (!result.ok) {
    if (result.code === 'rate_limit' && cfg.draftFailSoft) {
      console.error(`\n[llm] ${result.message}\n`);
      return;
    }
    console.error(result.message);
    process.exit(result.code === 'daily_limit' ? 0 : 1);
  }
  console.log('Taslak olusturuldu:', result.id, result.slug, `(${result.modelUsed})`);
  console.log(`Onay: npm run publish:draft -- ${result.slug}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
