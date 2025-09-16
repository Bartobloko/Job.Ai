import puppeteer, { Page, Browser } from 'puppeteer';
import { scrapeTalentCom } from './utils/talent';
import { scrapeLinkedInJobs } from './utils/linkedin';
import { scrapeNoFluffJobs } from './utils/nofluffjobs';
import { scrapeTheProtocol } from './utils/theprotocol';
import { scrapeJustJoin } from './utils/justjoin';
import { getAccountSettings, type AccountSettings } from './utils/utils';
import { ScrapedJob } from '../../../types';

async function scrapeJobOffers(accountId: number): Promise<ScrapedJob[]> {
  // Get account settings including LinkedIn cookie and custom links
  let accountSettings: AccountSettings;
  try {
    accountSettings = await getAccountSettings(accountId);
  } catch (error: any) {
    console.error(`Error retrieving account settings: ${error.message}`);
    accountSettings = {}; // Use default settings if we can't get account settings
  }

  const browser: Browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 920, height: 680 } 
  });
  const page: Page = await browser.newPage();

  // Set LinkedIn cookie if available
  if (accountSettings.linkedIn_li_at_cookie) {
    const cookie = {
      name: 'li_at',
      value: accountSettings.linkedIn_li_at_cookie,
      domain: '.www.linkedin.com',
      path: '/',
      httpOnly: true,
      secure: true,
    };
    await page.setCookie(cookie);
    console.log('LinkedIn cookie set from account settings');
  } else {
    console.log('No LinkedIn cookie found in account settings, using default behavior');
  }

  const allJobDetails: ScrapedJob[] = [];

  // Scrape each site with custom links if available
  try {
    const justJoinJobs = await scrapeJustJoin(page, accountSettings.justJoin_links || null);
    allJobDetails.push(...justJoinJobs);
  } catch (error: any) {
    console.error('Error scraping JustJoin.it:', error.message);
  }

  try {
    const protocolJobs = await scrapeTheProtocol(page, accountSettings.theProtocol_links || null);
    allJobDetails.push(...protocolJobs);
  } catch (error: any) {
    console.error('Error scraping TheProtocol.it:', error.message);
  }

  try {
    const noFluffJobs = await scrapeNoFluffJobs(page, accountSettings.noFluffJobs_links || null);
    allJobDetails.push(...noFluffJobs);
  } catch (error: any) {
    console.error('Error scraping NoFluffJobs:', error.message);
  }

  try {
    const linkedInJobs = await scrapeLinkedInJobs(
      page, 
      accountSettings.linkedIn_links || null, 
      accountSettings.linkedIn_li_at_cookie || null
    );
    allJobDetails.push(...linkedInJobs);
  } catch (error: any) {
    console.error('Error scraping LinkedIn Jobs:', error.message);
  }

  try {
    const talentJobs = await scrapeTalentCom(page, accountSettings.talent_links || null);
    allJobDetails.push(...talentJobs);
  } catch (error: any) {
    console.error('Error scraping Talent.com:', error.message);
  }

  await browser.close();
  console.log('Browser closed');
  return allJobDetails;
}

export { scrapeJobOffers };