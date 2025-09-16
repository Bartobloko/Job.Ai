import { connection } from '../../../database/database';

interface AccountSettings {
  linkedIn_li_at_cookie?: string;
  justJoin_links?: string;
  theProtocol_links?: string;
  noFluffJobs_links?: string;
  linkedIn_links?: string;
  talent_links?: string;
}

// Retrieve the links and LinkedIn cookie for an account
const getAccountSettings = (accountId: number): Promise<AccountSettings> => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT linkedIn_li_at_cookie, justJoin_links, theProtocol_links, noFluffJobs_links, linkedIn_links, talent_links FROM account_settings WHERE account_id = ?';
    connection.query(query, [accountId], (err: any, results: any[]) => {
      if (err) {
        console.error('Error fetching account settings:', err);
        return reject(err);
      }
      if (results.length === 0) {
        console.error('No account settings found for account ID:', accountId);
        return reject(new Error('No account settings found'));
      }
      resolve(results[0]);
    });
  });
};

// Helper function for random delays
function getRandomDelay(min = 1000, max = 5000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export {
  getAccountSettings,
  getRandomDelay,
  type AccountSettings
};