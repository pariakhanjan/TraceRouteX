import pool from '../config/db.js';

export const getAllServices = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, u.username as owner_name 
       FROM services s 
       LEFT JOIN users u ON s.owner_id = u.id 
       ORDER BY s.created_at DESC`
        );

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching services.'
        });
    }
};

export const createService = async (req, res) => {
    try {
        const { name, type, ip_address, description } = req.body;

        if (!name || !type || !ip_address) {
            return res.status(400).json({
                success: false,
                message: 'Name, type and IP address are required.'
            });
        }

        const result = await pool.query(
            `INSERT INTO services (name, type, ip_address, description, owner_id, status) 
       VALUES ($1, $2, $3, $4, $5, 'operational') 
       RETURNING *`,
            [name, type, ip_address, description, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Service created successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating service.'
        });
    }
};

export const updateServiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['operational', 'degraded', 'down', 'maintenance'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value.'
            });
        }

        const result = await pool.query(
            `UPDATE services 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service not found.'
            });
        }

        res.json({
            success: true,
            message: 'Service status updated.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update service status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating service status.'
        });
    }
};
