const userRoutes = require('./user/userRoutes');
const botRoutes = require('./bot/botRoutes');
const accountStatsRoutes = require('./acountStats/accountStatsRoutes');
const fakeJobsRoutes = require('./fakeJobs/fakeJobsRoutes');
const jobRoutes  = require('./job/jobRoutes');
const settingsRoutes = require('./settings/settingsRoutes');
const decodeJWT = require("../middleware/decodeJWT");


function initializeRoutes(app) {
    app.use('/api/users', userRoutes);

    app.use(decodeJWT);

    app.use('/api/bot', botRoutes);

    app.use('/api/account_stats', accountStatsRoutes);

    app.use('/api/fake_jobs', fakeJobsRoutes);

    app.use('/api/jobs',jobRoutes)

    app.use('/api/settings', settingsRoutes);
}

module.exports = initializeRoutes;