import { runDraftPipeline } from '../jobs/draft-runner.js';

const result = await runDraftPipeline();
console.log(JSON.stringify(result));
