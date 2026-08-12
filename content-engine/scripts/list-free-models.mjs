// Fetch and list active free chat models from OpenRouter
const res = await fetch('https://openrouter.ai/api/v1/models');
const { data } = await res.json();
const EXCLUDE = /embed|embedding|vision|vl|vector|safety|code|oss|bge|rerank/i;
const models = data
  .filter((m) => m.id.endsWith(':free') && !EXCLUDE.test(m.id))
  .sort((a, b) => (b.context_length || 0) - (a.context_length || 0));
console.log('=== Active free chat models ===');
models.forEach((m) => console.log(m.id, `  ctx=${m.context_length}`));
