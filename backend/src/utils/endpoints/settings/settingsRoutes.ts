import express, { Response } from 'express';
import { connection } from '../../database/database';
import decodeJWT from '../../middleware/decodeJWT';
import { AuthenticatedRequest } from '../../../types';

const router = express.Router();

interface AccountSettings {
  id: number;
  account_id: number;
  experience_level?: string;
  custom_prompt?: string;
  blocked_keywords?: string;
  first_name?: string;
  last_name?: string;
  about_me?: string;
  cv_path?: string;
  linkedIn_li_at_cookie?: string;
  ai_model?: string;
  created_at: Date;
  updated_at: Date;
}

// GET: Get account settings by account
router.get('/', decodeJWT, (req: any, res: Response): void => {
  const { id } = req.user; // User's account ID from the JWT token

  // Query the account_settings table using the account_id
  const sql = "SELECT * FROM account_settings WHERE account_id = ?";
  connection.query(sql, [id], (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: "Settings not found for this user" });
      return;
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
});

export default router;