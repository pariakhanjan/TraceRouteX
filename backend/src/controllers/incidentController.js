import pool from '../config/db.js';

export const getAllIncidents = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT i.*, s.name as service_name, u.username as reporter_name 
       FROM incidents i 
       LEFT JOIN services s ON i.service_id = s.id 
       LEFT JOIN users u ON i.reported_by = u.id 
       ORDER BY i.created_at DESC`
        );

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Get incidents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching incidents.'
        });
    }
};

export const getIncidentById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT i.*, s.name as service_name, u.username as reporter_name 
       FROM incidents i 
       LEFT JOIN services s ON i.service_id = s.id 
       LEFT JOIN users u ON i.reported_by = u.id 
       WHERE i.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found.'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get incident error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching incident.'
        });
    }
};

export const createIncident = async (req, res) => {
    try {
        const { service_id, title, description, severity } = req.body;

        if (!service_id || !title || !severity) {
            return res.status(400).json({
                success: false,
                message: 'Service ID, title and severity are required.'
            });
        }

        const result = await pool.query(
            `INSERT INTO incidents (service_id, title, description, severity, status, reported_by) 
       VALUES ($1, $2, $3, $4, 'open', $5) 
       RETURNING *`,
            [service_id, title, description, severity, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Incident created successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create incident error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating incident.'
        });
    }
};
