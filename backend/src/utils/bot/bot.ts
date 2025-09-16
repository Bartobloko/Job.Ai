import { scrapeJobOffers } from './scraper/scraper';
import { saveJobToDatabase, isJobAlreadySaved } from '../services/jobService';
import { analyzeJobWithOllama } from '../services/aiService';
import { updateAccountStats, logBotAction } from '../services/statsService';
import websocketService from '../../services/websocketService';

const getJobDetails = async (accountId: number): Promise<void> => {
  try {
    // Mark bot as running
    websocketService.setBotRunning(accountId.toString(), true);
    
    // Emit bot start
    websocketService.emitBotStageUpdate(accountId.toString(), {
      stage: 'scraping',
      status: 'in_progress',
      message: 'Starting job scraping process'
    });

    // Log bot activation
    await logBotAction(
      accountId,
      'BOT_START',
      'Started job scraping process'
    );
    await updateAccountStats(accountId, { botActivations: 1 });

    console.log('Fetching job details...');
    const scrappedJobs = await scrapeJobOffers(accountId); // Pass accountId to use custom settings

    // Emit scraping completion
    websocketService.emitBotStageUpdate(accountId.toString(), {
      stage: 'scraping',
      status: 'done',
      message: `Successfully scraped ${scrappedJobs.length} jobs`
    });

    await logBotAction(
      accountId,
      'SCRAPE_COMPLETE',
      `Successfully scraped ${scrappedJobs.length} jobs`
    );

    console.log('Found jobs:', scrappedJobs.length);
    let newJobsCount = 0;
    let analyzedJobsCount = 0;

    // Start analysis stage
    if (scrappedJobs.length > 0) {
      websocketService.emitBotStageUpdate(accountId.toString(), {
        stage: 'analysis',
        status: 'in_progress',
        message: 'Starting job analysis with Ollama'
      });

      let jobCount = 0;
      for (const job of scrappedJobs) {
        jobCount++;
        const alreadySaved = await isJobAlreadySaved(job.title, job.company);

        if (alreadySaved) {
          console.log('Job already exists in database');
          websocketService.emitAnalysisUpdate(accountId.toString(), {
            status: 'in_progress',
            message: `Job ${jobCount}/${scrappedJobs.length} already existed in database`,
            progress: { current: jobCount, total: scrappedJobs.length }
          });
        } else {
          newJobsCount++;
          const savedJob = await saveJobToDatabase({...job, account_id: accountId}, accountId);

          try {
            websocketService.emitAnalysisUpdate(accountId.toString(), {
              status: 'in_progress',
              message: `Analyzing job ${jobCount}/${scrappedJobs.length}: ${job.title}`,
              progress: { current: jobCount, total: scrappedJobs.length }
            });

            const response = await analyzeJobWithOllama(savedJob, accountId);
            analyzedJobsCount++;

            await logBotAction(
              accountId,
              'JOB_ANALYZED',
              `Analyzed job: ${job.title} - ${response.slice(0, 50)}...`
            );
          } catch (error: any) {
            websocketService.emitAnalysisUpdate(accountId.toString(), {
              status: 'error',
              message: `Failed to analyze job ${job.title}: ${error.message}`,
              progress: { current: jobCount, total: scrappedJobs.length }
            });

            await logBotAction(
              accountId,
              'ANALYSIS_ERROR',
              `Failed to analyze job ${job.title}: ${error.message}`
            );
          }
        }
      }

      // Emit analysis completion
      websocketService.emitBotStageUpdate(accountId.toString(), {
        stage: 'analysis',
        status: 'done',
        message: `Completed analysis. Analyzed: ${analyzedJobsCount} jobs`
      });
    }

    // Emit bot completion
    websocketService.emitBotComplete(accountId.toString(), {
      newJobs: newJobsCount,
      analyzedJobs: analyzedJobsCount,
      totalScraped: scrappedJobs.length
    });

    await logBotAction(
      accountId,
      'BOT_COMPLETE',
      `Completed processing. New jobs: ${newJobsCount}, Analyzed: ${analyzedJobsCount}`
    );

  } catch (error: any) {
    // Emit bot error
    websocketService.emitBotError(accountId.toString(), {
      message: error.message,
      stage: 'general'
    });

    await logBotAction(
      accountId,
      'BOT_ERROR',
      `Error during job processing: ${error.message}`
    );
    throw error;
  }
};

export { getJobDetails };