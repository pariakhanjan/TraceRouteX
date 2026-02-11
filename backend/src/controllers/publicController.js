// src/controllers/publicController.js
import pool from '../config/db.js';

export const getPublicStatus = async (req, res) => {
    try {
        // دریافت وضعیت سرویس‌ها
        const servicesResult = await pool.query(`
            SELECT id, name, description, status
            FROM services
            ORDER BY name ASC
        `);

        // دریافت رخدادهای منتشرشده
        const incidentsResult = await pool.query(`
            SELECT i.id, i.title, i.description, i.severity, i.status,
                   i.created_at, i.resolved_at,
                   s.name as service_name
            FROM incidents i
            JOIN services s ON i.service_id = s.id
            WHERE i.is_published = true
            ORDER BY i.created_at DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                services: servicesResult.rows,
                recent_incidents: incidentsResult.rows,
                overall_status: calculateOverallStatus(servicesResult.rows)
            }
        });
    } catch (error) {
        console.error('خطا در دریافت وضعیت عمومی:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت وضعیت'
        });
    }
};

function calculateOverallStatus(services) {
    if (services.some(s => s.status === 'down')) {
        return 'down';
    }
    if (services.some(s => s.status === 'degraded')) {
        return 'degraded';
    }
    return 'up';
}
