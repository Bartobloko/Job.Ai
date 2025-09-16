import { connection } from '../database/database';
import { Job, DatabaseResult } from '../../types';

// Function to add a job to the database
const saveJobToDatabase = (job: Omit<Job, 'id'>, accountId: number): Promise<Job> => {
  const query = 'INSERT INTO jobs (title, description, company, link, account_id) VALUES (?, ?, ?, ?, ?)';

  return new Promise((resolve, reject) => {
    connection.query(
      query,
      [job.title, job.description, job.company, job.link, accountId],
      (err, results: any) => {
        if (err) {
          console.error('Error saving job to database:', err);
          reject(err);
          return;
        }

        console.log('Job saved to database:', results.insertId);
        const savedJob: Job = { ...job, id: results.insertId, account_id: accountId };
        resolve(savedJob);
      }
    );
  });
};

// Function to check if a job with the given title and company already exists in the database within the last 20 days
const isJobAlreadySaved = (title: string, company: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) AS count
      FROM jobs
      WHERE title = ? AND company = ? AND created_at > NOW() - INTERVAL 20 DAY
    `;
    connection.query(query, [title, company], (err: any, results: any[]) => {
      if (err) {
        return reject(err);
      }
      resolve(results[0]?.count > 0); // Returns true if a job with this title and company already exists
    });
  });
};

const isJobAlreadyAnalyzed = (jobId: number, accountId: number): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) AS count
      FROM gpt_responses
      WHERE job_id = ? AND account_id = ? AND created_at > NOW() - INTERVAL 20 DAY
    `;
    connection.query(query, [jobId, accountId], (err: any, results: any[]) => {
      if (err) {
        return reject(err);
      }
      console.log(results[0]?.count > 0);
      resolve(results[0]?.count > 0); // Returns true if there is a response for the job within the last 20 days
    });
  });
};

export { saveJobToDatabase, isJobAlreadySaved, isJobAlreadyAnalyzed };