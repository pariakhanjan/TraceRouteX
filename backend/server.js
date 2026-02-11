const express = require('express');
const { query } = require('./src/config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', async (req, res) => {
    const result = await query('SELECT NOW()');
    res.json({
        status: 'OK',
        db_time: result.rows[0].now
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
