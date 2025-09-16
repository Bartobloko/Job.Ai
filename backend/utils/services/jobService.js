const connection = require('../database/database'); // Import połączenia z bazą danych

// Funkcja do dodania oferty do bazy danych
const saveJobToDatabase = (job, accountId) => {
    const query = 'INSERT INTO jobs (title, description, company, link, account_id) VALUES (?, ?, ?, ?, ?)';

    return new Promise((resolve, reject) => {
        connection.query(query, [job.title, job.description, job.company, job.link, accountId], (err, results) => {
            if (err) {
                console.error('Błąd zapisywania oferty do bazy:', err);
                reject(err);
                return;
            }

            console.log('Oferta zapisana w bazie danych:', results.insertId);
            job.id = results.insertId;  // Zapisz ID oferty w obiekcie job
            resolve(job);
        });
    });
};

// Funkcja sprawdzająca, czy oferta o danym tytule i firmie już istnieje w bazie danych w przeciągu ostatnich 20 dni
const isJobAlreadySaved = (title, company) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT COUNT(*) AS count
            FROM jobs
            WHERE title = ? AND company = ? AND created_at > NOW() - INTERVAL 20 DAY
        `;
        connection.query(query, [title, company], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results[0].count > 0); // Zwróci true, jeśli oferta z tym tytułem i firmą już istnieje
        });
    });
};

const isJobAlreadyAnalyzed = (jobId, accountId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT COUNT(*) AS count
            FROM gpt_responses
            WHERE job_id = ? AND account_id = ? AND created_at > NOW() - INTERVAL 20 DAY
        `;
        connection.query(query, [jobId, accountId], (err, results) => {
            if (err) {
                return reject(err);
            }
            console.log(results[0].count > 0)
            resolve(results[0].count > 0); // Returns true if there is a response for the job within the last 20 days
        });
    });
};


module.exports = { saveJobToDatabase, isJobAlreadySaved, isJobAlreadyAnalyzed};