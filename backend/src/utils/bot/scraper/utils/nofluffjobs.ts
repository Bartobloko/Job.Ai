import { Page } from 'puppeteer';
import { ScrapedJob } from '../../../../types';

// Function to scrape NoFluffJobs
async function scrapeNoFluffJobs(page: Page, customLinks: string | null = null): Promise<ScrapedJob[]> {
  console.log('Scraping NoFluffJobs');

  // Use custom links if provided, otherwise use default
  const linksToScrape: string[] = customLinks ?
    JSON.parse(customLinks) :
    ['https://nofluffjobs.com/jobs/javascript'];

  let allJobDetails: ScrapedJob[] = [];

  for (const url of linksToScrape) {
    try {
      await page.goto(url);
      await page.waitForSelector('[data-cy="job-item"]', { timeout: 10000 });

      const jobLinks = await page.evaluate(() => {
        const links: string[] = [];
        const jobElements = document.querySelectorAll('[data-cy="job-item"] a');
        jobElements.forEach(jobElement => {
          const href = (jobElement as HTMLAnchorElement).href;
          if (href) {
            links.push(href);
          }
        });
        return links;
      });

      console.log('Found links on NoFluffJobs:', jobLinks.length);

      const jobDetails: ScrapedJob[] = [];
      for (const link of jobLinks.slice(0, 5)) { // Limit to 5 jobs for demo
        try {
          await page.goto(link);
          await page.waitForSelector('.job-description', { timeout: 5000 });

          const jobDetail = await page.evaluate((): ScrapedJob => {
            const titleElement = document.querySelector('h1.job-title') as HTMLElement;
            const title = titleElement ? titleElement.innerText : 'No title';
            const descriptionElement = document.querySelector('.job-description') as HTMLElement;
            const description = descriptionElement ? descriptionElement.innerText : 'No description';
            const companyElement = document.querySelector('.company-name') as HTMLElement;
            const company = companyElement ? companyElement.innerText : 'No company';

            return { title, description, company, link: window.location.href };
          });

          jobDetails.push(jobDetail);
        } catch (error) {
          console.error(`Error scraping NoFluffJobs job ${link}:`, error);
          continue;
        }
      }

      allJobDetails = [...allJobDetails, ...jobDetails];
    } catch (error) {
      console.error(`Error scraping NoFluffJobs URL ${url}:`, error);
      continue;
    }
  }

  return allJobDetails;
}

export { scrapeNoFluffJobs };