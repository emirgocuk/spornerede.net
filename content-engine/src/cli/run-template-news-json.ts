import { buildNewsFromTemplate } from '../lib/build-template-news.js';

const konu = process.argv.slice(2).join(' ').trim();
if (!konu) {
  console.log(JSON.stringify({ ok: false, code: 'no_topic', message: 'Konu gerekli' }));
  process.exit(1);
}

const built = buildNewsFromTemplate(konu);
console.log(
  JSON.stringify({
    ok: built.complete,
    code: built.complete ? 'ok' : 'quality',
    message: built.complete ? 'OK' : built.issues.join('; '),
    templateId: built.templateId,
    templateName: built.templateName,
    baslik: built.baslik,
    konu: built.konu,
    wordCount: built.wordCount,
    complete: built.complete,
    issues: built.issues,
  }),
);
