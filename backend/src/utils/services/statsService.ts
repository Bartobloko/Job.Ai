import { connection } from '../database/database';
import { DatabaseResult } from '../../types';

interface UpdateStatsData {
  botActivations?: number;
  appliedJobs?: number;
}

const updateAccountStats = async (accountId: number, updateData: UpdateStatsData): Promise<DatabaseResult> => {
  // First, check if a record exists
  const checkQuery = `
    SELECT id FROM account_stats WHERE account_id = ?
  `;

  return new Promise((resolve, reject) => {
    connection.query(checkQuery, [accountId], (checkErr, checkResults: any[]) => {
      if (checkErr) {
        console.error('Error checking account stats:', checkErr);
        reject(checkErr);
        return;
      }

      let query: string;
      let params: (number | string)[];

      if (checkResults.length === 0) {
        // Insert new record if none exists
        query = `
          INSERT INTO account_stats 
          (account_id, bot_activation_count) 
          VALUES (?, ?)
        `;
        params = [accountId, updateData.botActivations || 0];
      } else {
        // Update existing record
        query = `
          UPDATE account_stats 
          SET 
            bot_activation_count = bot_activation_count + ?,
            last_bot_use = CURRENT_TIMESTAMP
          WHERE account_id = ?
        `;
        params = [updateData.botActivations || 0, accountId];
      }

      connection.query(query, params, (err, results: any) => {
        if (err) {
          console.error('Error updating account stats:', err);
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  });
};

const logBotAction = async (accountId: number, actionType: string, description: string): Promise<DatabaseResult> => {
  const query = `
    INSERT INTO bot_logs (account_id, action_type, description)
    VALUES (?, ?, ?)
  `;

  return new Promise((resolve, reject) => {
    connection.query(
      query,
      [accountId, actionType, description],
      (err, results: any) => {
        if (err) {
          console.error('Error logging bot action:', err);
          reject(err);
          return;
        }
        resolve(results);
      }
    );
  });
};

export { updateAccountStats, logBotAction };