/**
 * Mantıklı Ev Alma - Backend Scraping Server
 * Express + Puppeteer for real estate listing scraping
 */

const express = require('express');
const cors = require('cors');
const scrapers = require('./scrapers');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: '*', // Accept all origins including file:// (null)
    methods: ['GET', 'POST'],
    credentials: false // Must be false when using origin: '*'
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main scraping endpoint
app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL gerekli'
        });
    }

    console.log(`📥 Scraping request: ${url}`);

    try {
        // Validate and detect platform
        const platform = detectPlatform(url);
        if (!platform) {
            return res.status(400).json({
                success: false,
                error: 'Desteklenmeyen site. Sahibinden, Hepsiemlak veya Emlakjet kullanın.'
            });
        }

        // Select appropriate scraper
        const scraper = scrapers[platform];
        if (!scraper) {
            return res.status(500).json({
                success: false,
                error: `${platform} scraper henüz hazır değil`
            });
        }

        // Scrape the listing
        console.log(`🔍 Using ${platform} scraper...`);
        const data = await scraper.scrape(url);

        console.log(`✅ Scraped successfully: ${data.name}`);
        res.json({
            success: true,
            platform,
            data
        });

    } catch (error) {
        console.error(`❌ Scraping error:`, error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Veri çekilemedi'
        });
    }
});

// Platform detection
function detectPlatform(url) {
    if (/sahibinden\.com\/ilan/.test(url)) return 'sahibinden';
    if (/hepsiemlak\.com\/(satilik|kiralik)/.test(url)) return 'hepsiemlak';
    if (/emlakjet\.com\/ilan/.test(url)) return 'emlakjet';
    return null;
}

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🏠 Mantıklı Ev Alma - Scraping Backend   ║
║   Running on http://localhost:${PORT}         ║
╚════════════════════════════════════════════╝
    `);
});
