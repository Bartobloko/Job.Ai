const express = require('express');
const connection = require('../../database/database'); // Import the database connection
const router = express.Router();

// CREATE: Add a new fake job
router.post('/', (req, res) => {
    const { fake_job_description } = req.body;

    // Validate input
    if (!fake_job_description) {
        return res.status(400).json({ error: "Fake job description is required" });
    }

    const sql = "INSERT INTO fake_jobs (fake_job_description) VALUES (?)";
    connection.query(sql, [fake_job_description], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Fake job created", fake_job_id: result.insertId });
    });
});

// READ: Get all fake jobs
router.get('/', (req, res) => {
    const sql = "SELECT * FROM fake_jobs";
    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// READ: Get a single fake job by ID
router.get('/:fake_job_id', (req, res) => {
    const { fake_job_id } = req.params;

    const sql = "SELECT * FROM fake_jobs WHERE fake_job_id = ?";
    connection.query(sql, [fake_job_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Fake job not found" });
        }
        res.status(200).json(result[0]);
    });
});

// UPDATE: Update a fake job by ID
router.put('/:fake_job_id', (req, res) => {
    const { fake_job_id } = req.params;
    const { fake_job_description } = req.body;

    // Validate input
    if (!fake_job_description) {
        return res.status(400).json({ error: "Fake job description is required" });
    }

    const sql = "UPDATE fake_jobs SET fake_job_description = ? WHERE fake_job_id = ?";
    connection.query(sql, [fake_job_description, fake_job_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Fake job not found" });
        }
        res.status(200).json({ message: "Fake job updated" });
    });
});

// DELETE: Delete a fake job by ID
router.delete('/:fake_job_id', (req, res) => {
    const { fake_job_id } = req.params;

    const sql = "DELETE FROM fake_jobs WHERE fake_job_id = ?";
    connection.query(sql, [fake_job_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Fake job not found" });
        }
        res.status(200).json({ message: "Fake job deleted" });
    });
});

module.exports = router;
