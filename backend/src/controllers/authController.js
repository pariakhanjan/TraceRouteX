import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// تابع کمکی برای تولید توکن
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required.'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format.'
            });
        }

        // Password strength validation (minimum 6 characters)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        // ✅ FIX: نقش پیش‌فرض 'viewer' (مطابق ENUM دیتابیس)
        const userRole = role || 'viewer';

        // Validate role against allowed values
        const allowedRoles = ['viewer', 'engineer', 'admin'];
        if (!allowedRoles.includes(userRole)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${allowedRoles.join(', ')}`
            });
        }

        // بررسی تکراری بودن
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or username already exists.'
            });
        }

        // هش کردن پسورد
        const hashedPassword = await bcrypt.hash(password, 10);

        // ثبت کاربر با نقش صحیح
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, username, email, role, created_at`,
            [username, email, hashedPassword || username, userRole]
        );

        const user = result.rows[0];

        // 🎁 Bonus: Audit Log
        try {
            await pool.query(
                `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4)`,
                [user.id, 'create_user', 'user', user.id]
            );
        } catch (auditError) {
            console.error('Audit log error:', auditError.message);
            // ادامه حتی اگر audit fail شد
        }

        // تولید توکن
        const token = generateToken(user.id);

        // ارسال توکن در cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 روز
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration.'
        });
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // یافتن کاربر
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        const user = result.rows[0];

        // بررسی پسورد (فیلد صحیح password_hash)
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // تولید توکن
        const token = generateToken(user.id);

        // ارسال توکن در cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // 🎁 Bonus: Audit Log
        try {
            await pool.query(
                `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
                 VALUES ($1, $2, $3, $4)`,
                [user.id, 'login', 'user', user.id]
            );
        } catch (auditError) {
            console.error('Audit log error:', auditError.message);
        }

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login.'
        });
    }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Logout successful.'
    });
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
};
