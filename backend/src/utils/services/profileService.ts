import { connection } from '../database/database';

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

// Get active profile for an account
export const getActiveProfile = (accountId: number): Promise<BotProfile> => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM bot_profiles WHERE account_id = ? AND is_active = true LIMIT 1";
    connection.query(sql, [accountId], (err: any, results: BotProfile[]) => {
      if (err) {
        console.error('Error fetching active profile:', err);
        return reject(new Error('Error fetching active profile'));
      }
      
      if (results.length === 0) {
        return reject(new Error('No active profile found. Please activate a profile first.'));
      }
      
      resolve(results[0]);
    });
  });
};

// Get profile by ID
export const getProfileById = (profileId: number, accountId: number): Promise<BotProfile> => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM bot_profiles WHERE id = ? AND account_id = ?";
    connection.query(sql, [profileId, accountId], (err: any, results: BotProfile[]) => {
      if (err) {
        console.error('Error fetching profile by ID:', err);
        return reject(new Error('Error fetching profile'));
      }
      
      if (results.length === 0) {
        return reject(new Error('Profile not found'));
      }
      
      resolve(results[0]);
    });
  });
};

// Get all profiles for an account
export const getAllProfiles = (accountId: number): Promise<BotProfile[]> => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM bot_profiles WHERE account_id = ? ORDER BY created_at DESC";
    connection.query(sql, [accountId], (err: any, results: BotProfile[]) => {
      if (err) {
        console.error('Error fetching profiles:', err);
        return reject(new Error('Error fetching profiles'));
      }
      
      resolve(results);
    });
  });
};

// Check if user has any profiles
export const hasProfiles = (accountId: number): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT COUNT(*) as count FROM bot_profiles WHERE account_id = ?";
    connection.query(sql, [accountId], (err: any, results: any[]) => {
      if (err) {
        console.error('Error checking profiles:', err);
        return reject(new Error('Error checking profiles'));
      }
      
      resolve(results[0].count > 0);
    });
  });
};