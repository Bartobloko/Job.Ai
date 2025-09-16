import express, { Response } from 'express';
import { connection } from '../../database/database';
import { analyzeJobWithOllama, analyzeAllFakeJobs } from '../../services/aiService';
import { AuthenticatedRequest, Job } from '../../../types';

const router = express.Router();

// Import bot function - we'll need to convert this later
async function getJobDetails(accountId: number): Promise<void> {
  const { getJobDetails } = await import('../../bot/bot');
  return getJobDetails(accountId);
}

// Endpoint to start the bot, requires a valid JWT token
router.post('/start', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
  // Start the bot
  getJobDetails(req.user.id);
  res.json({ message: 'bot started' });
});

interface FakeJobTestBody {
  prompt: string;
  experience: string;
  blocked_keywords: string;
}

router.post('/fakeJobTest', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
  
  const { prompt, experience, blocked_keywords }: FakeJobTestBody = req.body;
  
  analyzeAllFakeJobs(prompt, experience, blocked_keywords)
    .then((results) => res.json({ message: 'Ai Test Completed', results }))
    .catch((error) => res.status(500).json({ message: 'Error during AI test', error: error.message }));
});

// Test a single job from the database
router.post('/testJob/:job_id', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }

  const { job_id } = req.params;

  const sql = "SELECT * FROM jobs WHERE id = ?";
  connection.query(sql, [job_id], (err: any, result: any[]) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching job from database', error: err.message });
      return;
    }
    if (result.length === 0) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    const job = result[0];
    const accountId = job.account_id;

    analyzeJobWithOllama(job, accountId)
      .then((analysis) => {
        if (!analysis) {
          res.status(500).json({ message: 'Error during job analysis' });
          return;
        }
        res.json({ message: 'Job analyzed successfully', job, analysis });
      })
      .catch((error) => {
        res.status(500).json({ message: 'Error during job analysis', error: error.message });
      });
  });
});

interface JobAnalysisResult {
  jobId: number;
  analysisResult?: string;
  message?: string;
}

// Test all jobs from the database
router.post('/testAllJobs', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }

  const sql = "SELECT * FROM jobs";
  connection.query(sql, (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching jobs from database', error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'No jobs found in the database' });
      return;
    }

    // Map over jobs and analyze each with analyzeJobWithOllama
    const jobAnalyses = results.map((job): Promise<JobAnalysisResult> => {
      const jobId = job.id!;
      const accountId = job.account_id;

      // Proceed with the analysis directly (no checking for already analyzed)
      return analyzeJobWithOllama(job, accountId)
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

interface BotLog {
  id: number;
  account_id: number;
  action_type: string;
  description: string;
  created_at: Date;
}

router.get('/logs', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }

  const sql = "SELECT * FROM bot_logs WHERE account_id = ? ORDER BY created_at DESC";
  connection.query(sql, [req.user.id], (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching bot logs', error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'No bot logs found' });
      return;
    }
    res.json(results);
  });
});

export default router;