import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// ════════════════════════════════════════════════════════════════
// GET ALL SERVICES
// ════════════════════════════════════════════════════════════════
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.id,
                s.name,
                s.description,
                s.status,
                s.created_by,
                s.created_at,
                s.updated_at,
                u.username as creator_username
            FROM services s
            LEFT JOIN users u ON s.created_by = u.id
            ORDER BY s.created_at DESC
        `);

        res.json({
            success: true,
            data: result.rows,
            message: 'Services retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch services',
            error: error.message
        });
    }
});

// ════════════════════════════════════════════════════════════════
// GET SERVICE BY ID (این endpoint مهم‌ترین چیزه که کم داشتید!)
// ════════════════════════════════════════════════════════════════
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Get service details
        const serviceResult = await pool.query(`
            SELECT 
                s.id,
                s.name,
                s.description,
                s.status,
                s.created_by,
                s.created_at,
                s.updated_at,
                u.username as creator_username
            FROM services s
            LEFT JOIN users u ON s.created_by = u.id
            WHERE s.id = $1
        `, [id]);

        if (serviceResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Get recent incidents for this service
        const incidentsResult = await pool.query(`
            SELECT 
                i.id,
                i.title,
                i.status,
                i.severity,
                i.created_at,
                i.resolved_at
            FROM incidents i
            WHERE i.service_id = $1
            ORDER BY i.created_at DESC
            LIMIT 10
        `, [id]);

        const service = serviceResult.rows[0];
        service.recent_incidents = incidentsResult.rows;

        res.json({
            success: true,
            data: service,
            message: 'Service retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service',
            error: error.message
        });
    }
});

// ════════════════════════════════════════════════════════════════
// CREATE SERVICE (Admin only)
// ════════════════════════════════════════════════════════════════
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { name, description, status = 'up' } = req.body;
        const userId = req.user.id;

        // Validation
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Name and description are required'
            });
        }

        const result = await pool.query(`
            INSERT INTO services (name, description, status, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [name, description, status, userId]);

        // Log audit
        await pool.query(`
            INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
            VALUES ($1, 'create', 'service', $2)
        `, [userId, result.rows[0].id]);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Service created successfully'
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create service',
            error: error.message
        });
    }
});

// ════════════════════════════════════════════════════════════════
// UPDATE SERVICE STATUS (Engineer + Admin)
// ════════════════════════════════════════════════════════════════
router.patch('/:id/status', authenticate, authorize('engineer', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        // Validation
        const validStatuses = ['up', 'down', 'degraded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: up, down, or degraded'
            });
        }

        const result = await pool.query(`
            UPDATE services
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Log audit
        await pool.query(`
            INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
            VALUES ($1, 'update_status', 'service', $2, $3)
        `, [userId, id, JSON.stringify({ new_status: status })]);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Service status updated successfully'
        });
    } catch (error) {
        console.error('Error updating service status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update service status',
            error: error.message
        });
    }
});

// ════════════════════════════════════════════════════════════════
// UPDATE SERVICE (Admin only)
// ════════════════════════════════════════════════════════════════
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const userId = req.user.id;

        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const result = await pool.query(`
            UPDATE services
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Log audit
        await pool.query(`
            INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
            VALUES ($1, 'update', 'service', $2)
        `, [userId, id]);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Service updated successfully'
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update service',
            error: error.message
        });
    }
});

// ════════════════════════════════════════════════════════════════
// DELETE SERVICE (Admin only)
// ════════════════════════════════════════════════════════════════
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if service has incidents
        const incidentCheck = await pool.query(`
            SELECT COUNT(*) as count FROM incidents WHERE service_id = $1
        `, [id]);

        if (parseInt(incidentCheck.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete service with existing incidents'
            });
        }

        const result = await pool.query(`
            DELETE FROM services
            WHERE id = $1
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Log audit
        await pool.query(`
            INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
            VALUES ($1, 'delete', 'service', $2)
        `, [userId, id]);

        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete service',
            error: error.message
        });
    }
});

export default router;
