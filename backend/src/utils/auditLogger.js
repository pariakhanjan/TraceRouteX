// src/utils/auditLogger.js
import pool from '../config/db.js';

export const logAction = async (actorId, action, entityType, entityId, details = null) => {
    try {
        await pool.query(
            `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [actorId, action, entityType, entityId, details ? JSON.stringify(details) : null]
        );
    } catch (error) {
        console.error('خطا در ثبت audit log:', error);
    }
};
