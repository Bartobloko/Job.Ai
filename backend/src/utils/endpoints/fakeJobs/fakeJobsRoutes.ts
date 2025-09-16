import express, { Request, Response } from 'express';
import { connection } from '../../database/database';
import { DatabaseResult } from '../../../types';

const router = express.Router();

interface FakeJob {
  fake_job_id: number;
  fake_job_description: string;
  created_at: Date;
}

interface CreateFakeJobBody {
  fake_job_description: string;
}

interface UpdateFakeJobBody {
  fake_job_description: string;
}

// CREATE: Add a new fake job
router.post('/', (req: Request, res: Response): void => {
  const { fake_job_description }: CreateFakeJobBody = req.body;

  // Validate input
  if (!fake_job_description) {
    res.status(400).json({ error: "Fake job description is required" });
    return;
  }

  const sql = "INSERT INTO fake_jobs (fake_job_description) VALUES (?)";
  connection.query(sql, [fake_job_description], (err: any, result: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ message: "Fake job created", fake_job_id: result.insertId });
  });
});

// READ: Get all fake jobs
router.get('/', (req: Request, res: Response): void => {
  const sql = "SELECT * FROM fake_jobs";
  connection.query(sql, (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(results);
  });
});

// READ: Get a single fake job by ID
router.get('/:fake_job_id', (req: Request, res: Response): void => {
  const { fake_job_id } = req.params;

  const sql = "SELECT * FROM fake_jobs WHERE fake_job_id = ?";
  connection.query(sql, [fake_job_id], (err: any, result: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.length === 0) {
      res.status(404).json({ message: "Fake job not found" });
      return;
    }
    res.status(200).json(result[0]);
  });
});

// UPDATE: Update a fake job by ID
router.put('/:fake_job_id', (req: Request, res: Response): void => {
  const { fake_job_id } = req.params;
  const { fake_job_description }: UpdateFakeJobBody = req.body;

  // Validate input
  if (!fake_job_description) {
    res.status(400).json({ error: "Fake job description is required" });
    return;
  }

  const sql = "UPDATE fake_jobs SET fake_job_description = ? WHERE fake_job_id = ?";
  connection.query(sql, [fake_job_description, fake_job_id], (err: any, result: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Fake job not found" });
      return;
    }
    res.status(200).json({ message: "Fake job updated" });
  });
});

// DELETE: Delete a fake job by ID
router.delete('/:fake_job_id', (req: Request, res: Response): void => {
  const { fake_job_id } = req.params;

  const sql = "DELETE FROM fake_jobs WHERE fake_job_id = ?";
  connection.query(sql, [fake_job_id], (err: any, result: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Fake job not found" });
      return;
    }
    res.status(200).json({ message: "Fake job deleted" });
  });
});

export default router;