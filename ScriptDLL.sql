DROP SCHEMA public CASCADE;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public
    IS 'standard public schema';

GRANT CREATE, USAGE
    ON SCHEMA public
    TO pg_database_owner;

GRANT USAGE
    ON SCHEMA public
    TO PUBLIC;

-- فعال‌سازی UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- جدول کاربران
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       username VARCHAR(50) UNIQUE NOT NULL,
                       email VARCHAR(100) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       full_name VARCHAR(100),
                       role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'operator', 'user')),
                       is_active BOOLEAN DEFAULT true,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول سرویس‌ها
CREATE TABLE services (
                          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                          name VARCHAR(100) NOT NULL,
                          description TEXT,
                          url VARCHAR(255),
                          type VARCHAR(50), -- نوع سرویس (web, api, database, network, etc.)
                          ip_address VARCHAR(45), -- آدرس IP (IPv4 یا IPv6)
                          status VARCHAR(20) DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'down', 'maintenance')),
                          uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
                          response_time_avg INTEGER, -- میلی‌ثانیه
                          owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
                          is_public BOOLEAN DEFAULT true,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول حوادث (Incidents)
CREATE TABLE incidents (
                           id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                           service_id UUID REFERENCES services(id) ON DELETE CASCADE,
                           title VARCHAR(200) NOT NULL,
                           description TEXT,
                           severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
                           status VARCHAR(20) DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
                           reported_by UUID REFERENCES users(id) ON DELETE SET NULL, -- کاربری که حادثه را گزارش داده
                           started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           resolved_at TIMESTAMP,
                           created_by UUID REFERENCES users(id) ON DELETE SET NULL,
                           is_public BOOLEAN DEFAULT true,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول به‌روزرسانی‌های حادثه
CREATE TABLE incident_updates (
                                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
                                  message TEXT NOT NULL,
                                  status VARCHAR(20) CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
                                  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول متریک‌های سرویس (برای نمودارها)
CREATE TABLE service_metrics (
                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 service_id UUID REFERENCES services(id) ON DELETE CASCADE,
                                 response_time INTEGER NOT NULL, -- میلی‌ثانیه
                                 status_code INTEGER,
                                 is_up BOOLEAN DEFAULT true,
                                 checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول اشتراک‌ها (Subscriptions) - برای اعلان‌ها
CREATE TABLE subscriptions (
                               id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                               user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                               service_id UUID REFERENCES services(id) ON DELETE CASCADE,
                               notification_email VARCHAR(100),
                               is_active BOOLEAN DEFAULT true,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               UNIQUE(user_id, service_id)
);

-- ایندکس‌ها برای بهبود کارایی
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_type ON services(type);
CREATE INDEX idx_services_ip ON services(ip_address);
CREATE INDEX idx_incidents_service ON incidents(service_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_metrics_service_time ON service_metrics(service_id, checked_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- تابع به‌روزرسانی خودکار updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تریگرهای به‌روزرسانی خودکار
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- اضافه کردن کاربران نمونه
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@traceroutex.com', '$2b$10$rX8V9KHhOxJqE9yN5zKxLO8FqGxZ5hPwJ3MqYnF1vLKzGxE5rQx8S', 'مدیر سیستم', 'admin'),
('operator1', 'operator@traceroutex.com', '$2b$10$rX8V9KHhOxJqE9yN5zKxLO8FqGxZ5hPwJ3MqYnF1vLKzGxE5rQx8S', 'اپراتور یک', 'operator'),
('user1', 'user@example.com', '$2b$10$rX8V9KHhOxJqE9yN5zKxLO8FqGxZ5hPwJ3MqYnF1vLKzGxE5rQx8S', 'کاربر یک', 'user');

-- اضافه کردن سرویس‌های نمونه
INSERT INTO services (name, description, url, type, ip_address, status, uptime_percentage, response_time_avg, owner_id)
SELECT
    'وب‌سایت اصلی',
    'سایت اصلی شرکت',
    'https://example.com',
    'web',
    '192.168.1.10',
    'operational',
    99.95,
    120,
    id FROM users WHERE username = 'admin'
UNION ALL
SELECT
    'API سرویس',
    'API عمومی برای توسعه‌دهندگان',
    'https://api.example.com',
    'api',
    '192.168.1.20',
    'operational',
    99.80,
    85,
    id FROM users WHERE username = 'admin'
UNION ALL
SELECT
    'پایگاه داده',
    'سرور PostgreSQL اصلی',
    'postgres://db.example.com',
    'database',
    '192.168.1.30',
    'degraded',
    98.50,
    250,
    id FROM users WHERE username = 'operator1';

-- اضافه کردن یک حادثه نمونه
INSERT INTO incidents (service_id, title, description, severity, status, reported_by, created_by, is_public)
SELECT
    s.id,
    'کندی در پاسخ‌دهی',
    'سرور دیتابیس با افزایش ترافیک مواجه شده است',
    'medium',
    'monitoring',
    u.id,
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
