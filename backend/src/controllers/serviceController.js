import pool from '../config/db.js';
import { logAction } from '../utils/auditLogger.js'; // برای bonus

export const getAllServices = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, u.username as created_by_username
            FROM services s
                     LEFT JOIN users u ON s.created_by = u.id
            ORDER BY s.created_at DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting all services', error);
        res.status(500).json({
            success: false,
            message: 'Error getting service list'
        });
    }
};

export const createService = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Service name required'
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO services (name, description, status, created_by)
             VALUES ($1, $2, 'up', $3)
             RETURNING *`,
            [name, description || null, req.user.id]
        );

        // ثبت در audit log (Bonus)
        await logAction(req.user.id, 'create_service', 'service', result.rows[0].id);

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating service', error);
        res.status(500).json({
            success: false,
            message: 'Error creating service'
        });
    }
};

export const updateServiceStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['up', 'degraded', 'down'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status',
            validStatuses
        });
    }

    try {
        const result = await pool.query(
            `UPDATE services 
             SET status = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // ثبت در audit log
        await logAction(req.user.id, 'update_service_status', 'service', id, {
            old_status: result.rows[0].status,
            new_status: status
        });

        res.json({
            success: true,
            message: 'Service status updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating service status', error);
        res.status(500).json({
            success: false,
            message: 'Error updating service status'
        });
    }
};
