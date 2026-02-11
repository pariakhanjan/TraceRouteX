
--DROP SCHEMA public;

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
CREATE INDEX idx_incidents_service ON incidents(service_id);
CREATE INDEX idx_incidents_status ON incidents(status);
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

-- تریگرها برای به‌روزرسانی خودکار
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
