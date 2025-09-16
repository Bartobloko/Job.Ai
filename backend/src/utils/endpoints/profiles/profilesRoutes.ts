import express, { Response } from 'express';
import { connection } from '../../database/database';
import decodeJWT from '../../middleware/decodeJWT';
import { AuthenticatedRequest } from '../../../types';
import profileTestingRoutes from './profileTestingRoutes';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

interface BotProfile {
  id: number;
  account_id: number;
  name: string;
  custom_prompt: string;
  experience_level: string;
  blocked_keywords: string;
  ai_model: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CreateProfileBody {
  name: string;
  custom_prompt: string;
  experience_level: string;
  blocked_keywords: string;
  ai_model?: string;
}

interface UpdateProfileBody extends CreateProfileBody {
  is_active?: boolean;
}

// CREATE: Add a new bot profile
router.post('/', decodeJWT, (req: any, res: Response): void => {
  const { id: accountId } = req.user;
  const { name, custom_prompt, experience_level, blocked_keywords, ai_model = 'phi4' }: CreateProfileBody = req.body;

  // Validate required fields
  if (!name || !custom_prompt || !experience_level) {
    res.status(400).json({ error: "Name, custom_prompt, and experience_level are required" });
    return;
  }

  const sql = `INSERT INTO bot_profiles (account_id, name, custom_prompt, experience_level, blocked_keywords, ai_model, is_active) 
               VALUES (?, ?, ?, ?, ?, ?, false)`;
  
  connection.query(sql, [accountId, name, custom_prompt, experience_level, blocked_keywords || '', ai_model], (err: any, result: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ 
      message: "Profile created successfully", 
      profile_id: result.insertId 
    });
  });
});

// READ: Get all profiles for the authenticated user
router.get('/', decodeJWT, (req: any, res: Response): void => {
  const { id: accountId } = req.user;

  const sql = "SELECT * FROM bot_profiles WHERE account_id = ? ORDER BY created_at DESC";
  connection.query(sql, [accountId], (err: any, results: RowDataPacket[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(results as BotProfile[]);
  });
});

// READ: Get active profile for the authenticated user
router.get('/active', decodeJWT, (req: any, res: Response): void => {
  const { id: accountId } = req.user;

  const sql = "SELECT * FROM bot_profiles WHERE account_id = ? AND is_active = true LIMIT 1";
  connection.query(sql, [accountId], (err: any, results: RowDataPacket[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (results.length === 0) {
      res.status(404).json({ error: "No active profile found" });
      return;
    }
    
    res.status(200).json(results[0] as BotProfile);
  });
});

// READ: Get a single profile by ID
router.get('/:profile_id', decodeJWT, (req: any, res: Response): void => {
  const { id: accountId } = req.user;
  const { profile_id } = req.params;

  const sql = "SELECT * FROM bot_profiles WHERE id = ? AND account_id = ?";
  connection.query(sql, [profile_id, accountId], (err: any, results: RowDataPacket[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (results.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    
    res.status(200).json(results[0] as BotProfile);
  });
});

// UPDATE: Update a profile by ID
router.put('/:profile_id', decodeJWT, (req: any, res: Response): void => {
  const { id: accountId } = req.user;
  const { profile_id } = req.params;
  const { name, custom_prompt, experience_level, blocked_keywords, ai_model, is_active }: UpdateProfileBody = req.body;

  // If setting this profile as active, deactivate all other profiles first
  if (is_active) {
    const deactivateSQL = "UPDATE bot_profiles SET is_active = false WHERE account_id = ? AND id != ?";
    connection.query(deactivateSQL, [accountId, profile_id], (err: any) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
    });
  }

  const sql = `UPDATE bot_profiles 
               SET name = COALESCE(?, name), 
                   custom_prompt = COALESCE(?, custom_prompt), 
                   experience_level = COALESCE(?, experience_level), 
                   blocked_keywords = COALESCE(?, blocked_keywords), 
                   ai_model = COALESCE(?, ai_model),
                   is_active = COALESCE(?, is_active),
                   updated_at = NOW()
               WHERE id = ? AND account_id = ?`;

  connection.query(sql, [name, custom_prompt, experience_level, blocked_keywords, ai_model, is_active, profile_id, accountId], (err: any, result: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    
    res.status(200).json({ message: "Profile updated successfully" });
  });
});

// POST: Set a profile as active
router.post('/:profile_id/activate', decodeJWT, (req: any, res: Response): void => {
  const { id: accountId } = req.user;
  const { profile_id } = req.params;

  // First, deactivate all profiles for this user
  const deactivateSQL = "UPDATE bot_profiles SET is_active = false WHERE account_id = ?";
  connection.query(deactivateSQL, [accountId], (err: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Then activate the selected profile
    const activateSQL = "UPDATE bot_profiles SET is_active = true, updated_at = NOW() WHERE id = ? AND account_id = ?";
    connection.query(activateSQL, [profile_id, accountId], (err: any, result: any) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      
      res.status(200).json({ message: "Profile activated successfully" });
    });
  });
});

// DELETE: Delete a profile by ID
router.delete('/:profile_id', decodeJWT, (req: any, res: Response): void => {
  const { id: accountId } = req.user;
  const { profile_id } = req.params;

  // Check if this is the active profile
  const checkActiveSQL = "SELECT is_active FROM bot_profiles WHERE id = ? AND account_id = ?";
  connection.query(checkActiveSQL, [profile_id, accountId], (err: any, results: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (results.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    
    if (results[0].is_active) {
      res.status(400).json({ error: "Cannot delete active profile. Please activate another profile first." });
      return;
    }

    // Delete the profile
    const deleteSQL = "DELETE FROM bot_profiles WHERE id = ? AND account_id = ?";
    connection.query(deleteSQL, [profile_id, accountId], (err: any, result: any) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.status(200).json({ message: "Profile deleted successfully" });
    });
  });
});

// Use testing routes
router.use('/', profileTestingRoutes);

export default router;