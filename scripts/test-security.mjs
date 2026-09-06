/**
 * scripts/test-security.mjs
 * Verification test for security utilities:
 * - Rate Limiter
 * - File signature validation
 * - CSRF / Origin Guard
 */

import assert from 'node:assert';
import { checkRateLimit, resetRateLimit } from '../src/lib/security/rateLimiter.ts';
import { isValidImageSignature, isValidDocumentSignature } from '../src/lib/security/fileValidation.ts';
import { isCsrfSafe } from '../src/lib/security/csrf.ts';

console.log('🔒 Testing Security Hardening Components...');

// 1. Test Rate Limiter
const testKey = 'test:login:ip:127.0.0.1';
resetRateLimit(testKey);

for (let i = 1; i <= 5; i++) {
  const res = checkRateLimit(testKey, { max: 5, windowSeconds: 60, blockSeconds: 60 });
  assert.strictEqual(res.allowed, true, `Attempt ${i} should be allowed`);
}

// 6th attempt should be blocked
const blockedRes = checkRateLimit(testKey, { max: 5, windowSeconds: 60, blockSeconds: 60 });
assert.strictEqual(blockedRes.allowed, false, '6th attempt must be blocked');
assert.ok(blockedRes.retryAfterSeconds > 0, 'Retry-after must be positive');
console.log('✅ Rate Limiter test passed.');

// Reset and verify recovery
resetRateLimit(testKey);
const freshRes = checkRateLimit(testKey, { max: 5, windowSeconds: 60, blockSeconds: 60 });
assert.strictEqual(freshRes.allowed, true, 'After reset, attempt must be allowed');
console.log('✅ Rate Limiter reset test passed.');

// 2. Test File Signature Validation
// Valid JPEG
const validJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
assert.strictEqual(isValidImageSignature(validJpeg), true, 'Valid JPEG must pass');
assert.strictEqual(isValidDocumentSignature(validJpeg), true, 'Valid JPEG document must pass');

// Valid PDF: %PDF-1.4
const validPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
assert.strictEqual(isValidDocumentSignature(validPdf), true, 'Valid PDF must pass');
assert.strictEqual(isValidImageSignature(validPdf), false, 'PDF must NOT pass as image');

// Malicious file: <?php ... disguised
const fakeFile = new Uint8Array([0x3c, 0x3f, 0x70, 0x68, 0x70, 0x20, 0x65, 0x63, 0x68, 0x6f, 0x20, 0x31]);
assert.strictEqual(isValidImageSignature(fakeFile), false, 'PHP script must NOT pass as image');
assert.strictEqual(isValidDocumentSignature(fakeFile), false, 'PHP script must NOT pass as document');

console.log('✅ File Signature validation test passed.');

// 3. Test CSRF Guard
// GET request is always safe
const getReq = new Request('https://spornerede.net/api/panel/session', { method: 'GET' });
assert.strictEqual(isCsrfSafe(getReq), true, 'GET request must be safe');

// POST request with matching Origin is safe
const postSafeReq = new Request('https://spornerede.net/api/panel/login', {
  method: 'POST',
  headers: {
    origin: 'https://spornerede.net',
    host: 'spornerede.net',
  },
});
assert.strictEqual(isCsrfSafe(postSafeReq), true, 'Same-origin POST must be safe');

// POST request with foreign Origin must be blocked
const postMaliciousReq = new Request('https://spornerede.net/api/panel/login', {
  method: 'POST',
  headers: {
    origin: 'https://evil-attacker-site.com',
    host: 'spornerede.net',
  },
});
assert.strictEqual(isCsrfSafe(postMaliciousReq), false, 'Cross-origin POST must be blocked');

console.log('✅ CSRF Guard test passed.');

console.log('🎉 All Security Automated Tests Passed Successfully!');
process.exit(0);
