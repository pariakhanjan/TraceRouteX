import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import { testConnection } from './src/config/db.js';

// Import routes
import authRoutes from './src/routes/auth.js';
import serviceRoutes from './src/routes/services.js';
import incidentRoutes from './src/routes/incidents.js';
import publicRoutes from './src/routes/public.js';

dotenv.config();

// ES Module way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ════════════════════════════════════════════════════════════════
// MIDDLEWARE CONFIGURATION
// ════════════════════════════════════════════════════════════════

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || `http://localhost:${PORT}`,
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logger (برای دیباگ)
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// ════════════════════════════════════════════════════════════════
// SERVE FRONTEND STATIC FILES
// ════════════════════════════════════════════════════════════════

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath, {
    index: false, // غیرفعال کردن سرو خودکار index.html
    extensions: ['html'] // اجازه دسترسی بدون پسوند
}));

console.log(`📁 Frontend path: ${frontendPath}`);

// ════════════════════════════════════════════════════════════════
// DATABASE CONNECTION TEST
// ════════════════════════════════════════════════════════════════

await testConnection();

// ════════════════════════════════════════════════════════════════
// API ROUTES
// ════════════════════════════════════════════════════════════════

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/public', publicRoutes);

// ════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'TraceRouteX Server is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ════════════════════════════════════════════════════════════════
// FRONTEND ROUTING
// ════════════════════════════════════════════════════════════════

// صفحه اصلی (index.html) - در ریشه frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// صفحات HTML در پوشه pages
const frontendPages = [
    'dashboard',
    'incident-detail',
    'login',
    'public-status',
    'register',
    'service-detail',
    'admin-users',
    'error-handler'
];

frontendPages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(frontendPath, 'pages', `${page}.html`));
    });
    app.get(`/${page}.html`, (req, res) => {
        res.sendFile(path.join(frontendPath, 'pages', `${page}.html`));
    });
    // پشتیبانی از مسیر /pages/xxx.html
    app.get(`/pages/${page}.html`, (req, res) => {
        res.sendFile(path.join(frontendPath, 'pages', `${page}.html`));
    });
});

// ════════════════════════════════════════════════════════════════
// 404 HANDLER
// ════════════════════════════════════════════════════════════════

app.use((req, res, next) => {
    // اگر درخواست برای API بود
    if (req.url.startsWith('/api') || req.url.startsWith('/public')) {
        res.status(404).json({
            success: false,
            message: 'API endpoint not found',
            path: req.url
        });
    } else {
        // اگر فایل استاتیک پیدا نشد - سرو کردن صفحه error-handler.html
        res.status(404).sendFile(path.join(frontendPath, 'pages', 'error-handler.html'));
    }
});

// ════════════════════════════════════════════════════════════════
// ERROR HANDLER
// ════════════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
    console.error('❌ Error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════

app.listen(PORT, async () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║          🚀TraceRouteX Server Started Successfully!            ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐  ║
║  │  📡 Server URL:    http://localhost:${PORT}                 │  ║
║  │  🌐 Frontend:      http://localhost:${PORT}/index.html      │  ║
║  │  🔌 API Base:      http://localhost:${PORT}/api             │  ║
║  │  📊 Public Status: http://localhost:${PORT}/public/status   │  ║
║  │  ❤️  Health Check:  http://localhost:${PORT}/health         │  ║
║  └──────────────────────────────────────────────────────────┘  ║
║                                                                ║
║  Environment: ${process.env.NODE_ENV || 'development'}                                      ║
║  Database: PostgreSQL (Connected ✅)                            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);

    // باز کردن خودکار مرورگر بعد از 1.5 ثانیه
    setTimeout(async () => {
        const url = `http://localhost:${PORT}/index`;
        try {
            console.log('\n🌐 Opening browser automatically...');
            await open(url);
            console.log('✅ Browser opened successfully!\n');
        } catch (error) {
            console.log('⚠️  Could not open browser automatically.');
            console.log(`   Please open manually: ${url}\n`);
        }
    }, 1500);
});

// ════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ════════════════════════════════════════════════════════════════

process.on('SIGINT', () => {
    console.log('\n\n🛑 Server is shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Server is shutting down gracefully...');
    process.exit(0);
});
