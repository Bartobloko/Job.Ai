const connection = require('../database/database');

const updateAccountStats = async (accountId, updateData) => {
    // First, check if a record exists
    const checkQuery = `
        SELECT id FROM account_stats WHERE account_id = ?
    `;

    return new Promise((resolve, reject) => {
        connection.query(checkQuery, [accountId], (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Error checking account stats:', checkErr);
                reject(checkErr);
                return;
            }

            let query;
            let params;

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
                params = [updateData.appliedJobs || 0, updateData.botActivations || 0, accountId];
            }

            connection.query(query, params, (err, results) => {
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

const logBotAction = async (accountId, actionType, description) => {
    const query = `
        INSERT INTO bot_logs (account_id, action_type, description)
        VALUES (?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(
            query,
            [accountId, actionType, description],
            (err, results) => {
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

module.exports = { updateAccountStats, logBotAction };