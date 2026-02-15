// src/routes/users.js
import express from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// GET /api/users - لیست کاربران (فقط admin)
router.get('/', authenticate, async (req, res) => {
    try {
        const { role, search } = req.query;

        let sql = `
            SELECT id, username, email, role, created_at, updated_at
            FROM users
        `;
        const values = [];
        const conditions = [];

        if (role) {
            values.push(role);
            conditions.push(`role = $${values.length}`);
        }

        if (search) {
            values.push(`%${search}%`);
            conditions.push(`(username ILIKE $${values.length} OR email ILIKE $${values.length})`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC';

        const result = await query(sql, values);

        res.json({
            success: true,
            data: { users: result.rows },
            message: 'Users retrieved successfully'
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// GET /api/users/:id - یک کاربر
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: { user: result.rows[0] },
            message: 'User retrieved successfully'
        });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// POST /api/users - ایجاد کاربر جدید (فقط admin)
router.post('/', authenticate, async (req, res) => {
    try {
        const { username, email, password, role = 'viewer' } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'username, email and password are required' });
        }

        // چک تکراری نبودن
        const existing = await query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Username or email already exists' });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const result = await query(
            `INSERT INTO users (username, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, username, email, role, created_at`,
            [username, email, password_hash, role]
        );

        res.status(201).json({
            success: true,
            data: { user: result.rows[0] },
            message: 'User created successfully'
        });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// PATCH /api/users/:id - ویرایش کاربر
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password, role } = req.body;

        const updates = [];
        const values = [];

        if (username) {
            values.push(username);
            updates.push(`username = $${values.length}`);
        }
        if (email) {
            values.push(email);
            updates.push(`email = $${values.length}`);
        }
        if (role) {
            values.push(role);
            updates.push(`role = $${values.length}`);
        }
        if (password) {
            const hash = await bcrypt.hash(password, 12);
            values.push(hash);
            updates.push(`password_hash = $${values.length}`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);
        const sql = `
            UPDATE users SET ${updates.join(', ')}
            WHERE id = $${values.length}
            RETURNING id, username, email, role, created_at, updated_at
        `;

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: { user: result.rows[0] },
            message: 'User updated successfully'
        });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// DELETE /api/users/:id - حذف کاربر
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // نمی‌توان خودت را حذف کنی
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        const result = await query(
            'DELETE FROM users WHERE id = $1 RETURNING id, username',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: { user: result.rows[0] },
            message: 'User deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

export default router;
