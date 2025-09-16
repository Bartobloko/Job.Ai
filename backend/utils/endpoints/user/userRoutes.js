const express = require('express');
const jwt = require('jsonwebtoken');
const connection = require('../../database/database');
const decodeJWT = require("../../middleware/decodeJWT"); // Import the database connection
const router = express.Router();
const secretKey = 'your_secret_key'; // Replace with your secret key

// CREATE: Add a new account
router.post('/', (req, res) => {
    const { username } = req.body;

    // Validate input
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    // Start database transaction
    connection.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const sqlInsertAccount = "INSERT INTO accounts (username) VALUES (?)";
        connection.query(sqlInsertAccount, [username], (err, result) => {
            if (err) {
                return connection.rollback(() => {
                    res.status(500).json({ error: err.message });
                });
            }

            const accountId = result.insertId;

            // Insert into account_settings
            const sqlInsertSettings = `
                INSERT INTO account_settings (
                    account_id 
                ) VALUES (?)`;

            connection.query(sqlInsertSettings, [accountId], (err) => {
                if (err) {
                    return connection.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }

                // Insert into account_stats
                const sqlInsertStats = `
                    INSERT INTO account_stats (
                        account_id,bot_activation_count,
                    ) VALUES (?, 0)`;

                connection.query(sqlInsertStats, [accountId], (err) => {
                    if (err) {
                        return connection.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }

                    // Commit transaction
                    connection.commit(err => {
                        if (err) {
                            return connection.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }

                        res.status(201).json({
                            message: "Account created",
                            account_id: accountId
                        });
                    });
                });
            });
        });
    });
});

// LOGIN: Authenticate a user by username and generate a JWT
router.post('/login', (req, res) => {
    const { username } = req.body;

    // Validate input
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    const sql = "SELECT * FROM accounts WHERE username = ?";
    connection.query(sql, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // User exists, generate JWT
        const user = results[0];
        const token = jwt.sign({
            id: user.id,
            username: user.username
        }, secretKey);

        res.status(200).json({
            message: "Login successful",
            token,
        });
    });
});

// READ: Get all accounts
router.get('/', (req, res) => {
    const sql = "SELECT * FROM accounts";
    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// DELETE: Delete an account by ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM accounts WHERE id = ?";
    connection.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Account not found" });
        }
        res.status(200).json({ message: "Account deleted" });
    });
});

router.use(decodeJWT);

router.get('/me', decodeJWT, (req, res) => {
    const { id, username } = req.user;

    // Fetch the user details from the database (optional, you can return just the data from the token)
    const sql = "SELECT * FROM accounts WHERE id = ?";
    connection.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Return the user details (excluding password or sensitive information)
        const user = results[0];
        res.status(200).json({
            id: user.id,
            username: user.username,
            created_at: user.created_at, // Example of other info you might want to include
        });
    });
});

router.get('/botStats', decodeJWT, (req, res) => {
    const { id } = req.user;
    const sql = "SELECT * FROM account_stats WHERE account_id = ?";
    connection.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "No stats found for this account" });
        }
        res.status(200).json(results[0]);
    });
});

module.exports = router;
