import { Page } from 'puppeteer';
import { ScrapedJob } from '../../../../types';

// Function to scrape JustJoin.it
async function scrapeJustJoin(page: Page, customLinks: string | null = null): Promise<ScrapedJob[]> {
  console.log('Scraping JustJoin.it');

  // Use custom links if provided, otherwise use default
  const linksToScrape: string[] = customLinks ?
    JSON.parse(customLinks) :
    ['https://justjoin.it/job-offers/all-locations/javascript?experience-level=junior&working-hours=full-time&orderBy=DESC&sortBy=newest&from=0'];

  let allJobDetails: ScrapedJob[] = [];

  for (const url of linksToScrape) {
    try {
      await page.goto(url);
      await page.waitForSelector('.css-2kppws', { timeout: 10000 });

      const jobLinks = await page.evaluate(() => {
        const links: string[] = [];
        const jobElements = document.querySelectorAll('.css-2kppws a[href^="/job-offer"]');
        jobElements.forEach(jobElement => {
          links.push((jobElement as HTMLAnchorElement).href);
        });
        return links;
      });

      console.log('Found links on JustJoin:', jobLinks.length);

      const jobDetails: ScrapedJob[] = [];
      for (const link of jobLinks.slice(0, 5)) { // Limit to 5 jobs for demo
        try {
          await page.goto(link);
          await page.waitForSelector('.MuiBox-root.css-tbycqp', { timeout: 5000 });

          const jobDetail = await page.evaluate((): ScrapedJob => {
            const titleElement = document.querySelector('.css-s52zl1 h1') as HTMLElement;
            const title = titleElement ? titleElement.innerText : 'No title';
            const descriptionElement = document.querySelector('.MuiBox-root.css-tbycqp') as HTMLElement;
            const description = descriptionElement ? descriptionElement.innerText : 'No description';
            const companyElement = document.querySelector('.MuiTypography-root.MuiTypography-body1.css-77dijd') as HTMLElement;
            const company = companyElement ? companyElement.innerText : 'No company';

            return { title, description, company, link: window.location.href };
          });

          jobDetails.push(jobDetail);
          await page.goBack();
          await page.waitForSelector('.css-2kppws', { timeout: 5000 });
        } catch (error) {
          console.error(`Error scraping job ${link}:`, error);
          continue;
        }
      }

      allJobDetails = [...allJobDetails, ...jobDetails];
    } catch (error) {
      console.error(`Error scraping URL ${url}:`, error);
      continue;
    }
  }

  return allJobDetails;
}

export { scrapeJustJoin };