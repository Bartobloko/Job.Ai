import { Page } from 'puppeteer';
import { ScrapedJob } from '../../../../types';

// Function to scrape TheProtocol.it
async function scrapeTheProtocol(page: Page, customLinks: string | null = null): Promise<ScrapedJob[]> {
  console.log('Scraping TheProtocol.it');

  // Use custom links if provided, otherwise use default
  const linksToScrape: string[] = customLinks ?
    JSON.parse(customLinks) :
    ['https://theprotocol.it/jobs'];

  let allJobDetails: ScrapedJob[] = [];

  for (const url of linksToScrape) {
    try {
      await page.goto(url);
      await page.waitForSelector('.job-card', { timeout: 10000 });

      const jobLinks = await page.evaluate(() => {
        const links: string[] = [];
        const jobElements = document.querySelectorAll('.job-card a');
        jobElements.forEach(jobElement => {
          const href = (jobElement as HTMLAnchorElement).href;
          if (href) {
            links.push(href);
          }
        });
        return links;
      });

      console.log('Found links on TheProtocol:', jobLinks.length);

      const jobDetails: ScrapedJob[] = [];
      for (const link of jobLinks.slice(0, 5)) { // Limit to 5 jobs for demo
        try {
          await page.goto(link);
          await page.waitForSelector('.job-details', { timeout: 5000 });

          const jobDetail = await page.evaluate((): ScrapedJob => {
            const titleElement = document.querySelector('h1.job-title') as HTMLElement;
            const title = titleElement ? titleElement.innerText : 'No title';
            const descriptionElement = document.querySelector('.job-details') as HTMLElement;
            const description = descriptionElement ? descriptionElement.innerText : 'No description';
            const companyElement = document.querySelector('.company-name') as HTMLElement;
            const company = companyElement ? companyElement.innerText : 'No company';

            return { title, description, company, link: window.location.href };
          });

          jobDetails.push(jobDetail);
        } catch (error) {
          console.error(`Error scraping TheProtocol job ${link}:`, error);
          continue;
        }
      }

      allJobDetails = [...allJobDetails, ...jobDetails];
    } catch (error) {
      console.error(`Error scraping TheProtocol URL ${url}:`, error);
      continue;
    }
  }

  return allJobDetails;
}

export { scrapeTheProtocol };