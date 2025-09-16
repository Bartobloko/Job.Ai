// Funkcja do analizy oferty z Ollama
const connection = require('../database/database');
const jobService = require('./jobService');
const statsService = require('./statsService');


async function makeOllamaQuery(prompt, aiModel) {
    const { makeOllamaQuery } = await import('../bot/OllamaQuery.mjs');
    return makeOllamaQuery(prompt, aiModel);
}


// Fetch custom prompt from account_settings
const analyzeJobWithOllama = (job, accountId) => {
    return new Promise((resolve, reject) => {
        const description = job.description.replace(/\n/g, ' ');

        // Fetch custom prompt, experience level, blocked keywords and AI model from account_settings
        const settingsQuery = 'SELECT custom_prompt, experience_level, blocked_keywords, ai_model FROM account_settings WHERE account_id = ?';
        connection.query(settingsQuery, [accountId], async (err, results) => {
            if (err) {
                console.error('Error fetching account settings:', err);
                await statsService.logBotAction(
                    accountId,
                    'SETTINGS_ERROR',
                    `Error fetching account settings: ${err.message}`
                );
                return reject('Error fetching account settings');
            }
            if (results.length === 0) {
                console.error('No account settings found for account_id:', accountId);
                return reject('No account settings found');
            }

            const { custom_prompt, experience_level, blocked_keywords, ai_model } = results[0];
            const selectedModel = ai_model || 'phi4'; // Default to phi4 if ai_model is null

            const prompt = `${custom_prompt} my experience level: ${experience_level} say no if jobs are mainly about working in: ${blocked_keywords}.Answer 'yes' or 'no' then type short explanation.Put the answer first,before any other text. Job Description: ${description}`;

            makeOllamaQuery(prompt, selectedModel).then(async (response) => {
                const chatResponse = response.message.content;
                const isApproved = chatResponse.slice(0, 4).toLowerCase().includes('yes');

                try {
                    const isAnalyzed = await jobService.isJobAlreadyAnalyzed(job.id, accountId);
                    if (isAnalyzed) {
                        await updateGPTResponse(job.id, chatResponse, isApproved, accountId);
                    } else {
                        await saveGPTResponse(job.id, chatResponse, isApproved, accountId);
                    }
                    resolve(chatResponse);
                } catch (error) {
                    await statsService.logBotAction(
                        accountId,
                        'ANALYSIS_ERROR',
                        `Error processing job analysis: ${error.message}`
                    );
                    reject(error);
                }
            }).catch(async (error) => {
                await statsService.logBotAction(
                    accountId,
                    'OLLAMA_ERROR',
                    `Error during Ollama analysis: ${error.message}`
                );
                reject('Error during analysis with Ollama');
            });
        });
    });
};

const analyzeAllFakeJobs = (newPrompt, experience, blocked_keywords, aiModel = 'phi4') => {
    return new Promise((resolve, reject) => {
        const jobsQuery = 'SELECT * FROM fake_jobs';

        connection.query(jobsQuery, (err, jobs) => {
            if (err) {
                console.error('Error fetching fake jobs:', err);
                return reject(err);
            }

            const jobPromises = jobs.map((job) => {
                const ollamaPrompt = `${newPrompt} my experience level: ${experience} say no if jobs are mainly about working in: ${blocked_keywords}.Answer 'yes' or 'no' then type short explanation.Put the answer first,before any other text. Job Description: ${job.fake_job_description}`;
                return makeOllamaQuery(ollamaPrompt, aiModel).then((response) => {
                    const chatResponse = response.message.content;
                    console.log(chatResponse.slice(0, 4).toLowerCase())
                    const isApproved = chatResponse.slice(0, 4).toLowerCase().includes('yes');
                    return { jobId: job.fake_job_id, chatResponse, isApproved };
                });
            });

            Promise.all(jobPromises)
                .then((results) => resolve(results))
                .catch((error) => reject(error));
        });
    });
};


const saveGPTResponse = (jobId, response, isApproved, accountId) => {
    const query = 'INSERT INTO gpt_responses (job_id, response, is_approved, account_id) VALUES (?, ?, ?, ?)';

    connection.query(query, [jobId, response, isApproved, accountId], (err, results) => {
        if (err) {
            console.error('Error saving response to database:', err);
            return;
        }
        console.log('Response saved to database:', results.insertId);
    });
};


const updateGPTResponse = (jobId, response, isApproved, accountId) => {
    const query = 'UPDATE gpt_responses SET response = ?, is_approved = ?, account_id = ? WHERE job_id = ?';

    connection.query(query, [response, isApproved, accountId, jobId], (err, results) => {
        if (err) {
            console.error('Error updating response in database:', err);
            return;
        }
        if (results.affectedRows > 0) {
            console.log('Response updated successfully for jobId:', jobId);
        } else {
            console.log('No response found to update for jobId:', jobId);
        }
    });
};

module.exports = { analyzeJobWithOllama, analyzeAllFakeJobs };