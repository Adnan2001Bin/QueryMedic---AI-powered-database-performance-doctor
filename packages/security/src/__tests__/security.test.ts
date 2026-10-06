import { describe, it, expect } from 'vitest';
import { encryptCredential, decryptCredential } from '../crypto.js';
import { hashPassword, verifyPassword } from '../hash.js';

describe('Security Package - AES-256-GCM Credential Encryption', () => {
  const secretKey = 'super-secret-master-encryption-key-querymedic';
  const samplePassword = 'my-sensitive-production-password-1234!';

  it('encrypts and decrypts credential successfully', () => {
    const encrypted = encryptCredential(samplePassword, secretKey);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.tag).toBeDefined();
    expect(encrypted.ciphertext).not.toBe(samplePassword);

    const decrypted = decryptCredential(encrypted, secretKey);
    expect(decrypted).toBe(samplePassword);
  });

  it('generates different ciphertexts and IVs for the same plaintext', () => {
    const enc1 = encryptCredential(samplePassword, secretKey);
    const enc2 = encryptCredential(samplePassword, secretKey);

    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
    expect(decryptCredential(enc1, secretKey)).toBe(samplePassword);
    expect(decryptCredential(enc2, secretKey)).toBe(samplePassword);
  });

  it('throws an error if ciphertext or tag is tampered with', () => {
    const encrypted = encryptCredential(samplePassword, secretKey);

    // Tamper with tag
    const tamperedTag = {
      ...encrypted,
      tag: Buffer.from('corruptedtag12345').toString('base64'),
    };

    expect(() => decryptCredential(tamperedTag, secretKey)).toThrow();

    // Tamper with ciphertext
    const tamperedCipher = {
      ...encrypted,
      ciphertext: Buffer.from('corruptedciphertext').toString('base64'),
    };

    expect(() => decryptCredential(tamperedCipher, secretKey)).toThrow();
  });

  it('fails decryption with an incorrect secret key', () => {
    const encrypted = encryptCredential(samplePassword, secretKey);
    const wrongKey = 'wrong-secret-key-querymedic-fake';

    expect(() => decryptCredential(encrypted, wrongKey)).toThrow();
  });
});

describe('Security Package - Password Hashing (scrypt)', () => {
  const rawPassword = 'SecureUserPassword2026!';

  it('hashes password and verifies successfully', async () => {
    const hash = await hashPassword(rawPassword);
    expect(hash.startsWith('scrypt$')).toBe(true);

    const isValid = await verifyPassword(rawPassword, hash);
    expect(isValid).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword(rawPassword);
    const isValid = await verifyPassword('IncorrectPassword123', hash);
    expect(isValid).toBe(false);
  });
});
