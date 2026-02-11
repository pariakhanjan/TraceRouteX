import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// تنظیمات اتصال به PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'TraceRouteX',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Event handlers
pool.on('connect', () => {
    console.log('✅ Database connected!');
});

pool.on('error', (err) => {
    console.error('❌ Database error:', err);
    process.exit(-1);
});

// Query helper function
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query executed', { duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Query error:', error);
        throw error;
    }
};

// Test connection
export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW()');
        console.log('✅ Database is available!', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed!');
        return false;
    }
};

export default pool;
