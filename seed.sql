-- اضافه کردن کاربران نمونه
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
--('admin', 'admin@traceroutex.com', '$2b$10$rX8V9KHhOxJqE9yN5zKxLO8FqGxZ5hPwJ3MqYnF1vLKzGxE5rQx8S', 'مدیر سیستم', 'admin'),
('operator1', 'operator@traceroutex.com', '$2b$10$rX8V9KHhOxJqE9yN5zKxLO8FqGxZ5hPwJ3MqYnF1vLKzGxE5rQx8S', 'اپراتور یک', 'operator'),
('user1', 'user@example.com', '$2b$10$rX8V9KHhOxJqE9yN5zKxLO8FqGxZ5hPwJ3MqYnF1vLKzGxE5rQx8S', 'کاربر یک', 'user');

-- اضافه کردن سرویس‌های نمونه
INSERT INTO services (name, description, url, status, uptime_percentage, response_time_avg, owner_id) 
SELECT 
    'وب‌سایت اصلی',
    'سایت اصلی شرکت',
    'https://example.com',
    'operational',
    99.95,
    120,
    id FROM users WHERE username = 'admin'
UNION ALL
SELECT 
    'API سرویس',
    'API عمومی برای توسعه‌دهندگان',
    'https://api.example.com',
    'operational',
    99.80,
    85,
    id FROM users WHERE username = 'admin'
UNION ALL
SELECT 
    'پایگاه داده',
    'سرور PostgreSQL اصلی',
    'postgres://db.example.com',
    'degraded',
    98.50,
    250,
    id FROM users WHERE username = 'operator1';

-- اضافه کردن یک حادثه نمونه
INSERT INTO incidents (service_id, title, description, severity, status, created_by, is_public)
SELECT 
    s.id,
    'کندی در پاسخ‌دهی',
    'سرور دیتابیس با افزایش ترافیک مواجه شده است',
    'medium',
    'monitoring',
    u.id,
    true
FROM services s, users u 
WHERE s.name = 'پایگاه داده' AND u.username = 'operator1'
LIMIT 1;

-- اضافه کردن آپدیت برای حادثه
INSERT INTO incident_updates (incident_id, message, status, created_by)
SELECT 
    i.id,
    'تیم فنی در حال بررسی مشکل است',
    'investigating',
    u.id
FROM incidents i, users u
WHERE i.title = 'کندی در پاسخ‌دهی' AND u.username = 'operator1'
LIMIT 1;

-- اضافه کردن متریک‌های نمونه
INSERT INTO service_metrics (service_id, response_time, status_code, is_up, checked_at)
SELECT 
    id,
    120 + (random() * 50)::INTEGER,
    200,
    true,
    CURRENT_TIMESTAMP - (interval '1 minute' * generate_series)
FROM services, generate_series(1, 10);
