const express = require('express');
const router = express.Router();
const connection = require('../../database/database'); // Database connection

// CREATE: Add a new account_stats record
router.post('/', (req, res) => {
    const {
        account_id,
        bot_activation_count = 0,
    } = req.body;

    const sql = `
        INSERT INTO account_stats (
            account_id,bot_activation_count,
        ) VALUES (?, ?)
    `;
    const values = [
        account_id,
        bot_activation_count,
    ];

    connection.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Account stats record created", id: result.insertId });
    });
});

// READ: Get all account_stats records
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM account_stats WHERE account_id = ?';
    connection.query(sql, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});




module.exports = router;
