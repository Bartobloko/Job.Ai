// Funkcja scrape dla talent
async function scrapeTalentCom(page, customLinks = null) {
    console.log('Scraping Talent.com');

    // Use custom links if provided, otherwise use default
    const baseUrl = customLinks ?
        JSON.parse(customLinks) :
        [
            'https://pl.talent.com/jobs?k=angular+developer&l=Warsaw&date=7&radius=100&p=',
            'https://pl.talent.com/jobs?k=angular+developer&l=Gda%C5%84sk%2C&date=7&radius=100&p=',
            'https://pl.talent.com/jobs?k=angular+developer&l=Krak%C3%B3w%2C+&date=7&radius=100&p=',
            'https://pl.talent.com/jobs?k=angular+developer&l=Wroc%C5%82aw%2C+&date=7&radius=100&p='
        ];

    const jobDetails = [];

    for (const url of baseUrl) {
        console.log('Scraping Talent.com:', url);
        let currentPage = 1;
        let hasMorePages = true;

        while (hasMorePages) {
            // Przejdź do aktualnej strony
            await page.goto(url + currentPage);
            await page.waitForSelector('.cuSEPQ', {timeout: 5000});

            // Zbierz linki do ofert pracy
            const jobLinks = await page.evaluate(() => {
                const links = [];
                const jobElements = document.querySelectorAll('.sc-5c54c4fb-4 span a'); // Selektor linków
                jobElements.forEach(jobElement => {
                    if (jobElement.href) {
                        links.push(jobElement.href);
                    }
                });
                return links;
            });

            console.log(`Found ${jobLinks.length} job links on page ${currentPage}.`);

            // Iteruj przez linki i zbierz szczegóły ofert
            for (const link of jobLinks) {
                try {
                    await page.goto(link);
                    await page.waitForSelector('.sc-b6a55531-20', {timeout: 5000}); // Opis oferty

                    const jobDetail = await page.evaluate(() => {
                        const titleElement = document.querySelector('div[data-testid="JobCardContainer"] h1');
                        const title = titleElement ? titleElement.innerText.trim() : 'Brak tytułu';

                        const companyElement = document.querySelector('div[data-testid="JobCardContainer"] span:first-of-type');
                        const company = companyElement ? companyElement.innerText.trim() : 'Brak firmy';

                        const descriptionElement = document.querySelector('.sc-b6a55531-8');
                        const description = descriptionElement ? descriptionElement.innerText.trim() : 'Brak opisu';

                        return {title, description, company, link: window.location.href};
                    });

                    jobDetails.push(jobDetail);
                } catch (error) {
                    console.error('Error scraping job detail:', error.message);
                }
            }

            await page.goto(url + currentPage);

            // Sprawdź, czy jest kolejna strona

            hasMorePages = jobLinks.length >= 20 && await page.evaluate(() => {
                const nextPageButton = document.querySelector('.cRgWnE');
                return nextPageButton ? !nextPageButton.classList.contains('disabled') : false;
            });

            if (hasMorePages) {
                try {
                    currentPage++;
                    await page.goto(url + currentPage);
                    await page.waitForSelector('.cuSEPQ', {timeout: 5000});
                } catch (error) {
                    console.error('Error navigating to next page:', error.message);
                    hasMorePages = false;
                }
            } else {
                console.log('No more pages to scrape.');
            }
        }
    }

    return jobDetails;
}

module.exports = { scrapeTalentCom };