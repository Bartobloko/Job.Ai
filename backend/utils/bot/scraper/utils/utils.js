const connection = require('../../../database/database');

// Retrieve the links and LinkedIn cookie for an account
const getAccountSettings = (accountId) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT linkedIn_li_at_cookie, justJoin_links, theProtocol_links, noFluffJobs_links, linkedIn_links, talent_links FROM account_settings WHERE account_id = ?';
        connection.query(query, [accountId], (err, results) => {
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
function getRandomDelay(min = 1000, max = 5000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    getAccountSettings,
    getRandomDelay
};