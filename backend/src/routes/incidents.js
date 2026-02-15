import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/* =========================================
   GET /api/incidents
========================================= */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT
                i.*,
                s.name AS service_name,
                u.username AS created_by_username
            FROM incidents i
                     LEFT JOIN services s ON i.service_id = s.id
                     LEFT JOIN users u ON i.created_by = u.id
            ORDER BY i.created_at DESC
        `);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

/* =========================================
   GET /api/incidents/:id
========================================= */
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT
                i.*,
                s.name AS service_name,
                u.username AS created_by_username
            FROM incidents i
            LEFT JOIN services s ON i.service_id = s.id
            LEFT JOIN users u ON i.created_by = u.id
            WHERE i.id = $1
        `, [req.params.id]);

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

/* =========================================
   GET /api/incidents/:id/updates
========================================= */
router.get('/:id/updates', authenticate, async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT
                iu.id,
                iu.incident_id,
                iu.message,
                iu.created_at,
                u.username AS updated_by
            FROM incident_updates iu
            LEFT JOIN users u ON iu.created_by = u.id
            WHERE iu.incident_id = $1
            ORDER BY iu.created_at DESC
        `, [req.params.id]);

        res.json({
            success: true,
            data: { updates: result.rows }
        });
    } catch (error) {
        next(error);
    }
});

/* =========================================
   POST /api/incidents
========================================= */
router.post('/', authenticate, async (req, res, next) => {
    try {
        const {
            service_id,
            title,
            description,
            severity = 'medium',
            is_published = true
        } = req.body;

        const result = await pool.query(`
            INSERT INTO incidents
                (service_id, title, description, severity, status, is_published, created_by)
            VALUES
                ($1, $2, $3, $4, 'open', $5, $6)
            RETURNING *
        `, [
            service_id,
            title,
            description,
            severity,
            is_published,
            req.user.id
        ]);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Incident created successfully'
        });
    } catch (error) {
        next(error);
    }
});

/* =========================================
   POST /api/incidents/:id/updates
========================================= */
router.post('/:id/updates', authenticate, async (req, res, next) => {
    try {
        const { message } = req.body;

        const result = await pool.query(`
            INSERT INTO incident_updates (incident_id, message, created_by)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [req.params.id, message, req.user.id]);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Update added successfully'
        });
    } catch (error) {
        next(error);
    }
});

/* =========================================
   PATCH /api/incidents/:id
========================================= */
router.patch('/:id', authenticate, async (req, res, next) => {
    try {
        const fields = [];
        const values = [];
        let i = 1;

        for (const key of ['title', 'description', 'severity', 'status']) {
            if (req.body[key] !== undefined) {
                fields.push(`${key} = $${i++}`);
                values.push(req.body[key]);
            }
        }

        fields.push(`updated_at = NOW()`);
        values.push(req.params.id);

        const result = await pool.query(`
            UPDATE incidents
            SET ${fields.join(', ')}
            WHERE id = $${i}
            RETURNING *
        `, values);

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Incident updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

/* =========================================
   PATCH /api/incidents/:id/resolve
========================================= */
router.patch('/:id/resolve', authenticate, async (req, res, next) => {
    try {
        const { root_cause, prevention_notes, resolution_notes } = req.body;

        const result = await pool.query(`
            UPDATE incidents
            SET
                status = 'resolved',
                root_cause = $1,
                prevention_notes = $2,
                resolved_by = $3,
                resolved_at = NOW(),
                updated_at = NOW()
            WHERE id = $4
            RETURNING *
        `, [root_cause, prevention_notes, req.user.id, req.params.id]);

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        if (resolution_notes) {
            await pool.query(`
                INSERT INTO incident_updates (incident_id, message, created_by)
                VALUES ($1, $2, $3)
            `, [req.params.id, resolution_notes, req.user.id]);
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Incident resolved successfully'
        });
    } catch (error) {
        next(error);
    }
});

/* =========================================
   DELETE /api/incidents/:id
========================================= */
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        await pool.query(
            'DELETE FROM incident_updates WHERE incident_id = $1',
            [req.params.id]
        );

        const result = await pool.query(
            'DELETE FROM incidents WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        res.json({ success: true, message: 'Incident deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
