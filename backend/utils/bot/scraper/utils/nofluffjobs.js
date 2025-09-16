// Funkcja scrape dla NoFluffJobs
async function scrapeNoFluffJobs(page, customLinks = null) {
    console.log('Scraping NoFluffJobs');

    // Use custom links if provided, otherwise use default
    const linksToScrape = customLinks ?
        JSON.parse(customLinks) :
        ['https://nofluffjobs.com/pl/Angular?criteria=jobLanguage%3Dpl,en%20seniority%3Dtrainee,junior'];

    let allJobDetails = [];

    for (const url of linksToScrape) {
        await page.goto(url);
        await page.waitForSelector('nfj-search-results');

        const jobLinks = await page.evaluate(() => {
            const links = [];
            const jobElements = document.querySelectorAll('nfj-postings-list .list-container.ng-star-inserted a');
            jobElements.forEach(jobElement => {
                links.push(jobElement.href);
            });
            return links;
        });

        console.log('Found links on NoFluffJobs:', jobLinks.length);

        const jobDetails = [];
        for (const link of jobLinks) {
            await page.goto(link);
            await page.waitForSelector('common-posting-header'); // Czekaj na załadowanie nagłówka

            const jobDetail = await page.evaluate(() => {
                // Tytuł pracy
                const titleElement = document.querySelector('common-posting-header div > div > h1');
                const title = titleElement ? titleElement.innerText.trim() : 'Brak tytułu';

                // Nazwa firmy
                const companyElement = document.querySelector('common-posting-header div > div > a');
                const company = companyElement ? companyElement.innerText.trim() : 'Brak firmy';

                // Opis pracy
                const descriptionElement = document.querySelector('nfj-read-more div');
                const description = descriptionElement ? descriptionElement.innerText.trim() : 'Brak opisu';

                return { title, description, company, link: window.location.href };
            });

            jobDetails.push(jobDetail);
            await page.goBack();
            await page.waitForSelector('nfj-search-results'); // Powrót do listy ofert
        }

        allJobDetails = [...allJobDetails, ...jobDetails];
    }

    return allJobDetails;
}

module.exports = { scrapeNoFluffJobs };