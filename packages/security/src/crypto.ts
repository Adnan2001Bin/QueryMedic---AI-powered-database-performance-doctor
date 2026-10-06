import crypto from 'node:crypto';

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64
  tag: string;        // Base64
}

/**
 * Derives or normalizes a 32-byte key from the provided secret string.
 */
export function getMasterKey(secretKey: string): Buffer {
  if (!secretKey) {
    throw new Error('Encryption secret key cannot be empty');
  }
  return crypto.createHash('sha256').update(secretKey).digest();
}

/**
 * Encrypts plaintext using AES-256-GCM authenticated encryption.
 * Generates a unique 12-byte IV for each operation.
 */
export function encryptCredential(plaintext: string, secretKey: string): EncryptedPayload {
  if (typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a string');
  }

  const key = getMasterKey(secretKey);
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * Decrypts an AES-256-GCM payload and verifies the authentication tag.
 * Throws if the tag is invalid (tampering detected).
 */
export function decryptCredential(payload: EncryptedPayload, secretKey: string): string {
  const key = getMasterKey(secretKey);
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
