-- پاک‌سازی schema قبلی
DROP SCHEMA public CASCADE;
CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

GRANT CREATE, USAGE ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA public TO PUBLIC;

-- ========================================
-- تعریف ENUM Types
-- ========================================

-- نقش‌های کاربری: viewer, engineer, admin
CREATE TYPE user_role AS ENUM ('viewer', 'engineer', 'admin');

-- وضعیت سرویس: Up, Degraded, Down
CREATE TYPE service_status AS ENUM ('up', 'degraded', 'down');

-- وضعیت رخداد: open, resolved
CREATE TYPE incident_status AS ENUM ('open', 'resolved');

-- شدت رخداد: low, medium, high, critical
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- ========================================
-- جدول کاربران
-- ========================================
CREATE TABLE users
(
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) UNIQUE  NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    role          user_role           NOT NULL DEFAULT 'viewer',
    created_at    TIMESTAMP                    DEFAULT NOW(),
    updated_at    TIMESTAMP                    DEFAULT NOW()
);

-- ========================================
-- جدول سرویس‌ها
-- ========================================
CREATE TABLE services
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)   NOT NULL,
    description TEXT,
    status      service_status NOT NULL DEFAULT 'up',
    created_by  INTEGER        REFERENCES users (id) ON DELETE SET NULL,
    created_at  TIMESTAMP               DEFAULT NOW(),
    updated_at  TIMESTAMP               DEFAULT NOW()
);

-- ========================================
-- جدول رخدادها (Incidents)
-- ========================================
CREATE TABLE incidents
(
    id               SERIAL PRIMARY KEY,
    service_id       INTEGER           NOT NULL REFERENCES services (id) ON DELETE CASCADE,
    title            VARCHAR(255)      NOT NULL,
    description      TEXT              NOT NULL,
    severity         incident_severity NOT NULL,
    status           incident_status   NOT NULL DEFAULT 'open',
    is_published     BOOLEAN                    DEFAULT FALSE, -- برای نمایش در صفحه عمومی
    root_cause       TEXT,                                     -- خلاصه پایانی (Bonus)
    prevention_notes TEXT,                                     -- یادداشت‌های پیشگیری (Bonus)
    created_by       INTEGER           REFERENCES users (id) ON DELETE SET NULL,
    resolved_by      INTEGER           REFERENCES users (id) ON DELETE SET NULL,
    resolved_at      TIMESTAMP,
    created_at       TIMESTAMP                  DEFAULT NOW(),
    updated_at       TIMESTAMP                  DEFAULT NOW()
);

-- ========================================
-- جدول به‌روزرسانی‌های رخداد (خط زمانی)
-- ========================================
CREATE TABLE incident_updates
(
    id          SERIAL PRIMARY KEY,
    incident_id INTEGER NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
    message     TEXT    NOT NULL,
    created_by  INTEGER REFERENCES users (id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- جدول لاگ‌های حسابرسی (Bonus - امتیاز اضافی)
-- ========================================
CREATE TABLE audit_logs
(
    id          SERIAL PRIMARY KEY,
    actor_id    INTEGER      REFERENCES users (id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL, -- مثل: 'create_incident', 'update_service_status'
    entity_type VARCHAR(50)  NOT NULL, -- مثل: 'incident', 'service', 'user'
    entity_id   INTEGER,
    details     JSONB,                 -- اطلاعات اضافی به صورت JSON
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- ایندکس‌ها برای بهبود کارایی
-- ========================================
CREATE INDEX idx_incidents_service ON incidents (service_id);
CREATE INDEX idx_incidents_status ON incidents (status);
CREATE INDEX idx_incidents_severity ON incidents (severity);
CREATE INDEX idx_incident_updates_incident ON incident_updates (incident_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- ========================================
-- تابع و تریگرها برای به‌روزرسانی خودکار updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE
    ON users
    FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER services_updated_at
    BEFORE UPDATE
    ON services
    FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER incidents_updated_at
    BEFORE UPDATE
    ON incidents
    FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ========================================
-- داده‌های نمونه
-- ========================================

-- کاربران نمونه (رمز عبور: password123)
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@traceroutex.com', '$2a$12$sLfJCFQRzRDTAYtpzKEunudIsOhuyR9W6QLxFKE9.LT4CWaTRpWEG', 'admin'),
       ('engineer1', 'engineer@traceroutex.com', '$2a$12$.kv0nWZ.sQLLtCzIf6eMqOc6cca.AV/0.yukTNYgnAXGkbQEt6C7K', 'engineer'),
       ('viewer1', 'viewer@traceroutex.com', '$2a$12$/3dwoNhTdDswTUFSF/FF7.vF7LYAZowBjSjEGNNUA.mlu.5skxWyG', 'viewer');

-- سرویس‌های نمونه
INSERT INTO services (name, description, status, created_by)
VALUES ('Payment Service', 'سرویس پرداخت و تراکنش‌های مالی', 'up', 1),
       ('Authentication Service', 'سرویس احراز هویت کاربران', 'up', 1),
       ('Main Website', 'وب‌سایت اصلی شرکت', 'degraded', 1),
       ('Database Server', 'سرور پایگاه داده اصلی', 'up', 1);

-- رخدادهای نمونه
INSERT INTO incidents (service_id, title, description, severity, status, is_published, created_by)
VALUES (3, 'کندی در بارگذاری صفحات', 'صفحات با تاخیر بارگذاری می‌شوند. کاربران گزارش کندی داده‌اند.', 'medium', 'open',
        true, 2),
       (1, 'خطا در پردازش تراکنش‌ها', 'برخی تراکنش‌های پرداخت با خطا مواجه شده‌اند', 'high', 'resolved', true, 2);

-- به‌روزرسانی‌های رخداد (خط زمانی)
INSERT INTO incident_updates (incident_id, message, created_by)
VALUES (1, 'مشکل شناسایی شد. سرور دیتابیس تحت بررسی است.', 2),
       (1, 'کش Redis ریست شد. در حال مانیتور کردن وضعیت...', 2),
       (2, 'تیم فنی در حال بررسی لاگ‌های سرور پرداخت است', 2),
       (2, 'مشکل در ارتباط با Gateway پرداخت شناسایی شد', 2),
       (2, 'تنظیمات Gateway اصلاح شد. مشکل برطرف شده است', 2);

-- به‌روزرسانی وضعیت رخداد حل‌شده
UPDATE incidents
SET status           = 'resolved',
    resolved_by      = 2,
    resolved_at      = NOW(),
    root_cause       = 'مشکل در تنظیمات Gateway پرداخت',
    prevention_notes = 'مانیتورینگ بهتر Gateway و تنظیم آلارم برای خطاهای ارتباطی'
WHERE id = 2;
