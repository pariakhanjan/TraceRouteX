// src/controllers/incidentController.js
import pool from '../config/db.js';
import { logAction } from '../utils/auditLogger.js';

export const getAllIncidents = async (req, res) => {
    const { service_id, status, severity } = req.query;

    let query = `
        SELECT i.*, 
               s.name as service_name,
               u.username as created_by_username
        FROM incidents i
        JOIN services s ON i.service_id = s.id
        LEFT JOIN users u ON i.created_by = u.id
        WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (service_id) {
        query += ` AND i.service_id = $${paramCount}`;
        params.push(service_id);
        paramCount++;
    }

    if (status) {
        query += ` AND i.status = $${paramCount}`;
        params.push(status);
        paramCount++;
    }

    if (severity) {
        query += ` AND i.severity = $${paramCount}`;
        params.push(severity);
        paramCount++;
    }

    query += ' ORDER BY i.created_at DESC';

    try {
        const result = await pool.query(query, params);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('خطا در دریافت رخدادها:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت رخدادها'
        });
    }
};

export const getIncidentById = async (req, res) => {
    const { id } = req.params;

    try {
        const incidentResult = await pool.query(`
            SELECT i.*, 
                   s.name as service_name,
                   creator.username as created_by_username,
                   resolver.username as resolved_by_username
            FROM incidents i
            JOIN services s ON i.service_id = s.id
            LEFT JOIN users creator ON i.created_by = creator.id
            LEFT JOIN users resolver ON i.resolved_by = resolver.id
            WHERE i.id = $1
        `, [id]);

        if (incidentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'رخداد یافت نشد'
            });
        }

        // دریافت به‌روزرسانی‌ها (خط زمانی)
        const updatesResult = await pool.query(`
            SELECT iu.*, u.username as created_by_username
            FROM incident_updates iu
            LEFT JOIN users u ON iu.created_by = u.id
            WHERE iu.incident_id = $1
            ORDER BY iu.created_at ASC
        `, [id]);

        res.json({
            success: true,
            data: {
                ...incidentResult.rows[0],
                updates: updatesResult.rows
            }
        });
    } catch (error) {
        console.error('خطا در دریافت جزئیات رخداد:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت اطلاعات رخداد'
        });
    }
};

export const createIncident = async (req, res) => {
    const { service_id, title, description, severity } = req.body;

    if (!service_id || !title || !description || !severity) {
        return res.status(400).json({
            success: false,
            message: 'تمام فیلدهای الزامی باید پر شوند'
        });
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
        return res.status(400).json({
            success: false,
            message: 'شدت رخداد نامعتبر است',
            validSeverities
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ایجاد رخداد
        const incidentResult = await client.query(
            `INSERT INTO incidents (service_id, title, description, severity, status, created_by)
             VALUES ($1, $2, $3, $4, 'open', $5)
             RETURNING *`,
            [service_id, title, description, severity, req.user.id]
        );

        const incident = incidentResult.rows[0];

        // تغییر خودکار وضعیت سرویس بر اساس شدت (منطق سناریو PDF)
        let newServiceStatus = 'up';
        if (severity === 'critical' || severity === 'high') {
            newServiceStatus = 'down';
        } else if (severity === 'medium') {
            newServiceStatus = 'degraded';
        }

        await client.query(
            'UPDATE services SET status = $1 WHERE id = $2',
            [newServiceStatus, service_id]
        );

        // ثبت update اولیه
        await client.query(
            `INSERT INTO incident_updates (incident_id, message, created_by)
             VALUES ($1, $2, $3)`,
            [incident.id, 'رخداد ثبت شد و بررسی آغاز گردید', req.user.id]
        );

        // ثبت در audit log
        await logAction(req.user.id, 'create_incident', 'incident', incident.id);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'رخداد با موفقیت ثبت شد',
            data: incident
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('خطا در ثبت رخداد:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در ثبت رخداد'
        });
    } finally {
        client.release();
    }
};

// ثبت به‌روزرسانی برای رخداد (خط زمانی)
export const addIncidentUpdate = async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({
            success: false,
            message: 'پیام الزامی است'
        });
    }

    try {
        // بررسی وجود رخداد
        const checkIncident = await pool.query(
            'SELECT id, status FROM incidents WHERE id = $1',
            [id]
        );

        if (checkIncident.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'رخداد یافت نشد'
            });
        }

        if (checkIncident.rows[0].status === 'resolved') {
            return res.status(400).json({
                success: false,
                message: 'نمی‌توان به رخداد حل‌شده پیام اضافه کرد'
            });
        }

        const result = await pool.query(
            `INSERT INTO incident_updates (incident_id, message, created_by)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [id, message, req.user.id]
        );

        await logAction(req.user.id, 'add_incident_update', 'incident', id);

        res.status(201).json({
            success: true,
            message: 'به‌روزرسانی ثبت شد',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('خطا در ثبت به‌روزرسانی:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در ثبت به‌روزرسانی'
        });
    }
};

