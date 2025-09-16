import express, { Response } from 'express';
import { connection } from '../../database/database';
import { AuthenticatedRequest, Job, DatabaseResult } from '../../../types';

const router = express.Router();

interface JobWithApproval extends Job {
  is_approved: number;
}

interface JobSummary {
  totalJobs: number;
  todayJobs: number;
  applicableJobs: number;
  appliedJobs: number;
}

// READ: Get all jobs for the authenticated user
router.get('/', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
  }
  const userId = req.user.id;

  const sql = `
    SELECT j.*, COALESCE(gr.is_approved, 0) AS is_approved 
    FROM jobs j
    LEFT JOIN gpt_responses gr ON j.id = gr.job_id AND gr.account_id = ?
    WHERE j.account_id = ?
  `;

  connection.query(sql, [userId, userId], (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(results);
  });
});

// READ: Get only applicable jobs for the authenticated user
router.get('/applicable', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
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

  connection.query(sql, [userId], (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(results);
  });
});

// READ: Get jobs created today for the authenticated user
router.get('/today', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
  }
  const userId = req.user.id;

  const sql = `
    SELECT j.*, COALESCE(gr.is_approved, 0) AS is_approved 
    FROM jobs j
    LEFT JOIN gpt_responses gr ON j.id = gr.job_id AND gr.account_id = ?
    WHERE j.account_id = ? AND DATE(j.created_at) = CURDATE()
  `;

  connection.query(sql, [userId, userId], (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(results);
  });
});

// Get stats of jobs
router.get('/summary', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
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

  connection.query(sqlTotalJobs, [userId], (err, totalResult: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    connection.query(sqlTodayJobs, [userId], (err, todayResult: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      connection.query(sqlApplicableJobs, [userId], (err, applicableResult: any[]) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        connection.query(sqlAppliedJobs, [userId], (err, appliedResult: any[]) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          const summary: JobSummary = {
            totalJobs: totalResult[0]?.totalJobs || 0,
            todayJobs: todayResult[0]?.todayJobs || 0,
            applicableJobs: applicableResult[0]?.applicableJobs || 0,
            appliedJobs: appliedResult[0]?.appliedJobs || 0
          };

          res.status(200).json(summary);
        });
      });
    });
  });
});

// DELETE: Delete a job by ID (and its associated GPT responses) for the authenticated user
router.delete('/job/:job_id', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
  }
  const userId = req.user.id;
  const { job_id } = req.params;

  // Ensure the job belongs to the authenticated user before deleting
  const deleteResponsesSql = "DELETE FROM gpt_responses WHERE job_id = ?";
  const deleteJobSql = "DELETE FROM jobs WHERE id = ? AND account_id = ?";

  connection.query(deleteResponsesSql, [job_id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    connection.query(deleteJobSql, [job_id, userId], (err, result: any) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (result.affectedRows === 0) {
        res.status(404).json({ message: "Job not found or unauthorized" });
        return;
      }
      res.status(200).json({ message: "Job and associated GPT responses deleted" });
    });
  });
});

// DELETE: Delete all GPT responses for a specific job for the authenticated user
router.delete('/responses/:job_id', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
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
  connection.query(sql, [job_id, userId], (err, result: any) => {
    if (err) {
      res.status(500).json({ message: 'Error deleting GPT responses', error: err.message });
      return;
    }

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'No GPT responses found for this job or unauthorized' });
      return;
    }

    res.status(200).json({ message: 'All GPT responses for the job deleted' });
  });
});

// DELETE: Delete all GPT responses for the authenticated user
router.delete('/responses', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
  }
  const userId = req.user.id;

  const sql = "DELETE FROM gpt_responses WHERE account_id = ?";
  connection.query(sql, [userId], (err, result: any) => {
    if (err) {
      res.status(500).json({ message: 'Error deleting GPT responses', error: err.message });
      return;
    }

    // Check if any rows were affected (deleted)
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'No GPT responses found for this user' });
      return;
    }

    res.status(200).json({ message: 'All GPT responses for the user deleted' });
  });
});

// READ: Get distinct days that have job listings for the authenticated user
router.get('/days', (req: any, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
  }
  const userId = req.user.id;

  const sql = `
    SELECT DISTINCT DATE_FORMAT(DATE(created_at), '%Y-%m-%d') as job_date, 
           COUNT(*) as job_count
    FROM jobs 
    WHERE account_id = ? 
    GROUP BY DATE(created_at) 
    ORDER BY job_date DESC
  `;

  connection.query(sql, [userId], (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(results);
  });
});

// POST: Recheck jobs from a specific day with Ollama
router.post('/recheck/:date', async (req: any, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
    return;
  }
  
  const userId = req.user.id;
  const { date } = req.params;

  try {
    // Import the analyzeJobWithOllama function
    const { analyzeJobWithOllama } = await import('../../services/aiService');

    // Extract just the date part (YYYY-MM-DD) from the input date
    // Handle both ISO format (2025-09-14T22:00:00.000Z) and simple date format (2025-09-14)
    let dateOnly: string;
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        // If date parsing fails, assume it's already in YYYY-MM-DD format
        dateOnly = date;
      } else {
        // Convert to YYYY-MM-DD format
        dateOnly = parsedDate.toISOString().split('T')[0];
      }
    } catch (error) {
      // Fallback to original date if parsing fails
      dateOnly = date;
    }

    console.log(`Rechecking jobs for date: ${date} -> normalized to: ${dateOnly}`);

    // Get jobs from the specified date
    const sql = `
      SELECT j.*, COALESCE(gr.is_approved, 0) AS old_is_approved
      FROM jobs j
      LEFT JOIN gpt_responses gr ON j.id = gr.job_id AND gr.account_id = ?
      WHERE j.account_id = ? AND DATE_FORMAT(DATE(j.created_at), '%Y-%m-%d') = ?
    `;

    connection.query(sql, [userId, userId, dateOnly], async (err: any, jobs: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (jobs.length === 0) {
        res.status(404).json({ message: `No jobs found for the specified date: ${dateOnly}` });
        return;
      }

      const changedJobs: any[] = [];
      const recheckPromises = jobs.map(async (job) => {
        try {
          const oldApproval = job.old_is_approved;
          await analyzeJobWithOllama(job, userId);
          
          // Get the new approval status
          const checkSql = 'SELECT is_approved FROM gpt_responses WHERE job_id = ? AND account_id = ?';
          return new Promise((resolve) => {
            connection.query(checkSql, [job.id, userId], (checkErr: any, checkResults: any[]) => {
              if (!checkErr && checkResults.length > 0) {
                const newApproval = checkResults[0].is_approved;
                if (oldApproval !== newApproval) {
                  changedJobs.push({
                    id: job.id,
                    title: job.title,
                    company: job.company,
                    link: job.link,
                    oldStatus: oldApproval ? 'approved' : 'not approved',
                    newStatus: newApproval ? 'approved' : 'not approved'
                  });
                }
              }
              resolve(null);
            });
          });
        } catch (error) {
          console.error(`Error rechecking job ${job.id}:`, error);
          return null;
        }
      });

      await Promise.all(recheckPromises);

      res.status(200).json({
        message: `Rechecked ${jobs.length} jobs from ${dateOnly}`,
        totalJobs: jobs.length,
        changedJobs: changedJobs
      });
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error during recheck process: ' + error.message });
  }
});

export default router;