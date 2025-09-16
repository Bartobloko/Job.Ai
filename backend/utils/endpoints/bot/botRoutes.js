const express = require('express');
const { getJobDetails } = require('../../bot/bot');
const connection = require('../../database/database'); // Import the database connection
const aiService = require("../../services/aiService");
const jobService = require('../../services/jobService'); // Import the function
const router = express.Router();

// Endpoint to start the bot, requires a valid JWT token
router.post('/start', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Invalid token' });
    }
    // Start the bot
    getJobDetails(req.user.id);
    res.json({ message: 'bot started' });
});

router.post('/fakeJobTest', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Invalid token' });
    }
    aiService.analyzeAllFakeJobs(req.body.prompt, req.body.experience, req.body.blocked_keywords)
        .then((results) => res.json({ message: 'Ai Test Completed', results }))
        .catch((error) => res.status(500).json({ message: 'Error during AI test', error: error.message }));
});

// Test a single job from the database
router.post('/testJob/:job_id', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const { job_id } = req.params;

    const sql = "SELECT * FROM jobs WHERE id = ?";
    connection.query(sql, [job_id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching job from database', error: err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const job = result[0];
        const accountId = job.account_id;

        aiService.analyzeJobWithOllama(job, accountId)
            .then((analysis) => {
                if (!analysis) {
                    return res.status(500).json({ message: 'Error during job analysis' });
                }
                res.json({ message: 'Job analyzed successfully', job, analysis });
            })
            .catch((error) => {
                return res.status(500).json({ message: 'Error during job analysis', error: error.message });
            });
    });
});

// Test all jobs from the database
router.post('/testAllJobs', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const sql = "SELECT * FROM jobs";
    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching jobs from database', error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'No jobs found in the database' });
        }

        // Map over jobs and analyze each with analyzeJobWithOllama
        const jobAnalyses = results.map((job) => {
            const jobId = job.id;
            const accountId = job.account_id;

            // Proceed with the analysis directly (no checking for already analyzed)
            return aiService.analyzeJobWithOllama(job, accountId)
                .then((analysisResult) => ({
                    jobId,
                    analysisResult
                }))
                .catch((err) => {
                    return { jobId, message: `Error during analysis: ${err.message}` };
                });
        });

        // Wait for all analyses to complete
        Promise.all(jobAnalyses)
            .then((analysisResults) => {
                // Only include jobs with analysis results
                const newAnalysisResults = analysisResults.filter(result => result.analysisResult);
                res.json({ message: 'All jobs processed', analysisResults: newAnalysisResults });
            })
            .catch((error) => res.status(500).json({ message: 'Error during jobs analysis', error: error.message }));
    });
});

router.get('/logs', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const sql = "SELECT * FROM bot_logs WHERE account_id = ? ORDER BY created_at DESC";
    connection.query(sql, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching bot logs', error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'No bot logs found' });
        }
        res.json( results );
    });
});

module.exports = router;