import pool from '../config/db.js';

/**
 * Public status page
 * GET /public/status
 * Access: Public (بدون نیاز به احراز هویت)
 */
export const getPublicStatus = async (req, res) => {
    try {
        // دریافت همه سرویس‌ها
        const servicesResult = await pool.query(
            `SELECT id, name, description, status
             FROM services
             ORDER BY name ASC`
        );

        // ✅ فقط رخدادهایی که منتشر شده‌اند (is_published = true)
        const incidentsResult = await pool.query(
            `SELECT
                 i.id,
                 i.title,
                 i.description,
                 i.severity,
                 i.status,
                 i.created_at,
                 i.resolved_at,
                 s.name AS service_name
             FROM incidents i
                      JOIN services s ON i.service_id = s.id
             WHERE i.is_published = true  -- ✅ شرط اصلی
             ORDER BY i.created_at DESC
             LIMIT 10`
        );

        // تعیین وضعیت کلی سیستم
        const hasDown = servicesResult.rows.some(s => s.status === 'down');
        const hasDegraded = servicesResult.rows.some(s => s.status === 'degraded');

        let overallStatus = 'up';
        if (hasDown) overallStatus = 'down';
        else if (hasDegraded) overallStatus = 'degraded';

        res.json({
            success: true,
            data: {
                services: servicesResult.rows,
                recent_incidents: incidentsResult.rows,
                overall_status: overallStatus
            }
        });

    } catch (error) {
        console.error('Public status error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت وضعیت عمومی'
        });
    }
};
