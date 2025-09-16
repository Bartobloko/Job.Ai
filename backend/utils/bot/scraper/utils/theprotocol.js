// Funkcja scrape dla TheProtocol.it
async function scrapeTheProtocol(page, customLinks = null) {
    console.log('Scraping TheProtocol.it');

    // Use custom links if provided, otherwise use default
    const linksToScrape = customLinks ?
        JSON.parse(customLinks) :
        ['https://theprotocol.it/filtry/angular;t/junior;p?sort=date'];

    let allJobDetails = [];

    for (const url of linksToScrape) {
        await page.goto(url);
        await page.waitForSelector('.o1onjy6t'); // Dopasuj selektor do struktury strony

        const jobLinks = await page.evaluate(() => {
            const links = [];
            const jobElements = document.querySelectorAll('.o1onjy6t a'); // Dopasuj selektor
            jobElements.forEach(jobElement => {
                links.push(jobElement.href);
            });
            return links;
        });

        console.log('Found links on TheProtocol:', jobLinks.length);

        const jobDetails = [];
        for (const link of jobLinks) {
            await page.goto(link);
            await page.waitForSelector('.bptj5gp'); // Dopasuj selektor do strony z detalami

            const jobDetail = await page.evaluate(() => {
                const titleElement = document.querySelector('.hfjoyyq div > div > h1'); // Dopasuj selektor
                const title = titleElement ? titleElement.innerText : 'Brak tytułu';

                // Zbieranie i łączenie opisów
                const descriptionElements = document.querySelectorAll('.bptj5gp'); // Wszystkie elementy opisu
                const description = Array.from(descriptionElements)
                    .map(el => el.innerText.trim()) // Pobieranie tekstu i usuwanie zbędnych spacji
                    .join('\n'); // Łączenie w jeden ciąg, każdy element w nowej linii

                const company = document.querySelector('.c1vxjvoe') ? document.querySelector('.c1vxjvoe').innerText : 'Brak firmy';

                return { title, description, company, link: window.location.href };
            });

            jobDetails.push(jobDetail);
            await page.goBack();
            await page.waitForSelector('.o1onjy6t'); // Dopasuj selektor
        }

        allJobDetails = [...allJobDetails, ...jobDetails];
    }

    return allJobDetails;
}

module.exports = { scrapeTheProtocol };