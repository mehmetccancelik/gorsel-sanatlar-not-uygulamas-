/**
 * Sahibinden.com Scraper
 * Extracts property listing data from sahibinden.com
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

async function scrape(url) {
    let browser;

    try {
        console.log('🚀 Launching browser for Sahibinden...');

        browser = await puppeteer.launch({
            headless: false, // Visible browser - harder to detect
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();

        // Enhanced anti-detection
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Remove webdriver property
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = { runtime: {} };
        });

        // Add cookies to appear as returning user
        await page.setCookie({
            name: 'visited',
            value: 'true',
            domain: '.sahibinden.com'
        });

        // Navigate to page with longer timeout
        console.log('📄 Loading page...');
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Wait extra time for any JS to execute
        await page.waitForTimeout(3000);

        // Check if we hit a security page
        const pageUrl = page.url();
        if (pageUrl.includes('secure.sahibinden.com')) {
            console.log('⚠️ Security page detected, waiting...');
            await page.waitForTimeout(5000);
            // Try navigating again
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
            await page.waitForTimeout(3000);
        }

        // Wait for main content
        try {
            await page.waitForSelector('.classifiedDetailTitle, h1, .classified-detail-title', { timeout: 15000 });
        } catch (e) {
            console.log('⚠️ Main selector not found, trying alternative...');
        }

        // Extract data
        console.log('🔍 Extracting data...');
        const data = await page.evaluate(() => {
            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.textContent.trim() : '';
            };

            const getTexts = (selector) => {
                return Array.from(document.querySelectorAll(selector))
                    .map(el => el.textContent.trim());
            };

            const getAttr = (selector, attr) => {
                const el = document.querySelector(selector);
                return el ? el.getAttribute(attr) : '';
            };

            // Title
            const title = getText('.classifiedDetailTitle h1') || getText('h1');

            // Price
            const priceText = getText('.classifiedInfo h3') || getText('[class*="price"]');
            const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;

            // Photos
            const photos = Array.from(document.querySelectorAll('.classifiedDetailPhotos img, .thmbImg img'))
                .map(img => img.src || img.getAttribute('data-src'))
                .filter(src => src && !src.includes('placeholder'))
                .slice(0, 10);

            // Details table
            const details = {};
            document.querySelectorAll('.classifiedInfoList li, .classifiedInfo ul li').forEach(li => {
                const label = li.querySelector('strong, span:first-child');
                const value = li.querySelector('span:last-child, a');
                if (label && value) {
                    details[label.textContent.trim().replace(':', '')] = value.textContent.trim();
                }
            });

            // Description
            const description = getText('#classifiedDescription, .classifiedDescription, [class*="description"]');

            // Location
            const location = getText('.classifiedInfo h2 a') || getText('[class*="location"]');

            // Seller info
            const sellerName = getText('.username-info-area h5, .classified-owner-name');
            const sellerPhone = getText('.phone-number, [class*="phone"]');

            // Extract specific fields
            const area = parseInt((details['m² (Brüt)'] || details['m² (Net)'] || '0').replace(/[^\d]/g, ''));
            const rooms = details['Oda Sayısı'] || '';
            const floor = details['Bulunduğu Kat'] || '';
            const buildingAge = details['Bina Yaşı'] || '';

            return {
                title,
                price,
                area,
                rooms,
                floor,
                buildingAge,
                photos,
                description,
                location,
                details,
                contact: {
                    name: sellerName,
                    phone: sellerPhone
                }
            };
        });

        // Close browser
        await browser.close();

        // Normalize data
        return normalizeData(data, url);

    } catch (error) {
        if (browser) await browser.close();
        throw new Error(`Sahibinden scraping hatası: ${error.message}`);
    }
}

function normalizeData(raw, sourceUrl) {
    return {
        // Basic info
        name: raw.title || 'İsimsiz İlan',
        price: raw.price || 0,
        area: raw.area || 0,
        location: raw.location || 'Konum belirtilmedi',
        estimatedRent: Math.round(raw.price * 0.004), // Rough estimate
        source: 'Sahibinden',
        sourceUrl: sourceUrl,
        fetchedAt: new Date().toISOString(),

        // Extended info
        rooms: raw.rooms || '-',
        floor: raw.floor || '-',
        buildingAge: raw.buildingAge || '-',
        sqmPrice: raw.area > 0 ? Math.round(raw.price / raw.area) : 0,

        // Rich content
        photos: raw.photos || [],
        description: raw.description || 'Açıklama yok',
        features: raw.details || {},

        // Contact
        contact: {
            name: raw.contact?.name || 'Satıcı',
            type: 'Sahibinden',
            phone: raw.contact?.phone || 'Telefon gizli'
        },

        // Location
        fullLocation: raw.location || 'Türkiye'
    };
}

module.exports = { scrape };
