/**
 * SOFIYA Encryption Service
 * Phase 10.3: Data Encryption
 * 
 * AES-256 encryption for sensitive fields at rest.
 * Integrates with TLS for transit (handled by server config).
 */

import 'dotenv/config';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export class EncryptionService {
    constructor(options = {}) {
        this.encryptionKey = options.encryptionKey || process.env.ENCRYPTION_KEY;
        if (!this.encryptionKey || this.encryptionKey.length < 32) {
            this.encryptionKey = crypto.scryptSync(
                process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
                'salt',
                KEY_LENGTH
            ).toString('hex');
        }
    }

    /**
     * Derives key from secret
     * @private
     */
    getKey() {
        if (Buffer.isBuffer(this.encryptionKey)) {
            return this.encryptionKey.slice(0, KEY_LENGTH);
        }
        return crypto.scryptSync(this.encryptionKey, 'salt', KEY_LENGTH);
    }

    /**
     * Encrypts plaintext
     * @param {string} plaintext - Text to encrypt
     * @returns {string} Base64 encrypted string (iv:authTag:ciphertext)
     */
    encrypt(plaintext) {
        const key = this.getKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        return Buffer.concat([
            iv,
            authTag,
            Buffer.from(encrypted, 'hex')
        ]).toString('base64');
    }

    /**
     * Decrypts ciphertext
     * @param {string} encrypted - Encrypted string from encrypt()
     * @returns {string} Decrypted plaintext
     */
    decrypt(encrypted) {
        const key = this.getKey();
        const buffer = Buffer.from(encrypted, 'base64');
        const iv = buffer.subarray(0, IV_LENGTH);
        const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        return decipher.update(ciphertext) + decipher.final('utf8');
    }

    /**
     * Hashes password (bcrypt-compatible - use bcrypt in production)
     * @param {string} password - Plain password
     * @returns {string} Hash
     */
    hashPassword(password) {
        return crypto.scryptSync(password, 'salt', 64).toString('hex');
    }

    /**
     * Verifies password against hash
     */
    verifyPassword(password, hash) {
        const computed = this.hashPassword(password);
        return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
    }

    /**
     * Encrypts object (JSON)
     */
    encryptObject(obj) {
        return this.encrypt(JSON.stringify(obj));
    }

    /**
     * Decrypts to object
     */
    decryptObject(encrypted) {
        return JSON.parse(this.decrypt(encrypted));
    }
}
