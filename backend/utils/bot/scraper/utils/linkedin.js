//Funkcja scrape dla LinkedIn Jobs
async function scrapeLinkedInJobs(page, customLinks = null, cookie = null) {
    console.log('Scraping LinkedIn Jobs');
    // Set LinkedIn cookie if provided
    if (cookie) {
        try {
            await page.setCookie({
                name: 'li_at',
                value: cookie,
                domain: '.www.linkedin.com',
                path: '/',
                httpOnly: true,
                secure: true,
            });
            console.log('LinkedIn cookie set successfully');
        } catch (error) {
            console.error('Error setting LinkedIn cookie:', error.message);
        }
    }

    // Use custom links if provided, otherwise use default
    const baseUrls = customLinks ?
        JSON.parse(customLinks) :
        [
            'https://www.linkedin.com/jobs/search/?currentJobId=4112666828&distance=25&f_E=2&f_TPR=r2592000&geoId=105072130&keywords=angular%20developer&origin=JOB_SEARCH_PAGE_JOB_FILTER&sortBy=R',
            'https://www.linkedin.com/jobs/search/?currentJobId=4104166198&f_E=2&f_TPR=r604800&f_WT=2&keywords=Programista%20front-end&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true&spellCorrectionEnabled=true',
            'https://www.linkedin.com/jobs/search/?currentJobId=4124361027&f_E=2&f_TPR=r604800&geoId=105072130&keywords=Programista%20front-end&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true&spellCorrectionEnabled=true'
        ];

    const allJobDetails = [];

    for (let baseUrl of baseUrls) {
        console.log('Going to next page:', baseUrl);
        try {
            await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForSelector('.scaffold-layout__list', { timeout: 10000 }); // Lista ofert
            console.log('Job card loaded');
            await page.waitForSelector('.job-card-container__link', { timeout: 10000 }); // Lista ofert
            console.log('Job card container loaded');
        } catch (error) {
            console.error(`Error loading page: ${baseUrl}. Skipping to next URL.`);
            continue; // Skip this baseUrl and move to the next one
        }

        let hasNextPage = true;
        let pageNumber = 1;

        await new Promise(resolve => setTimeout(resolve, 1000));

        while (hasNextPage) {
            await page.evaluate(async () => {
                const list = document.querySelector('.scaffold-layout__list > div');
                if (list) {
                    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
                    setTimeout(() => list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' }), 2000);
                }
            });

            await new Promise(resolve => setTimeout(resolve, 3000));

            console.log('Scraping current page');

            let jobLinks = await page.evaluate(() => {
                const links = [];
                const jobElements = document.querySelectorAll('.job-card-container__link');
                jobElements.forEach(jobElement => {
                    const href = jobElement.href;
                    if (href) {
                        links.push(href);
                    }
                });
                return links;
            });

            console.log(`Found ${jobLinks.length} job links on the current page.`);
            await page.goto('https://www.google.com');
            await new Promise(resolve => setTimeout(resolve, 3000));

            for (const link of jobLinks) {
                page.goto('https://www.google.com');
                await new Promise(resolve => setTimeout(resolve, 3000));

                try {
                    await page.goto(link, { timeout: 30000 });
                    console.log('Job details page loaded');
                    await page.waitForSelector('.jobs-description__container', { timeout: 20000 });
                    console.log('Job details container loaded');

                    const jobDetail = await page.evaluate(() => {
                        const titleElement = document.querySelector('.job-details-jobs-unified-top-card__job-title h1');
                        console.log('Title element:', titleElement);
                        const title = titleElement ? titleElement.innerText.trim() : 'Brak tytułu';

                        const companyElement = document.querySelector('.job-details-jobs-unified-top-card__company-name');
                        console.log('Company element:', companyElement);
                        const company = companyElement ? companyElement.innerText.trim() : 'Brak firmy';

                        const descriptionElement = document.querySelector('.jobs-description__container');
                        const description = descriptionElement ? descriptionElement.innerText.trim() : 'Brak opisu';

                        return { title, description, company, link: window.location.href };
                    });

                    console.log('Job details:', jobDetail.company, jobDetail.title);
                    allJobDetails.push(jobDetail);
                } catch (error) {
                    console.error(`Error scraping job details: ${link}. Skipping to next job.`);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 3000));

            try {
                await page.goto(baseUrl);
            } catch (error) {
                console.error(`Error navigating to base URL: ${baseUrl}. Skipping to next iteration.`);
                continue; // Skip this iteration and move to the next one
            }

            await new Promise(resolve => setTimeout(resolve, 3000));

            pageNumber++;
            await new Promise(resolve => setTimeout(resolve, 3000));

            try {
                hasNextPage = await page.evaluate((pageNumber) => {
                    const nextPageButton = document.querySelector(
                        `li[data-test-pagination-page-btn="${pageNumber}"].artdeco-pagination__indicator > button`
                    );
                    if (nextPageButton) {
                        nextPageButton.click();
                        return true;
                    }
                    return false;
                }, pageNumber);
            } catch (error) {
                console.error('Error navigating to next page. Stopping pagination.');
                hasNextPage = false;
            }

            console.log('Next page:', hasNextPage);

            if (hasNextPage) {
                try {
                    await page.waitForSelector('.scaffold-layout__list', { timeout: 10000 });
                    console.log('Job card loaded');
                    await page.waitForSelector('.job-card-container__link', { timeout: 10000 });
                    console.log('Job card container loaded');
                    baseUrl = await page.evaluate(() => window.location.href);
                } catch (error) {
                    console.error('Error loading new page content. Stopping pagination.');
                    hasNextPage = false;
                }
            }
        }
    }

    return allJobDetails;
}

module.exports = { scrapeLinkedInJobs };