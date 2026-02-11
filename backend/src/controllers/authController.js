import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// تابع کمکی برای تولید توکن
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }

        // بررسی تکراری بودن
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists.'
            });
        }

        // هش کردن پسورد
        const hashedPassword = await bcrypt.hash(password, 10);

        // ثبت کاربر (نقش پیش‌فرض: user)
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role) 
       VALUES ($1, $2, $3, 'user') 
       RETURNING id, username, email, role`,
            [username, email, hashedPassword]
        );

        const user = result.rows[0];

        // تولید توکن
        const token = generateToken(user.id);

        // ارسال توکن در cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
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
                role: user.role
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

        // بررسی پسورد
        const isPasswordValid = await bcrypt.compare(password, user.password);

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
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

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

export const logout = (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Logout successful.'
    });
};

export const getMe = async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
};
