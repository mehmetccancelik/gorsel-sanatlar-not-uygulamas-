/**
 * Emlakjet.com Scraper
 * Extracts property listing data from emlakjet.com
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function scrape(url) {
    let browser;

    try {
        console.log('🚀 Launching browser for Emlakjet...');

        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('📄 Loading page...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('h1, [class*="title"]', { timeout: 10000 });

        console.log('🔍 Extracting data...');
        const data = await page.evaluate(() => {
            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.textContent.trim() : '';
            };

            // Title
            const title = getText('h1') || getText('[class*="title"]');

            // Price
            const priceText = getText('[class*="price"], [class*="fiyat"]');
            const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;

            // Photos
            const photos = Array.from(document.querySelectorAll('[class*="gallery"] img, [class*="photo"] img'))
                .map(img => img.src || img.getAttribute('data-src'))
                .filter(src => src && src.startsWith('http'))
                .slice(0, 10);

            // Details
            const details = {};
            document.querySelectorAll('[class*="feature"] li, [class*="detail"] li, table tr').forEach(el => {
                const label = el.querySelector('th, span:first-child, strong');
                const value = el.querySelector('td, span:last-child');
                if (label && value) {
                    details[label.textContent.trim()] = value.textContent.trim();
                }
            });

            // Description
            const description = getText('[class*="description"], [class*="aciklama"], [class*="content"]');

            // Location
            const location = getText('[class*="location"], [class*="address"]');

            return {
                title,
                price,
                area: parseInt((details['Net m²'] || details['m²'] || '0').replace(/[^\d]/g, '')),
                rooms: details['Oda Sayısı'] || '',
                floor: details['Kat'] || '',
                buildingAge: details['Bina Yaşı'] || '',
                photos,
                description,
                location,
                details
            };
        });

        await browser.close();
        return normalizeData(data, url);

    } catch (error) {
        if (browser) await browser.close();
        throw new Error(`Emlakjet scraping hatası: ${error.message}`);
    }
}

function normalizeData(raw, sourceUrl) {
    return {
        name: raw.title || 'İsimsiz İlan',
        price: raw.price || 0,
        area: raw.area || 0,
        location: raw.location || 'Konum belirtilmedi',
        estimatedRent: Math.round(raw.price * 0.004),
        source: 'Emlakjet',
        sourceUrl: sourceUrl,
        fetchedAt: new Date().toISOString(),
        rooms: raw.rooms || '-',
        floor: raw.floor || '-',
        buildingAge: raw.buildingAge || '-',
        sqmPrice: raw.area > 0 ? Math.round(raw.price / raw.area) : 0,
        photos: raw.photos || [],
        description: raw.description || 'Açıklama yok',
        features: raw.details || {},
        contact: {
            name: 'Satıcı',
            type: 'Emlakjet',
            phone: 'Site üzerinden iletişim'
        },
        fullLocation: raw.location || 'Türkiye'
    };
}

module.exports = { scrape };
