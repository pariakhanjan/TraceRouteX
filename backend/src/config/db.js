const { Pool } = require('pg');
require('dotenv').config();

// تنظیمات اتصال به PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'TraceRouteX',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20, // حداکثر تعداد اتصالات همزمان
    idleTimeoutMillis: 30000, // زمان بسته شدن اتصالات بیکار
    connectionTimeoutMillis: 2000, // تایم‌اوت اتصال
});

// تست اتصال
pool.on('connect', () => {
    console.log('Database connected! ✅');
});

pool.on('error', (err) => {
    console.error('Error in connecting to database!❌', err);
    process.exit(-1);
});

// تابع کمکی برای کوئری‌ها
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query is running!', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Error in running query!', error);
        throw error;
    }
};

// تابع تست اتصال
const testConnection = async () => {
    try {
        const result = await query('SELECT NOW()');
        console.log('✅ Database is available!', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Database is not available!');
        return false;
    }
};

module.exports = {
    pool,
    query,
    testConnection
};
