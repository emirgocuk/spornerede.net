import crypto from 'node:crypto';

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

function pbkdf2Async(password: string, salt: string) {
  return new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey.toString('hex'));
    });
  });
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await pbkdf2Async(password, salt);
  return `pbkdf2$${ITERATIONS}$${DIGEST}$${salt}$${hash}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split('$');
  if (parts.length !== 5) {
    return false;
  }

  const [algorithm, iterationsRaw, digest, salt, hash] = parts;
  if (algorithm !== 'pbkdf2' || digest !== DIGEST) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const candidateHash = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, KEY_LENGTH, digest, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey.toString('hex'));
    });
  });

  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
