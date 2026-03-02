/**
 * SOFIYA Identity Service
 * Singleton for IdentityManager
 */

import { IdentityManager } from './identity-manager.js';
import pkg from 'pg';
const { Pool } = pkg;

// Use shared pool if available, otherwise create one
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

let identityManager = null;

export function getIdentityManager() {
    if (!identityManager) {
        identityManager = new IdentityManager({
            db: pool
        });
    }
    return identityManager;
}
