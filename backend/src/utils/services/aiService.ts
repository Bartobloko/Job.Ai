import { connection } from '../database/database';
import { Job, DatabaseResult } from '../../types';
import { isJobAlreadyAnalyzed } from './jobService';
import { logBotAction } from './statsService';

interface AccountSettingsForAI {
  custom_prompt: string;
  experience_level: string;
  blocked_keywords: string;
  ai_model: string;
}

interface OllamaResponse {
  message: {
    content: string;
  };
}

interface FakeJob {
  fake_job_id: number;
  fake_job_description: string;
}

interface AnalysisResult {
  jobId: number;
  chatResponse: string;
  isApproved: boolean;
}

async function makeOllamaQuery(prompt: string, aiModel: string): Promise<OllamaResponse> {
  const { makeOllamaQuery } = await import('../bot/OllamaQuery');
  return makeOllamaQuery(prompt, aiModel);
}

// Fetch custom prompt from account_settings
const analyzeJobWithOllama = (job: Job, accountId: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const description = job.description.replace(/\n/g, ' ');

    // Fetch custom prompt, experience level, blocked keywords and AI model from account_settings
    const settingsQuery = 'SELECT custom_prompt, experience_level, blocked_keywords, ai_model FROM account_settings WHERE account_id = ?';
    connection.query(settingsQuery, [accountId], async (err: any, results: any[]) => {
      if (err) {
        console.error('Error fetching account settings:', err);
        await logBotAction(
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

      try {
        const response = await makeOllamaQuery(prompt, selectedModel);
        const chatResponse = response.message.content;
        const isApproved = chatResponse.slice(0, 4).toLowerCase().includes('yes');

        try {
          if (!job.id) {
            throw new Error('Job ID is required for analysis');
          }
          
          const isAnalyzed = await isJobAlreadyAnalyzed(job.id, accountId);
          if (isAnalyzed) {
            await updateGPTResponse(job.id, chatResponse, isApproved, accountId);
          } else {
            await saveGPTResponse(job.id, chatResponse, isApproved, accountId);
          }
          resolve(chatResponse);
        } catch (error: any) {
          await logBotAction(
            accountId,
            'ANALYSIS_ERROR',
            `Error processing job analysis: ${error.message}`
          );
          reject(error);
        }
      } catch (error: any) {
        await logBotAction(
          accountId,
          'OLLAMA_ERROR',
          `Error during Ollama analysis: ${error.message}`
        );
        reject('Error during analysis with Ollama');
      }
    });
  });
};

const analyzeAllFakeJobs = (newPrompt: string, experience: string, blocked_keywords: string, aiModel = 'phi4'): Promise<AnalysisResult[]> => {
  return new Promise((resolve, reject) => {
    const jobsQuery = 'SELECT * FROM fake_jobs';

    connection.query(jobsQuery, (err, jobs: FakeJob[]) => {
      if (err) {
        console.error('Error fetching fake jobs:', err);
        return reject(err);
      }

      const jobPromises = jobs.map(async (job) => {
        const ollamaPrompt = `${newPrompt} my experience level: ${experience} say no if jobs are mainly about working in: ${blocked_keywords}.Answer 'yes' or 'no' then type short explanation.Put the answer first,before any other text. Job Description: ${job.fake_job_description}`;
        
        try {
          const response = await makeOllamaQuery(ollamaPrompt, aiModel);
          const chatResponse = response.message.content;
          console.log(chatResponse.slice(0, 4).toLowerCase());
          const isApproved = chatResponse.slice(0, 4).toLowerCase().includes('yes');
          return { jobId: job.fake_job_id, chatResponse, isApproved };
        } catch (error) {
          console.error('Error analyzing fake job:', error);
          throw error;
        }
      });

      Promise.all(jobPromises)
        .then((results) => resolve(results))
        .catch((error) => reject(error));
    });
  });
};

const saveGPTResponse = (jobId: number, response: string, isApproved: boolean, accountId: number): Promise<void> => {
  const query = 'INSERT INTO gpt_responses (job_id, response, is_approved, account_id) VALUES (?, ?, ?, ?)';

  return new Promise((resolve, reject) => {
    connection.query(query, [jobId, response, isApproved, accountId], (err, results: any) => {
      if (err) {
        console.error('Error saving response to database:', err);
        reject(err);
        return;
      }
      console.log('Response saved to database:', results.insertId);
      resolve();
    });
  });
};

const updateGPTResponse = (jobId: number, response: string, isApproved: boolean, accountId: number): Promise<void> => {
  const query = 'UPDATE gpt_responses SET response = ?, is_approved = ?, account_id = ? WHERE job_id = ?';

  return new Promise((resolve, reject) => {
    connection.query(query, [response, isApproved, accountId, jobId], (err, results: any) => {
      if (err) {
        console.error('Error updating response in database:', err);
        reject(err);
        return;
      }
      if (results.affectedRows > 0) {
        console.log('Response updated successfully for jobId:', jobId);
      } else {
        console.log('No response found to update for jobId:', jobId);
      }
      resolve();
    });
  });
};

export { analyzeJobWithOllama, analyzeAllFakeJobs };