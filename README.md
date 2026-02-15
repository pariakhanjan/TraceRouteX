# 🌐 TraceRouteX - سامانه مدیریت رخداد و وضعیت سرویس‌ها

## 📖 معرفی پروژه

**TraceRouteX** یک سامانه تحت وب برای مدیریت وضعیت سرویس‌های IT و پیگیری رخدادهای عملیاتی (Incident Management) است. این سیستم امکان تعریف سرویس‌های مختلف، ثبت اختلالات، مستندسازی روند رسیدگی و نمایش لحظه‌ای وضعیت سیستم را فراهم می‌کند.

### 🎯 اهداف اصلی
- ایجاد مرجع متمرکز برای مشاهده وضعیت سیستم
- ثبت شفاف فرآیند رسیدگی به مشکلات
- بررسی تاریخچه رخدادها و اقدامات انجام‌شده
- نمایش عمومی وضعیت (Public Status Page) بدون نیاز به احراز هویت

## 🛠️ تکنولوژی‌های استفاده شده
- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Authentication:** JWT
- **Authorization:** RBAC

## 📦 پیش‌نیازها
- Node.js v14+
- PostgreSQL v12+
- npm یا yarn


---

## 🏗️ معماری و ساختار پروژه

### 📁 ساختار کلی
TraceRouteX/
│
│ ├── service-detail.html # جزئیات سرویس

│ ├── public-status.html # صفحه عمومی وضعیت

│ └── error-handler.html # صفحه خطا

│

└── backend/ # بخش سرور (API)

├── server.js # نقطه ورود اصلی (211 خط)

├── .env # تنظیمات محیطی (نباید commit شود)

├── package.json # وابستگی‌های Node.js

├── package-lock.json

│

└── src/

├── config/

│ └── db.js # پیکربندی PostgreSQL

│

├── middleware/

│ ├── auth.js # احراز هویت JWT (74 خط)

│ └── rbac.js # کنترل دسترسی نقش‌محور

│

├── routes/

│ ├── auth.js # مسیرهای احراز هویت

│ ├── services.js # مسیرهای سرویس‌ها

│ ├── incidents.js # مسیرهای رخدادها

│ └── public.js # مسیرهای عمومی (بدون Auth)

│

├── controllers/

│ ├── authController.js # منطق احراز هویت

│ ├── serviceController.js # منطق سرویس‌ها

│ ├── incidentController.js # منطق رخدادها

│ └── publicController.js # منطق API عمومی

│

└── utils/

└── auditLogger.js # لاگ تغییرات (Audit Trail)

👥 نقش‌ها و سطوح دسترسی
پروژه از Role-Based Access Control (RBAC) استفاده می‌کند:

نقش	دسترسی‌ها
Viewer	- مشاهده لیست سرویس‌ها و وضعیت فعلی<br>- مشاهده رخدادهای منتشرشده<br>- عدم امکان ایجاد/ویرایش
Engineer	- همه دسترسی‌های Viewer<br>- ایجاد رخداد جدید<br>- ثبت به‌روزرسانی رخدادها<br>- تغییر وضعیت رخداد (باز/حل‌شده)<br>- تغییر وضعیت سرویس (Up/Degraded/Down)
Admin	- همه دسترسی‌های Engineer<br>- مدیریت کاربران (ایجاد/حذف/تغییر نقش)<br>- ایجاد و حذف سرویس‌ها<br>- دسترسی به Audit Logs
🛠️ تکنولوژی‌های استفاده‌شده
Backend
Runtime: Node.js v14+
Framework: Express.js
Database: PostgreSQL v12+
Authentication: JWT (JSON Web Token) با تاریخ انقضا
Token Storage: HttpOnly Cookie یا Authorization Header
Password Hashing: bcrypt
Environment Variables: dotenv
Frontend
HTML5 (Semantic)
CSS3 (Responsive با Flexbox/Grid)
JavaScript (ES6+ Vanilla - بدون فریم‌ورک)
API Communication: Fetch API
Architecture: SPA-like با Routing سمت کلاینت
Database Schema
جداول اصلی:
users - کاربران و نقش‌ها
services - سرویس‌های تعریف‌شده
incidents - رخدادها
incident_updates - به‌روزرسانی‌های رخدادها
audit_logs - لاگ تغییرات
📦 پیش‌نیازها
قبل از اجرای پروژه، نصب موارد زیر الزامی است:

✅ Node.js v14 یا بالاتر (دانلود)

✅ PostgreSQL v12 یا بالاتر (دانلود)

✅ npm یا yarn (برای مدیریت پکیج‌ها)

✅ Git (برای کلون پروژه)

🚀 راهنمای نصب و اجرا
1️⃣ کلون پروژه
bash

git clone <repository-url>

cd TraceRouteX

2️⃣ راه‌اندازی دیتابیس PostgreSQL
ایجاد دیتابیس:
bash

ورود به PostgreSQL
psql -U postgres

ایجاد دیتابیس
CREATE DATABASE traceroutex;

خروج
\q

اجرای اسکریپت Schema:
bash

اجرای فایل ScriptDLL.sql
psql -U postgres -d traceroutex -f frontend/ScriptDLL.sql

نکته: اسکریپت شامل 179 خط است و تمام جداول، روابط و داده‌های پیش‌فرض را ایجاد می‌کند.

تأیید نصب:
bash

psql -U postgres -d traceroutex -c “\dt”

باید جداول users, services, incidents, incident_updates, audit_logs نمایش داده شوند
3️⃣ نصب وابستگی‌های Backend
bash

cd backend

npm install

پکیج‌های نصب‌شده:

express
pg (PostgreSQL client)
dotenv
bcryptjs
jsonwebtoken
cors
cookie-parser
4️⃣ تنظیم متغیرهای محیطی
فایل .env را در پوشه backend ایجاد کنید:

env

Database Configuration
DB_HOST=localhost

DB_PORT=5432

DB_NAME=traceroutex

DB_USER=postgres

DB_PASSWORD=your_postgres_password

JWT Secret (کلید امنیتی - حتماً تغییر دهید!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

JWT_EXPIRES_IN=24h

Server
PORT=3000

NODE_ENV=development

CORS (فقط در Development)
CORS_ORIGIN=http://127.0.0.1:5500

⚠️ هشدار امنیتی: فایل .env را هرگز در Git commit نکنید!

5️⃣ اجرای Backend
bash

در پوشه backend
npm run dev

یا
node server.js

خروجی موفق:

✅ Connected to PostgreSQL database

## 👨‍💻 توسعه‌دهندگان
- پریا خان جان
- مهتا رنجبر دامغانی

## 👨‍💻 تست های پست من
- https://pariakhanjan-5002732.postman.co/workspace/Paria's-Workspace~4efd5aba-9084-44ed-8275-2c877b61a6d7/collection/50437959-2fb475c3-2838-4296-9b3c-190a5d4b5064?action=share&creator=50437959