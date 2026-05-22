import { runNewsDraftPipeline } from '../jobs/news-draft-runner.js';

const konu = process.argv.slice(2).join(' ').trim() || undefined;
const result = await runNewsDraftPipeline(konu ? { konu } : undefined);
console.log(JSON.stringify(result));
