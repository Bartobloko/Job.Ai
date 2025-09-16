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

export default router;