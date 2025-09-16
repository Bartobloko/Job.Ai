import { scrapeJobOffers } from './scraper/scraper';
import { saveJobToDatabase, isJobAlreadySaved } from '../services/jobService';
import { analyzeJobWithOllama } from '../services/aiService';
import { updateAccountStats, logBotAction } from '../services/statsService';

const getJobDetails = async (accountId: number): Promise<void> => {
  try {
    // Log bot activation
    await logBotAction(
      accountId,
      'BOT_START',
      'Started job scraping process'
    );
    await updateAccountStats(accountId, { botActivations: 1 });

    console.log('Fetching job details...');
    const scrappedJobs = await scrapeJobOffers(accountId); // Pass accountId to use custom settings

    await logBotAction(
      accountId,
      'SCRAPE_COMPLETE',
      `Successfully scraped ${scrappedJobs.length} jobs`
    );

    console.log('Found jobs:', scrappedJobs.length);
    let newJobsCount = 0;
    let analyzedJobsCount = 0;

    for (const job of scrappedJobs) {
      const alreadySaved = await isJobAlreadySaved(job.title, job.company);

      if (alreadySaved) {
        console.log('Job already exists in database');
      } else {
        newJobsCount++;
        const savedJob = await saveJobToDatabase({...job, account_id: accountId}, accountId);

        try {
          const response = await analyzeJobWithOllama(savedJob, accountId);
          analyzedJobsCount++;

          await logBotAction(
            accountId,
            'JOB_ANALYZED',
            `Analyzed job: ${job.title} - ${response.slice(0, 50)}...`
          );
        } catch (error: any) {
          await logBotAction(
            accountId,
            'ANALYSIS_ERROR',
            `Failed to analyze job ${job.title}: ${error.message}`
          );
        }
      }
    }

    await logBotAction(
      accountId,
      'BOT_COMPLETE',
      `Completed processing. New jobs: ${newJobsCount}, Analyzed: ${analyzedJobsCount}`
    );

  } catch (error: any) {
    await logBotAction(
      accountId,
      'BOT_ERROR',
      `Error during job processing: ${error.message}`
    );
    throw error;
  }
};

export { getJobDetails };