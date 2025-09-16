const express = require('express');
const connection = require('../../database/database');
const router = express.Router();

// READ: Get all jobs for the authenticated user
router.get('/', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    const userId = req.user.id;

    const sql = `
        SELECT j.*, COALESCE(gr.is_approved, 0) AS is_approved 
        FROM jobs j
        LEFT JOIN gpt_responses gr ON j.id = gr.job_id AND gr.account_id = ?
        WHERE j.account_id = ?
    `;

    connection.query(sql, [userId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});


// READ: Get only applicable jobs for the authenticated user
router.get('/applicable', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const userId = req.user.id;
    const sql = `
        SELECT 
            jobs.*, 
            (jobs.haveApplied = 0) AS isApproved 
        FROM 
            jobs
        INNER JOIN 
            gpt_responses 
        ON 
            jobs.id = gpt_responses.job_id
        WHERE 
            jobs.account_id = ? 
            AND jobs.haveApplied = 0 
            AND gpt_responses.is_approved = 1
    `;

    connection.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});


// READ: Get jobs created today for the authenticated user
router.get('/today', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    const userId = req.user.id;

    const sql = `
        SELECT j.*, COALESCE(gr.is_approved, 0) AS is_approved, gr.response 
        FROM jobs j
        LEFT JOIN gpt_responses gr 
            ON j.id = gr.job_id AND gr.account_id = ?
        WHERE j.account_id = ? 
        AND DATE(j.created_at) = CURDATE()
    `;

    connection.query(sql, [userId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// get stats of jobs
router.get('/summary', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const userId = req.user.id;
    const sqlTotalJobs = "SELECT COUNT(*) AS totalJobs FROM jobs WHERE account_id = ?";
    const sqlTodayJobs = "SELECT COUNT(*) AS todayJobs FROM jobs WHERE account_id = ? AND DATE(created_at) = CURDATE()";
    const sqlApplicableJobs = `
        SELECT COUNT(*) AS applicableJobs 
        FROM jobs 
        INNER JOIN gpt_responses 
        ON jobs.id = gpt_responses.job_id 
        WHERE jobs.account_id = ? 
        AND jobs.haveApplied = 0 
        AND gpt_responses.is_approved = 1
    `;
    const sqlAppliedJobs = "SELECT COUNT(*) AS appliedJobs FROM jobs WHERE account_id = ? AND haveApplied = 1";

    connection.query(sqlTotalJobs, [userId], (err, totalResult) => {
        if (err) return res.status(500).json({ error: err.message });

        connection.query(sqlTodayJobs, [userId], (err, todayResult) => {
            if (err) return res.status(500).json({ error: err.message });

            connection.query(sqlApplicableJobs, [userId], (err, applicableResult) => {
                if (err) return res.status(500).json({ error: err.message });

                connection.query(sqlAppliedJobs, [userId], (err, appliedResult) => {
                    if (err) return res.status(500).json({ error: err.message });

                    res.status(200).json({
                        totalJobs: totalResult[0].totalJobs,
                        todayJobs: todayResult[0].todayJobs,
                        applicableJobs: applicableResult[0].applicableJobs,
                        appliedJobs: appliedResult[0].appliedJobs
                    });
                });
            });
        });
    });
});

// DELETE: Delete a job by ID (and its associated GPT responses) for the authenticated user
router.delete('/job/:job_id', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    const userId = req.user.id;
    const { job_id } = req.params;

    // Ensure the job belongs to the authenticated user before deleting
    const deleteResponsesSql = "DELETE FROM gpt_responses WHERE job_id = ?";
    const deleteJobSql = "DELETE FROM jobs WHERE id = ? AND account_id = ?";

    connection.query(deleteResponsesSql, [job_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        connection.query(deleteJobSql, [job_id, userId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ message: "Job not found or unauthorized" });
            res.status(200).json({ message: "Job and associated GPT responses deleted" });
        });
    });
});

// DELETE: Delete all GPT responses for a specific job for the authenticated user
router.delete('/responses/:job_id', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    const userId = req.user.id;
    const { job_id } = req.params;

    // Ensure the job belongs to the authenticated user before deleting responses
    const sql = `
        DELETE gpt_responses 
        FROM gpt_responses 
        JOIN jobs ON gpt_responses.job_id = jobs.id
        WHERE gpt_responses.job_id = ? AND jobs.account_id = ?
    `;
    connection.query(sql, [job_id, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error deleting GPT responses', error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No GPT responses found for this job or unauthorized' });
        }

        res.status(200).json({ message: 'All GPT responses for the job deleted' });
    });
});

// DELETE: Delete all GPT responses for the authenticated user
router.delete('/responses', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    const userId = req.user.id; // Dynamic user ID

    const sql = "DELETE FROM gpt_responses WHERE account_id = ?";
    connection.query(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error deleting GPT responses', error: err.message });
        }

        // Check if any rows were affected (deleted)
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No GPT responses found for this user' });
        }

        res.status(200).json({ message: 'All GPT responses for the user deleted' });
    });
});


module.exports = router;
