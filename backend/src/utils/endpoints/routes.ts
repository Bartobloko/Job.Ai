import { Express } from 'express';
import userRoutes from './user/userRoutes';
import botRoutes from './bot/botRoutes';
import accountStatsRoutes from './acountStats/accountStatsRoutes';
import fakeJobsRoutes from './fakeJobs/fakeJobsRoutes';
import jobRoutes from './job/jobRoutes';
import settingsRoutes from './settings/settingsRoutes';
import decodeJWT from '../middleware/decodeJWT';

function initializeRoutes(app: Express): void {
  app.use('/api/users', userRoutes);

  app.use(decodeJWT);

  app.use('/api/bot', botRoutes);
  app.use('/api/account_stats', accountStatsRoutes);
  app.use('/api/fake_jobs', fakeJobsRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/settings', settingsRoutes);
}

export default initializeRoutes;