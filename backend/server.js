import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { testConnection } from './src/config/db.js';

// Import routes
import authRoutes from './src/routes/auth.js';
import serviceRoutes from './src/routes/services.js';
import incidentRoutes from './src/routes/incidents.js';
import publicRoutes from './src/routes/public.js'; // اضافه شد

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// DATABASE CONNECTION
// ============================================
await testConnection();


// ============================================
// MIDDLEWARE - FLEXIBLE CORS CONFIGURATION
// ============================================

// پشتیبانی کامل از:
// - WebStorm Built-in Server (localhost:63342)
// - Live Server (localhost:5500)
// - Direct file opening (origin: null)
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            // WebStorm Built-in Server
            'http://localhost:63342',
            'http://127.0.0.1:63342',

            // Live Server (VSCode)
            'http://localhost:5500',
            'http://127.0.0.1:5500',

            // Other common ports
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            'http://localhost:3001',
            'http://127.0.0.1:3001',

            // Direct file opening
            null
        ];

        // اگه origin در لیست مجاز بود یا undefined بود (Postman/curl)
        if (!origin || allowedOrigins.indexOf(origin) !== -1 ||
            (origin && origin.startsWith('http://localhost:63342'))) {
            callback(null, true);
        } else {
            console.warn(`⚠️  Blocked origin: ${origin}`);
            callback(null, true); // در حالت development همه رو مجاز کن
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const origin = req.headers.origin || 'direct';
    const userAgent = req.headers['user-agent'] ?
        req.headers['user-agent'].substring(0, 50) : 'unknown';

    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    console.log(`  Origin: ${origin}`);

    next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'TraceRouteX API is running',
        timestamp: new Date().toISOString(),
        cors: 'enabled',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/incidents', incidentRoutes);
// app.use('/api/users', userRoutes);

// Public status page endpoint
app.get('/public/status', async (req, res) => {
    try {
        const servicesQuery = `
      SELECT id, name, status, description 
      FROM services 
      ORDER BY name
    `;

        const incidentsQuery = `
      SELECT i.id, i.title, i.severity, i.status, i.created_at,
             s.name as service_name
      FROM incidents i
      JOIN services s ON i.service_id = s.id
      WHERE i.is_published = true
      ORDER BY i.created_at DESC
      LIMIT 10
    `;

        const [servicesResult, incidentsResult] = await Promise.all([
            pool.query(servicesQuery),
            pool.query(incidentsQuery)
        ]);

        res.json({
            success: true,
            data: {
                services: servicesResult.rows,
                incidents: incidentsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching public status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch public status'
        });
    }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.path}`,
        availableRoutes: [
            '/health',
            '/api/auth/*',
            '/api/services/*',
            '/api/incidents/*',
            '/api/users/*',
            '/public/status'
        ]
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     TraceRouteX API Server Started     ║
║                                        ║
║  Port: ${PORT}                           ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  CORS: Multi-Environment Support       ║
║                                        ║
║  Supported Clients:                    ║
║  ✅ WebStorm (localhost:63342)         ║
║  ✅ Live Server (localhost:5500)       ║
║  ✅ Direct File Opening (file:///)     ║
║                                        ║
║  Health Check:                         ║
║  http://localhost:${PORT}/health         ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    // console.loSIGTERM signal received: closing HTTP server');
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});

// module.exports = { app, pool };
