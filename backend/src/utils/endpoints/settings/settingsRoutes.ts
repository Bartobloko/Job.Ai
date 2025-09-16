import express, { Response } from 'express';
import { connection } from '../../database/database';
import decodeJWT from '../../middleware/decodeJWT';
import { AuthenticatedRequest } from '../../../types';

const router = express.Router();

interface AccountSettings {
  id: number;
  account_id: number;
  first_name?: string;
  last_name?: string;
  about_me?: string;
  cv_path?: string;
  linkedIn_li_at_cookie?: string;
  justJoin_links?: string;
  theProtocol_links?: string;
  noFluffJobs_links?: string;
  linkedIn_links?: string;
  talent_links?: string;
  created_at: Date;
  updated_at: Date;
}

interface UpdateAccountSettingsBody {
  first_name?: string;
  last_name?: string;
  about_me?: string;
  linkedIn_li_at_cookie?: string;
  justJoin_links?: string;
  theProtocol_links?: string;
  noFluffJobs_links?: string;
  linkedIn_links?: string;
  talent_links?: string;
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

    // Return only non-bot settings (bot settings are now in profiles)
    const settings = results[0]; // Assuming the query only returns one row since account_id is unique
    res.status(200).json({
      first_name: settings.first_name,
      last_name: settings.last_name,
      about_me: settings.about_me,
      cv_path: settings.cv_path,
      linkedIn_li_at_cookie: settings.linkedIn_li_at_cookie,
      justJoin_links: settings.justJoin_links,
      theProtocol_links: settings.theProtocol_links,
      noFluffJobs_links: settings.noFluffJobs_links,
      linkedIn_links: settings.linkedIn_links,
      talent_links: settings.talent_links,
      updated_at: settings.updated_at
    });
  });
});

// PUT: Update account settings
router.put('/', decodeJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { id: accountId } = req.user;
  const {
    first_name,
    last_name,
    about_me,
    linkedIn_li_at_cookie,
    justJoin_links,
    theProtocol_links,
    noFluffJobs_links,
    linkedIn_links,
    talent_links
  }: UpdateAccountSettingsBody = req.body;

  const sql = `UPDATE account_settings 
               SET first_name = COALESCE(?, first_name),
                   last_name = COALESCE(?, last_name),
                   about_me = COALESCE(?, about_me),
                   linkedIn_li_at_cookie = COALESCE(?, linkedIn_li_at_cookie),
                   justJoin_links = COALESCE(?, justJoin_links),
                   theProtocol_links = COALESCE(?, theProtocol_links),
                   noFluffJobs_links = COALESCE(?, noFluffJobs_links),
                   linkedIn_links = COALESCE(?, linkedIn_links),
                   talent_links = COALESCE(?, talent_links),
                   updated_at = NOW()
               WHERE account_id = ?`;

  connection.query(sql, [
    first_name,
    last_name,
    about_me,
    linkedIn_li_at_cookie,
    justJoin_links,
    theProtocol_links,
    noFluffJobs_links,
    linkedIn_links,
    talent_links,
    accountId
  ], (err: any, result: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Settings not found for this user" });
      return;
    }
    
    res.status(200).json({ message: "Settings updated successfully" });
  });
});

export default router;