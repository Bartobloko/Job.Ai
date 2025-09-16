const decodeJWT = require("../../middleware/decodeJWT");
const express = require("express"); // Import the database connection
const connection = require('../../database/database');
const router = express.Router();


// GET: Get account settings by account
router.get('/', decodeJWT, (req, res) => {
    const { id } = req.user; // User's account ID from the JWT token

    // Query the account_settings table using the account_id
    const sql = "SELECT * FROM account_settings WHERE account_id = ?";
    connection.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Settings not found for this user" });
        }

        // Return the settings details
        const settings = results[0]; // Assuming the query only returns one row since account_id is unique
        res.status(200).json({
            experience_level: settings.experience_level,
            custom_prompt: settings.custom_prompt,
            blocked_keywords: settings.blocked_keywords,
            first_name: settings.first_name,
            last_name: settings.last_name,
            about_me: settings.about_me,
            cv_path: settings.cv_path,
            linkedIn_li_at_cookie: settings.linkedIn_li_at_cookie,
            ai_model: settings.ai_model,
            updated_at: settings.updated_at
        });
    });
})

router.put('/', decodeJWT, (req, res) => {
    const { id } = req.user;
    const { experience_level, custom_prompt, blocked_keywords, first_name, last_name, about_me, cv_path, linkedIn_li_at_cookie, ai_model } = req.body;
    const sql = "UPDATE account_settings SET experience_level = ?, custom_prompt = ?, blocked_keywords = ?, first_name = ?, last_name = ?, about_me = ?, cv_path = ?, linkedIn_li_at_cookie = ?, ai_model = ? WHERE account_id = ?";
    connection.query(sql, [experience_level, custom_prompt, blocked_keywords, first_name, last_name, about_me, cv_path, linkedIn_li_at_cookie, ai_model, id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: "Settings updated successfully" });
    });
})


module.exports = router;