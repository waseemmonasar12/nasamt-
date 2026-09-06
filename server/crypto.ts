import crypto from 'crypto';

// Strong PBKDF2/scrypt password hashing with unique salt
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(32).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
    const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    if (keyBuffer.length !== hashBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, hashBuffer);
  } catch {
    return false;
  }
}

// AES-256-GCM encryption for private notes & backups
const ENCRYPTION_KEY = crypto.scryptSync(
  process.env.SESSION_SECRET || 'nesmat-sheta-sanctuary-master-key-2026',
  'winter-salt-constant',
  32
);

export function encryptData(text: string): { iv: string; encryptedData: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    tag,
  };
}

export function decryptData(encryptedData: string, ivHex: string, tagHex: string): string {
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function generateSessionToken(): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString('hex');
  const payload = `owner.${timestamp}.${random}`;
  const hmac = crypto.createHmac('sha256', ENCRYPTION_KEY).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

export function verifySessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  try {
    const parts = token.split('.');
    if (parts.length === 4 && parts[0] === 'owner') {
      const payload = `${parts[0]}.${parts[1]}.${parts[2]}`;
      const expectedHmac = crypto.createHmac('sha256', ENCRYPTION_KEY).update(payload).digest('hex');
      const expectedBuffer = Buffer.from(expectedHmac, 'hex');
      const actualBuffer = Buffer.from(parts[3], 'hex');
      if (expectedBuffer.length !== actualBuffer.length) return false;
      if (!crypto.timingSafeEqual(expectedBuffer, actualBuffer)) return false;

      // Check max age (90 days)
      const tokenTime = parseInt(parts[1], 10);
      if (isNaN(tokenTime)) return false;
      const ageMs = Date.now() - tokenTime;
      return ageMs >= 0 && ageMs < 90 * 24 * 60 * 60 * 1000;
    }
    // Legacy random hex tokens fallback
    return token.length >= 32;
  } catch {
    return false;
  }
}

/**
 * Normalizes Arabic text for tolerant matching (handles Hamza, Taa Marbuta, diacritics, extra spaces)
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Remove diacritics (Harakat)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Replace Alif variants (أ, إ, آ) with plain ا
    .replace(/[أإآٱ]/g, 'ا')
    // Replace Taa Marbuta ة with Haa ه
    .replace(/ة/g, 'ه')
    // Replace Persian/Urdu Yeh ي/ى
    .replace(/ى/g, 'ي')
    // Replace zero-width spaces
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ');
}
