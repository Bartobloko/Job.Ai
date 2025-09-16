import express, { Request, Response } from 'express';
import { connection } from '../../database/database';
import { AuthenticatedRequest, DatabaseResult } from '../../../types';

const router = express.Router();

interface CreateAccountStatsBody {
  account_id: number;
  bot_activation_count?: number;
}

// CREATE: Add a new account_stats record
router.post('/', (req: Request, res: Response): void => {
  const {
    account_id,
    bot_activation_count = 0,
  }: CreateAccountStatsBody = req.body;

  const sql = `
    INSERT INTO account_stats (
      account_id, bot_activation_count
    ) VALUES (?, ?)
  `;
  const values = [
    account_id,
    bot_activation_count,
  ];

  connection.query(sql, values, (err: any, result: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ message: "Account stats record created", id: result.insertId });
  });
});

// READ: Get all account_stats records
router.get('/', (req: any, res: Response): void => {
  const sql = 'SELECT * FROM account_stats WHERE account_id = ?';
  connection.query(sql, [req.user.id], (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(results);
  });
});

export default router;