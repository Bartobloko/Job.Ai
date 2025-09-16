import express, { Response } from 'express';
import { connection } from '../../database/database';
import decodeJWT from '../../middleware/decodeJWT';
import { AuthenticatedRequest } from '../../../types';
import { analyzeAllFakeJobsWithProfile } from '../../services/aiService';

const router = express.Router();

interface TestResult {
  jobId: number;
  jobDescription: string;
  chatResponse: string;
  isApproved: boolean;
}

interface TestResponse {
  profileId: number;
  profileName: string;
  results: TestResult[];
  summary: {
    total: number;
    approved: number;
    rejected: number;
  };
}

// POST: Test a profile against all fake jobs
router.post('/test/:profile_id', decodeJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: accountId } = req.user;
  const { profile_id } = req.params;

  try {
    // First verify the profile belongs to the user
    const profileQuery = 'SELECT id, name FROM bot_profiles WHERE id = ? AND account_id = ?';
    
    connection.query(profileQuery, [profile_id, accountId], async (err: any, profileResults: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (profileResults.length === 0) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const profile = profileResults[0];

      try {
        // Get all fake jobs for context
        const jobsQuery = 'SELECT fake_job_id, fake_job_description FROM fake_jobs';
        
        connection.query(jobsQuery, async (err: any, jobsResults: any[]) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          try {
            // Run the analysis
            const analysisResults = await analyzeAllFakeJobsWithProfile(parseInt(profile_id), accountId);
            
            // Map results with job descriptions
            const testResults: TestResult[] = analysisResults.map(result => {
              const job = jobsResults.find(j => j.fake_job_id === result.jobId);
              return {
                jobId: result.jobId,
                jobDescription: job ? job.fake_job_description : 'Job not found',
                chatResponse: result.chatResponse,
                isApproved: result.isApproved
              };
            });

            // Calculate summary
            const summary = {
              total: testResults.length,
              approved: testResults.filter(r => r.isApproved).length,
              rejected: testResults.filter(r => !r.isApproved).length
            };

            const response: TestResponse = {
              profileId: parseInt(profile_id),
              profileName: profile.name,
              results: testResults,
              summary
            };

            res.status(200).json(response);
          } catch (analysisError: any) {
            console.error('Error during profile testing:', analysisError);
            res.status(500).json({ 
              error: 'Error during profile testing', 
              details: analysisError.message 
            });
          }
        });
      } catch (error: any) {
        console.error('Error fetching fake jobs:', error);
        res.status(500).json({ error: 'Error fetching fake jobs for testing' });
      }
    });
  } catch (error: any) {
    console.error('Error in profile testing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Get all fake jobs (for frontend to display/manage)
router.get('/fake-jobs', decodeJWT, (req: AuthenticatedRequest, res: Response): void => {
  const sql = "SELECT fake_job_id as id, fake_job_description as description FROM fake_jobs ORDER BY fake_job_id";
  connection.query(sql, (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(results);
  });
});

// POST: Add a new fake job for testing
router.post('/fake-jobs', decodeJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { description } = req.body;

  if (!description || description.trim() === '') {
    res.status(400).json({ error: 'Job description is required' });
    return;
  }

  const sql = "INSERT INTO fake_jobs (fake_job_description) VALUES (?)";
  connection.query(sql, [description.trim()], (err: any, result: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.status(201).json({ 
      id: result.insertId,
      description: description.trim(),
      message: "Fake job created successfully" 
    });
  });
});

// DELETE: Remove a fake job
router.delete('/fake-jobs/:job_id', decodeJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { job_id } = req.params;

  const sql = "DELETE FROM fake_jobs WHERE fake_job_id = ?";
  connection.query(sql, [job_id], (err: any, result: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Fake job not found" });
      return;
    }
    
    res.status(200).json({ message: "Fake job deleted successfully" });
  });
});

export default router;