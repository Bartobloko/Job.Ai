// Funkcja scrape dla JustJoin.it
async function scrapeJustJoin(page, customLinks = null) {
    console.log('Scraping JustJoin.it');

    // Use custom links if provided, otherwise use default
    const linksToScrape = customLinks ?
        JSON.parse(customLinks) :
        ['https://justjoin.it/job-offers/all-locations/javascript?experience-level=junior&working-hours=full-time&orderBy=DESC&sortBy=newest&from=0'];

    let allJobDetails = [];

    for (const url of linksToScrape) {
        await page.goto(url);
        await page.waitForSelector('.css-2kppws');

        const jobLinks = await page.evaluate(() => {
            const links = [];
            const jobElements = document.querySelectorAll('.css-2kppws a[href^="/job-offer"]');
            jobElements.forEach(jobElement => {
                links.push(jobElement.href);
            });
            return links;
        });

        console.log('Found links on JustJoin:', jobLinks.length);

        const jobDetails = [];
        for (const link of jobLinks) {
            await page.goto(link);
            await page.waitForSelector('.MuiBox-root.css-tbycqp');

            const jobDetail = await page.evaluate(() => {
                const titleElement = document.querySelector('.css-s52zl1 h1');
                const title = titleElement ? titleElement.innerText : 'Brak tytułu';
                const description = document.querySelector('.MuiBox-root.css-tbycqp') ? document.querySelector('.MuiBox-root.css-tbycqp').innerText : 'Brak opisu';
                const company = document.querySelector('.MuiTypography-root.MuiTypography-body1.css-77dijd') ? document.querySelector('.MuiTypography-root.MuiTypography-body1.css-77dijd').innerText : 'Brak firmy';

                return { title, description, company, link: window.location.href };
            });

            jobDetails.push(jobDetail);
            await page.goBack();
            await page.waitForSelector('.css-2kppws');
        }

        allJobDetails = [...allJobDetails, ...jobDetails];
    }

    return allJobDetails;
}

module.exports = { scrapeJustJoin };