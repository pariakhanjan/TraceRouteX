import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/incidents - Get all incidents
router.get('/', authenticate, async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT 
                i.*,
                s.name as service_name,
                u.username as created_by_username
            FROM incidents i
            LEFT JOIN services s ON i.service_id = s.id
            LEFT JOIN users u ON i.created_by = u.id
            ORDER BY i.created_at DESC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/incidents/:id - Get single incident
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                i.*,
                s.name as service_name,
                u.username as created_by_username
            FROM incidents i
            LEFT JOIN services s ON i.service_id = s.id
            LEFT JOIN users u ON i.created_by = u.id
            WHERE i.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/incidents/:id/updates - Get incident timeline/updates
router.get('/:id/updates', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                iu.id,
                iu.incident_id,
                iu.message,
                iu.created_at,
                u.username as updated_by
            FROM incident_updates iu
            LEFT JOIN users u ON iu.created_by = u.id
            WHERE iu.incident_id = $1
            ORDER BY iu.created_at DESC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                updates: result.rows
            }
        });

    } catch (error) {
        console.error('Error fetching incident updates:', error);
        next(error);
    }
});


// POST /api/incidents - Create new incident
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { service_id, title, description, severity } = req.body;
        const userId = req.user.id;

        const result = await pool.query(
            `INSERT INTO incidents (service_id, title, description, severity, status, created_by)
            VALUES ($1, $2, $3, $4, 'open', $5)
            RETURNING *`,
            [service_id, title, description, severity || 'medium', userId]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Incident created successfully'
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/incidents/:id/updates - Add incident update
router.post('/:id/updates', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, message } = req.body;
        const userId = req.user.id;

        const updateResult = await pool.query(
            `INSERT INTO incident_updates (incident_id, status, message, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [id, status, message, userId]
        );

        await pool.query(
            `UPDATE incidents 
            SET status = $1, updated_at = NOW()
            WHERE id = $2`,
            [status, id]
        );

        res.status(201).json({
            success: true,
            data: updateResult.rows[0],
            message: 'Update added successfully'
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/incidents/:id - Update incident
router.patch('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, severity, status } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramCount++}`);
            values.push(title);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }
        if (severity !== undefined) {
            updates.push(`severity = $${paramCount++}`);
            values.push(severity);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const result = await pool.query(
            `UPDATE incidents 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
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

// PATCH /api/incidents/:id/resolve - Resolve incident
router.patch('/:id/resolve', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE incidents 
            SET status = 'resolved', updated_at = NOW()
            WHERE id = $1
            RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
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

// DELETE /api/incidents/:id - Delete incident
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        await pool.query('DELETE FROM incident_updates WHERE incident_id = $1', [id]);

        const result = await pool.query(
            'DELETE FROM incidents WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        res.json({
            success: true,
            message: 'Incident deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