// دریافت به‌روزرسانی‌های یک رخداد
export const getIncidentUpdates = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            SELECT iu.*, u.username as created_by_username
            FROM incident_updates iu
            LEFT JOIN users u ON iu.created_by = u.id
            WHERE iu.incident_id = $1
            ORDER BY iu.created_at ASC
        `, [id]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('خطا در دریافت به‌روزرسانی‌ها:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت به‌روزرسانی‌ها'
        });
    }
};

/**
 * Resolve incident
 * PATCH /api/incidents/:id/resolve
 * Access: engineer, admin
 */
export const resolveIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const { root_cause, prevention_notes } = req.body;

        // چک وجود رخداد
        const incident = await pool.query(
            'SELECT * FROM incidents WHERE id = $1',
            [id]
        );

        if (incident.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'رخداد یافت نشد'
            });
        }

        const incidentData = incident.rows[0];

        if (incidentData.status === 'resolved') {
            return res.status(400).json({
                success: false,
                message: 'این رخداد قبلاً حل شده است'
            });
        }

        // ✅ حل کردن رخداد
        const result = await pool.query(
            `UPDATE incidents 
             SET status = 'resolved',
                 resolved_by = $1,
                 resolved_at = NOW(),
                 root_cause = $2,
                 prevention_notes = $3,
                 updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [req.user.id, root_cause || null, prevention_notes || null, id]
        );

        const resolvedIncident = result.rows[0];

        // ✅ بروزرسانی وضعیت Service به 'up'
        await pool.query(
            `UPDATE services
             SET status = 'up',
                 updated_at = NOW()
             WHERE id = $1`,
            [resolvedIncident.service_id]
        );

        // Bonus: audit log
        try {
            await pool.query(
                `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4)`,
                [req.user.id, 'resolve_incident', 'incident', id]
            );
        } catch (auditError) {
            console.error('Audit log error:', auditError.message);
        }

        res.json({
            success: true,
            message: 'رخداد با موفقیت حل شد و وضعیت سرویس به حالت عادی برگشت',
            data: resolvedIncident
        });

    } catch (error) {
        console.error('Resolve incident error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در حل کردن رخداد'
        });
    }
};

/**
 * Toggle incident publish status
 * PATCH /api/incidents/:id/publish
 * Access: admin only
 */
export const togglePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_published } = req.body;

        // بررسی نقش - فقط admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'فقط ادمین می‌تواند وضعیت انتشار را تغییر دهد'
            });
        }

        // Validation
        if (typeof is_published !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'مقدار is_published باید true یا false باشد'
            });
        }

        const result = await pool.query(
            `UPDATE incidents 
             SET is_published = $1, 
                 updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [is_published, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'رخداد یافت نشد'
            });
        }

        res.json({
            success: true,
            message: is_published ? 'رخداد منتشر شد' : 'رخداد از حالت انتشار خارج شد',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در تغییر وضعیت انتشار'
        });
    }
};

