/**
 * Mantıklı Ev Alma - Main Application
 * Smart Home Buying Analysis PWA
 */

// ===============================
// App State
// ===============================
const AppState = {
    currentTab: 'dashboard',
    homes: [],
    currentHome: null,
    settings: {
        defaultInterest: 2.5,
        defaultInflation: 40,
        defaultRentIncrease: 25,
        defaultAppreciation: 30,
        targetAmortizationYears: 15,
        riskProfile: 'TEMKINLI',
        darkMode: true
    },
    user: null,
    isLoading: true
};

// ===============================
// DOM Elements
// ===============================
const DOM = {
    // Screens
    splashScreen: document.getElementById('splash-screen'),
    app: document.getElementById('app'),

    // Tabs
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Stats
    statHomes: document.getElementById('stat-homes'),
    statBestScore: document.getElementById('stat-best-score'),
    statAvgPrice: document.getElementById('stat-avg-price'),

    // Lists
    homesList: document.getElementById('homes-list'),

    // Buttons
    btnAddFirstHome: document.getElementById('btn-add-first-home'),
    btnAddHome: document.getElementById('btn-add-home'),
    fabAdd: document.getElementById('fab-add'),
    btnSettings: document.getElementById('btn-settings'),
    btnUser: document.getElementById('btn-user'),
    btnGoogleLogin: document.getElementById('btn-google-login'),
    btnGuestMode: document.getElementById('btn-guest-mode'),

    // Modals
    modalHomeForm: document.getElementById('modal-home-form'),
    modalAnalysis: document.getElementById('modal-analysis'),
    modalLogin: document.getElementById('modal-login'),
    modalSettings: document.getElementById('modal-settings'),

    // Forms
    homeForm: document.getElementById('home-form'),

    // Toast
    toastContainer: document.getElementById('toast-container')
};

// ===============================
// Initialization
// ===============================
async function initApp() {
    console.log('🏠 Mantıklı Ev Alma - Initializing...');

    // Load saved data
    loadFromStorage();

    // Setup event listeners
    setupEventListeners();

    // Simulate loading
    await delay(1500);

    // Hide splash, show app
    DOM.splashScreen.classList.add('hidden');
    DOM.app.classList.remove('hidden');

    // Update UI
    updateStats();
    renderHomesList();

    // Check for extension data on load
    checkAndImportExtensionData();

    console.log('✅ App initialized successfully');
}

// ===============================
// Event Listeners
// ===============================
function setupEventListeners() {
    // Tab navigation
    DOM.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Add home buttons - use arrow functions to avoid passing event as first argument
    DOM.btnAddFirstHome?.addEventListener('click', () => openHomeForm());
    DOM.btnAddHome?.addEventListener('click', () => openHomeForm());
    DOM.fabAdd?.addEventListener('click', () => openHomeForm());

    // Settings & User
    DOM.btnSettings?.addEventListener('click', () => openModal('modal-settings'));
    DOM.btnUser?.addEventListener('click', () => openModal('modal-login'));

    // Login buttons
    DOM.btnGoogleLogin?.addEventListener('click', handleGoogleLogin);
    DOM.btnGuestMode?.addEventListener('click', handleGuestMode);

    // Home form submission
    DOM.homeForm?.addEventListener('submit', handleHomeFormSubmit);

    // URL Fetch button
    document.getElementById('btn-fetch-url')?.addEventListener('click', handleUrlFetch);

    // Modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Modal backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', closeAllModals);
    });

    // Listen for paste from extension
    document.addEventListener('paste', handleExtensionPaste);

    // Check for extension data on focus
    window.addEventListener('focus', checkExtensionData);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });
}

// ===============================
// Tab Navigation
// ===============================
function switchTab(tabId) {
    AppState.currentTab = tabId;

    // Update tab buttons
    DOM.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update tab contents
    DOM.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    // Render tab-specific content
    if (tabId === 'compare') renderCompareTab();
    if (tabId === 'scenarios') renderScenariosTab();
}

// ===============================
// Modal Management
// ===============================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// ===============================
// Home Form
// ===============================
function openHomeForm(home = null) {
    AppState.currentHome = home;

    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = home ? 'Ev Düzenle' : 'Yeni Ev Ekle';
    }

    // Reset or populate form
    if (DOM.homeForm) {
        if (home) {
            // Populate form with existing home data
            populateHomeForm(home);
        } else {
            DOM.homeForm.reset();
            // Set default values
            document.getElementById('home-term').value = 120;
            document.getElementById('home-rent-increase').value = 25;
            document.getElementById('home-inflation').value = AppState.settings.defaultInflation;
            document.getElementById('home-appreciation').value = 30;
        }
    }

    openModal('modal-home-form');
}

function populateHomeForm(home) {
    document.getElementById('home-name').value = home.name || '';
    document.getElementById('home-price').value = home.price || '';
    document.getElementById('home-area').value = home.area || '';
    document.getElementById('home-location').value = home.location || '';
    document.getElementById('home-downpayment').value = home.downpayment || '';
    document.getElementById('home-interest').value = home.interest || '';
    document.getElementById('home-term').value = home.term || 120;
    document.getElementById('home-rent').value = home.rent || '';
    document.getElementById('home-rent-increase').value = home.rentIncrease || 25;
    document.getElementById('home-inflation').value = home.inflation || 40;
    document.getElementById('home-appreciation').value = home.appreciation || 30;
}

async function handleHomeFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const homeData = {
        id: AppState.currentHome?.id || generateId(),
        name: formData.get('name'),
        price: parseFloat(formData.get('price')) || 0,
        area: parseFloat(formData.get('area')) || 0,
        location: formData.get('location'),
        downpayment: parseFloat(formData.get('downpayment')) || 0,
        interest: parseFloat(formData.get('interest')) || AppState.settings.defaultInterest,
        term: parseInt(formData.get('term')) || 120,
        rent: parseFloat(formData.get('rent')) || 0,
        rentIncrease: parseFloat(formData.get('rentIncrease')) || 25,
        inflation: parseFloat(formData.get('inflation')) || 40,
        appreciation: parseFloat(formData.get('appreciation')) || 30,
        sourceUrl: AppState.currentHome?.sourceUrl || AppState.currentListingUrl || '',
        createdAt: AppState.currentHome?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Calculate analysis
    homeData.analysis = calculateHomeAnalysis(homeData);

    // Save home
    if (AppState.currentHome) {
        // Update existing
        const index = AppState.homes.findIndex(h => h.id === homeData.id);
        if (index !== -1) {
            AppState.homes[index] = homeData;
        }
    } else {
        // Add new
        AppState.homes.push(homeData);
    }

    // Save to storage
    saveToStorage();

    // Update UI
    updateStats();
    renderHomesList();

    // Close form and show analysis
    closeAllModals();
    showAnalysis(homeData);

    showToast('Ev analizi kaydedildi!', 'success');
}

// ===============================
// URL Scraping Handler
// ===============================
async function handleUrlFetch() {
    const urlInput = document.getElementById('listing-url');
    const statusDiv = document.getElementById('url-status');
    const fetchBtn = document.getElementById('btn-fetch-url');
    const url = urlInput?.value?.trim();

    if (!url) {
        showUrlStatus('⚠️ Lütfen bir ilan linki girin', 'warning');
        return;
    }

    // Validate URL
    const validationResult = validateListingUrl(url);
    if (!validationResult.valid) {
        showUrlStatus(`❌ ${validationResult.message}`, 'error');
        return;
    }

    // Show loading state
    fetchBtn.disabled = true;
    fetchBtn.innerHTML = '<span class="btn-icon">⏳</span> Çekiliyor...';
    showUrlStatus('🔄 Backend üzerinden bilgiler çekiliyor...', 'loading');

    try {
        // Try backend scraping first
        const data = await fetchListingData(url, validationResult.platform);

        if (data && data.price > 0) {
            // Success! Populate form
            populateFormFromScrapedData(data);
            showUrlStatus(`✅ ${validationResult.platform} ilanından bilgiler çekildi!`, 'success');
            showToast('İlan bilgileri otomatik yüklendi!', 'success');

            // Store for listing detail
            AppState.currentListing = data;
            AppState.currentListingUrl = url;
            AppState.currentListingPlatform = validationResult.platform;
        } else {
            // Backend returned empty data, fall back to popup
            throw new Error('Veri çekilemedi');
        }
    } catch (error) {
        console.log('⚠️ Backend failed, opening popup for manual entry:', error.message);
        showUrlStatus('⚠️ Otomatik çekim başarısız. Manuel giriş paneli açılıyor...', 'warning');

        // Fall back to popup-based manual entry
        closeAllModals();
        openListingViewer(url, validationResult.platform);
    } finally {
        // Reset button
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = '<span class="btn-icon">🔍</span> Çek';
    }
}

// ===============================
// Popup-Based Listing Viewer
// ===============================
function openListingViewer(url, platform) {
    // Store the URL for later use
    AppState.currentListingUrl = url;
    AppState.currentListingPlatform = platform;

    // Open the listing in a new window
    const popupWidth = 900;
    const popupHeight = 700;
    const left = (window.screen.width - popupWidth) / 2;
    const top = (window.screen.height - popupHeight) / 2;

    const listingPopup = window.open(
        url,
        'SahibindenListing',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    // Show the side-by-side data entry modal
    showDataEntryPanel(url, platform);

    // Focus instructions
    showToast('📋 İlan sayfası açıldı! Bilgileri yan panelden girin.', 'info');
}

function showDataEntryPanel(url, platform) {
    // Create or show the data entry panel
    let panel = document.getElementById('data-entry-panel');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'data-entry-panel';
        panel.className = 'data-entry-panel';
        panel.innerHTML = `
            <div class="data-entry-header">
                <h3>📋 İlan Bilgilerini Girin</h3>
                <p>Yan penceredeki ${platform} ilanından bilgileri buraya girin</p>
                <button class="btn-close-panel" onclick="closeDataEntryPanel()">×</button>
            </div>
            
            <div class="data-entry-content">
                <div class="quick-entry-section">
                    <h4>🏷️ Hızlı Giriş</h4>
                    <p class="hint">İlan sayfasından kopyala-yapıştır yapın</p>
                    
                    <div class="quick-field">
                        <label>Fiyat</label>
                        <input type="text" id="quick-price" placeholder="Örn: 5.500.000 TL">
                    </div>
                    
                    <div class="quick-field">
                        <label>m² (Net)</label>
                        <input type="text" id="quick-area" placeholder="Örn: 120 m²">
                    </div>
                    
                    <div class="quick-field">
                        <label>Oda Sayısı</label>
                        <input type="text" id="quick-rooms" placeholder="Örn: 3+1">
                    </div>
                    
                    <div class="quick-field">
                        <label>Konum</label>
                        <input type="text" id="quick-location" placeholder="Örn: Kadıköy, Moda">
                    </div>
                    
                    <div class="quick-field">
                        <label>Bölge Kirası (Tahmini)</label>
                        <input type="text" id="quick-rent" placeholder="Örn: 25.000 TL">
                    </div>
                </div>
                
                <div class="data-entry-actions">
                    <button class="btn btn-secondary" onclick="closeDataEntryPanel()">İptal</button>
                    <button class="btn btn-primary" onclick="applyQuickEntryData()">
                        <span class="btn-icon">✓</span>
                        Bilgileri Uygula
                    </button>
                </div>
                
                <div class="copy-tips">
                    <h4>💡 İpuçları</h4>
                    <ul>
                        <li>Fiyatı doğrudan kopyalayın (TL, ₺ vs. sorun değil)</li>
                        <li>m² değerini net olarak girin</li>
                        <li>Kira tahmini için benzer ilanları kontrol edin</li>
                    </ul>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
    }

    panel.classList.add('active');
}

function closeDataEntryPanel() {
    const panel = document.getElementById('data-entry-panel');
    if (panel) {
        panel.classList.remove('active');
    }
}

function applyQuickEntryData() {
    // Get values and parse numbers
    const parseNumber = (str) => {
        if (!str) return 0;
        return parseInt(str.replace(/[^\d]/g, '')) || 0;
    };

    const priceVal = parseNumber(document.getElementById('quick-price')?.value);
    const areaVal = parseNumber(document.getElementById('quick-area')?.value);
    const roomsVal = document.getElementById('quick-rooms')?.value || '';
    const locationVal = document.getElementById('quick-location')?.value || '';
    const rentVal = parseNumber(document.getElementById('quick-rent')?.value);

    // Create listing data
    const data = {
        name: `${AppState.currentListingPlatform} - ${locationVal} ${roomsVal}`.trim(),
        price: priceVal,
        area: areaVal,
        location: locationVal,
        estimatedRent: rentVal || Math.round(priceVal * 0.004), // Estimate if not provided
        source: AppState.currentListingPlatform,
        sourceUrl: AppState.currentListingUrl,
        fetchedAt: new Date().toISOString(),
        rooms: roomsVal,
        floor: '-',
        buildingAge: '-',
        sqmPrice: areaVal > 0 ? Math.round(priceVal / areaVal) : 0,
        photos: [],
        description: 'Manuel giriş',
        features: {},
        contact: { name: 'İlan sahibi', type: AppState.currentListingPlatform, phone: '-' },
        fullLocation: locationVal
    };

    // Close panel and open home form with data
    closeDataEntryPanel();
    openHomeForm();

    // Populate form
    setTimeout(() => {
        populateFormFromScrapedData(data);
        showToast('✅ Bilgiler forma aktarıldı!', 'success');
    }, 300);
}

function validateListingUrl(url) {
    // More flexible patterns for each platform
    const platforms = [
        { name: 'Sahibinden', pattern: /sahibinden\.com/ },
        { name: 'Hepsiemlak', pattern: /hepsiemlak\.com/ },
        { name: 'Emlakjet', pattern: /emlakjet\.com/ }
    ];

    try {
        new URL(url);
    } catch {
        return { valid: false, message: 'Geçersiz URL formatı' };
    }

    for (const platform of platforms) {
        if (platform.pattern.test(url)) {
            return { valid: true, platform: platform.name };
        }
    }

    return { valid: false, message: 'Desteklenmeyen site. Sahibinden, Hepsiemlak veya Emlakjet linki girin.' };
}

async function fetchListingData(url, platform) {
    // Backend endpoint
    const API_ENDPOINT = 'http://localhost:3001/api/scrape';

    try {
        // Try real backend
        console.log('🔌 Connecting to backend...');
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, platform })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                console.log('✅ Real data fetched from backend:', result.data);
                return result.data;
            } else {
                throw new Error(result.error || 'Veri çekilemedi');
            }
        }
        throw new Error('Backend yanıt vermedi');

    } catch (error) {
        console.error('❌ Backend error:', error.message);
        // Don't use mock data - throw error so popup opens
        throw error;
    }
}

// ===============================
// Extension Data Handlers
// ===============================
function handleExtensionPaste(e) {
    try {
        const text = (e.clipboardData || window.clipboardData).getData('text');
        if (!text) return;

        // Try to parse as JSON (extension data)
        const data = JSON.parse(text);
        if (data && data.price && data.platform) {
            e.preventDefault();
            importExtensionData(data);
        }
    } catch {
        // Not JSON, ignore
    }
}

function checkExtensionData() {
    try {
        const stored = localStorage.getItem('mea_scraped_listing');
        if (!stored) return;

        const data = JSON.parse(stored);
        if (data && data.price && data.fetchedAt) {
            // Check if data is fresh (less than 5 minutes old)
            const fetchedAt = new Date(data.fetchedAt);
            const now = new Date();
            const diffMinutes = (now - fetchedAt) / 1000 / 60;

            if (diffMinutes < 5) {
                showToast('📋 Extension\'dan ilan verisi algılandı! Yapıştır (Ctrl+V) ile içe aktar.', 'info');
            }
        }
    } catch {
        // Ignore errors
    }
}

function importExtensionData(data) {
    console.log('📥 Importing extension data:', data);

    // Format for our app
    const formattedData = {
        name: data.name || data.title || 'İsimsiz İlan',
        price: data.price || 0,
        area: data.area || 0,
        location: data.location || '',
        estimatedRent: data.estimatedRent || Math.round((data.price || 0) * 0.004),
        rooms: data.rooms || '',
        floor: data.floor || '',
        buildingAge: data.buildingAge || '',
        description: data.description || '',
        source: data.platform || 'Extension',
        sourceUrl: data.sourceUrl || data.url || ''
    };

    // Store for later
    AppState.currentListingUrl = formattedData.sourceUrl;
    AppState.currentListingPlatform = data.platform;

    // Clear the stored data
    localStorage.removeItem('mea_scraped_listing');

    // Populate form
    populateFormFromScrapedData(formattedData);

    // Open form modal
    openHomeForm();

    showToast(`✅ ${data.platform || 'Extension'}'dan veriler yüklendi!`, 'success');
}

// Check and import extension data on page load
async function checkAndImportExtensionData() {
    try {
        // Try reading from clipboard
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText) {
            const data = JSON.parse(clipboardText);
            // Check if it's valid listing data from extension
            if (data && data.platform && data.fetchedAt) {
                // Check if data is fresh (less than 2 minutes old)
                const fetchedAt = new Date(data.fetchedAt);
                const now = new Date();
                const diffMinutes = (now - fetchedAt) / 1000 / 60;

                if (diffMinutes < 2) {
                    console.log('📋 Fresh extension data found in clipboard!');
                    importExtensionData(data);
                    // Clear clipboard after import
                    navigator.clipboard.writeText('').catch(() => { });
                }
            }
        }
    } catch {
        // Clipboard read not allowed or no valid data, ignore
    }
}

function generateMockListingData(url, platform) {
    // Generate realistic mock data for demo
    const locationPatterns = {
        'kadikoy': { district: 'Kadıköy', neighborhood: 'Moda', rent: 25000, sqmPrice: 50000 },
        'besiktas': { district: 'Beşiktaş', neighborhood: 'Etiler', rent: 30000, sqmPrice: 60000 },
        'uskudar': { district: 'Üsküdar', neighborhood: 'Çengelköy', rent: 20000, sqmPrice: 40000 },
        'bakirkoy': { district: 'Bakırköy', neighborhood: 'Yeşilköy', rent: 22000, sqmPrice: 45000 },
        'sariyer': { district: 'Sarıyer', neighborhood: 'İstinye', rent: 28000, sqmPrice: 55000 }
    };

    // Try to detect location from URL
    let location = locationPatterns['kadikoy']; // default
    let locationKey = 'kadikoy';
    for (const [key, val] of Object.entries(locationPatterns)) {
        if (url.toLowerCase().includes(key)) {
            location = val;
            locationKey = key;
            break;
        }
    }

    // Generate random but realistic values
    const area = 80 + Math.floor(Math.random() * 80); // 80-160 m²
    const rooms = Math.floor(area / 30) + 1;
    const price = area * location.sqmPrice * (0.9 + Math.random() * 0.2);
    const rent = location.rent * (0.8 + Math.random() * 0.4);
    const floor = Math.floor(Math.random() * 10) + 1;
    const totalFloors = floor + Math.floor(Math.random() * 5);
    const buildingAge = Math.floor(Math.random() * 20);
    const ilanNo = Math.floor(Math.random() * 900000000) + 100000000;

    // Mock photos (using placeholder images)
    const photos = [
        `https://placehold.co/800x600/1a1a2e/7c3aed?text=Salon`,
        `https://placehold.co/800x600/16213e/3b82f6?text=Yatak+Odası`,
        `https://placehold.co/800x600/0f3460/22c55e?text=Mutfak`,
        `https://placehold.co/800x600/1a1a2e/eab308?text=Banyo`,
        `https://placehold.co/800x600/16213e/ef4444?text=Balkon`
    ];

    // Mock description
    const descriptions = [
        `${location.district} ${location.neighborhood} mahallesinde, merkezi konumda, ${rooms}+1 satılık daire. Metro ve otobüs duraklarına yürüme mesafesinde. Bina ${buildingAge === 0 ? 'sıfır' : buildingAge + ' yaşında'}.`,
        `Ara kat, güney cephe, ferah ve aydınlık. Amerikan mutfak, geniş salon. Site içinde, 7/24 güvenlik, kapalı otopark mevcut.`,
        `Isıtma: Doğalgaz kombili. Eşyasız teslim edilecektir. Tapu ve kredi kullanıma uygundur.`
    ];

    // Detailed features
    const features = {
        'İlan No': ilanNo.toString(),
        'İlan Tarihi': new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR'),
        'Oda Sayısı': `${rooms}+1`,
        'Brüt m²': `${area + 10} m²`,
        'Net m²': `${area} m²`,
        'Bina Yaşı': buildingAge === 0 ? 'Sıfır' : `${buildingAge} Yaşında`,
        'Bulunduğu Kat': `${floor}. Kat`,
        'Kat Sayısı': `${totalFloors}`,
        'Isıtma': 'Doğalgaz (Kombi)',
        'Banyo Sayısı': rooms > 3 ? '2' : '1',
        'Balkon': Math.random() > 0.3 ? 'Var' : 'Yok',
        'Asansör': totalFloors > 4 ? 'Var' : 'Yok',
        'Otopark': Math.random() > 0.5 ? 'Kapalı Otopark' : 'Açık Otopark',
        'Site İçinde': Math.random() > 0.4 ? 'Evet' : 'Hayır',
        'Kullanım Durumu': 'Boş',
        'Tapu Durumu': 'Kat Mülkiyetli',
        'Krediye Uygun': 'Evet'
    };

    // Contact info
    const contactNames = ['Mehmet Yılmaz', 'Ayşe Kaya', 'Ali Demir', 'Fatma Çelik'];
    const contactTypes = ['Sahibinden', 'Emlak Ofisi', 'Yetkili Satıcı'];

    return {
        // Basic info (for form)
        name: `${platform} - ${location.district} ${rooms}+1`,
        price: Math.round(price / 100000) * 100000,
        area: area,
        location: `${location.district}, İstanbul`,
        estimatedRent: Math.round(rent / 1000) * 1000,
        source: platform,
        sourceUrl: url,
        fetchedAt: new Date().toISOString(),

        // Extended info (for detail panel)
        rooms: `${rooms}+1`,
        floor: `${floor}. Kat`,
        buildingAge: buildingAge === 0 ? 'Sıfır Bina' : `${buildingAge} Yaşında`,
        sqmPrice: Math.round(price / area),

        // Rich content
        photos: photos,
        description: descriptions.join('\n\n'),
        features: features,

        // Contact
        contact: {
            name: contactNames[Math.floor(Math.random() * contactNames.length)],
            type: contactTypes[Math.floor(Math.random() * contactTypes.length)],
            phone: `(0532) ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`
        },

        // Location details
        fullLocation: `${location.neighborhood} Mah., ${location.district}, İstanbul`
    };
}

function populateFormFromScrapedData(data) {
    if (data.name) document.getElementById('home-name').value = data.name;
    if (data.price) document.getElementById('home-price').value = data.price;
    if (data.area) document.getElementById('home-area').value = data.area;
    if (data.location) document.getElementById('home-location').value = data.location;
    if (data.estimatedRent) document.getElementById('home-rent').value = data.estimatedRent;

    // Trigger input events for any listeners
    ['home-name', 'home-price', 'home-area', 'home-location', 'home-rent'].forEach(id => {
        document.getElementById(id)?.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Store and render to listing detail panel
    AppState.currentListing = data;
    renderListingDetailPanel(data);
}

// ===============================
// Listing Detail Panel
// ===============================
function renderListingDetailPanel(data) {
    const emptyState = document.getElementById('listing-empty-state');
    const content = document.getElementById('listing-content');

    if (!content || !data) return;

    // Hide empty state, show content
    emptyState?.classList.add('hidden');
    content.classList.remove('hidden');

    // Render gallery
    renderGallery(data.photos || []);

    // Render price card
    const fmt = (n) => new Intl.NumberFormat('tr-TR').format(n);
    document.getElementById('listing-price').textContent = `₺${fmt(data.price)}`;
    document.getElementById('listing-price-sqm').textContent = `₺${fmt(data.sqmPrice || Math.round(data.price / data.area))}/m²`;
    document.getElementById('listing-rooms').textContent = data.rooms || '3+1';
    document.getElementById('listing-area').textContent = `${data.area} m²`;
    document.getElementById('listing-floor').textContent = data.floor || '-';
    document.getElementById('listing-age').textContent = data.buildingAge || '-';

    // Render details grid
    renderDetailsGrid(data.features || {});

    // Render description
    document.getElementById('listing-description').innerHTML =
        `<p>${(data.description || 'Açıklama yok').replace(/\n\n/g, '</p><p>')}</p>`;

    // Render location
    document.getElementById('listing-location-text').textContent = data.fullLocation || data.location;

    // Render contact
    const contactEl = document.getElementById('listing-contact');
    if (data.contact) {
        contactEl.innerHTML = `
            <div class="contact-name">${data.contact.name}</div>
            <div class="contact-type">${data.contact.type}</div>
            <div class="contact-phone">${data.contact.phone}</div>
        `;
    }

    // Setup action buttons
    document.getElementById('btn-open-original')?.addEventListener('click', () => {
        if (data.sourceUrl) window.open(data.sourceUrl, '_blank');
    });

    document.getElementById('btn-analyze-listing')?.addEventListener('click', () => {
        // Open form with data pre-filled
        openHomeForm();
    });

    // Switch to listing tab
    switchTab('listing');
    showToast('İlan detayları yüklendi!', 'success');
}

function renderGallery(photos) {
    const mainImg = document.getElementById('gallery-main-img');
    const thumbsContainer = document.getElementById('gallery-thumbs');
    const badge = document.getElementById('gallery-badge');

    if (!photos.length) {
        mainImg.src = 'https://placehold.co/800x600/1a1a2e/9ca3af?text=Fotoğraf+Yok';
        badge.textContent = '0/0';
        thumbsContainer.innerHTML = '';
        return;
    }

    // Set main image
    mainImg.src = photos[0];
    badge.textContent = `1/${photos.length}`;

    // Render thumbnails
    thumbsContainer.innerHTML = photos.map((photo, index) => `
        <div class="gallery-thumb ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${photo}" alt="Fotoğraf ${index + 1}">
        </div>
    `).join('');

    // Add click handlers
    thumbsContainer.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            const index = parseInt(thumb.dataset.index);
            mainImg.src = photos[index];
            badge.textContent = `${index + 1}/${photos.length}`;
            thumbsContainer.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });
}

function renderDetailsGrid(features) {
    const container = document.getElementById('listing-details');
    if (!container) return;

    container.innerHTML = Object.entries(features).map(([label, value]) => `
        <div class="detail-item">
            <span class="detail-label">${label}</span>
            <span class="detail-value">${value}</span>
        </div>
    `).join('');
}

function showUrlStatus(message, type) {
    const statusDiv = document.getElementById('url-status');
    if (!statusDiv) return;

    statusDiv.className = `url-status ${type}`;
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');

    // Auto-hide after 5 seconds for success/warning
    if (type === 'success' || type === 'warning') {
        setTimeout(() => statusDiv.classList.add('hidden'), 5000);
    }
}


// ===============================
// Calculations (Enhanced with CoreEngine)
// ===============================
function calculateHomeAnalysis(home) {
    const { price, downpayment, interest, term, rent, inflation, appreciation } = home;

    // Prepare input for CoreEngine
    const propertyData = {
        askingPrice: price,
        monthlyRent: rent,
        downPayment: downpayment,
        annualInterestRate: interest,
        termMonths: term,
        monthlyMaintenanceFee: 2000,
        annualInsurance: 3000,
        annualRepairBudget: 10000
    };

    const settings = {
        ...DEFAULT_SETTINGS,
        defaultInflation: inflation,
        defaultAppreciation: appreciation
    };

    // Run CoreEngine analysis
    const coreResult = CoreEngine.analyze(propertyData, settings);

    // Get legacy values for backward compatibility
    const loanAmount = price - downpayment;
    const monthlyPayment = coreResult.modules.loanCost.monthlyPayment;
    const totalPayment = coreResult.modules.loanCost.totalPayment;
    const totalInterest = coreResult.modules.loanCost.totalInterest;

    const rentCoverage = coreResult.valuation.rentCoverageRatio;
    const netMonthlyCost = monthlyPayment - rent;
    const amortizationYears = coreResult.valuation.amortizationYears;
    const score = coreResult.valuation.totalScore;
    const fairPrice = coreResult.valuation.fairPrice;
    const discountNeeded = coreResult.valuation.discountNeeded;

    // Determine verdict using new weighted score
    let verdict, verdictClass;
    if (score >= 70) {
        verdict = 'UCUZ';
        verdictClass = 'cheap';
    } else if (score >= 45) {
        verdict = 'MAKUL';
        verdictClass = 'reasonable';
    } else {
        verdict = 'PAHALI';
        verdictClass = 'expensive';
    }

    // Get AI decision
    const decisionInput = {
        investmentScore: score,
        monthlyCashflow: coreResult.valuation.monthlyCashFlow,
        rentToInstallmentRatio: rentCoverage / 100,
        paybackYears: amortizationYears,
        interestRate: interest,
        fairPriceGap: discountNeeded / 100,
        downPaymentRatio: downpayment / price,
        monthlyMortgage: monthlyPayment,
        alternativesBetter: coreResult.modules.alternativeInvestment.bestAlternative !== 'property',
        bestAlternative: coreResult.modules.alternativeInvestment.bestAlternative
    };

    const decision = RiskAdjustedDecisionEngine.decide(decisionInput, AppState.settings.riskProfile || 'TEMKINLI');
    const interpretation = AIInterpretationEngine.interpret(decisionInput);
    const negotiationStrategy = NegotiationScriptGenerator.generateStrategy(price, fairPrice);
    const riskWarnings = RiskWarningGenerator.generate({
        rentCoverageRatio: rentCoverage,
        monthlyCashFlow: coreResult.valuation.monthlyCashFlow,
        amortizationYears,
        discountNeeded,
        effectiveInterestRate: coreResult.modules.loanCost.effectiveInterestRate
    });

    return {
        // Legacy fields
        loanAmount,
        monthlyPayment,
        totalPayment,
        totalInterest,
        rentCoverage,
        netMonthlyCost,
        amortizationYears,
        score,
        verdict,
        verdictClass,
        fairPrice,
        discountNeeded,

        // New enhanced fields
        coreResult,
        decision,
        interpretation,
        negotiationStrategy,
        riskWarnings,
        scoreBreakdown: coreResult.valuation.scoreBreakdown
    };
}

function calculateMonthlyPayment(principal, monthlyRate, months) {
    if (monthlyRate === 0) return principal / months;

    const x = Math.pow(1 + monthlyRate, months);
    return principal * (monthlyRate * x) / (x - 1);
}

// ===============================
// Analysis Display (Enhanced)
// ===============================
function showAnalysis(home) {
    const { analysis } = home;
    const content = document.getElementById('analysis-content');

    if (!content) return;

    // Decision card color
    const decisionColors = {
        'AL': { bg: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', text: 'white' },
        'BEKLE': { bg: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', text: '#1f2937' },
        'VAZGEC': { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', text: 'white' }
    };

    const decisionStyle = decisionColors[analysis.decision?.decision] || decisionColors.BEKLE;
    const decisionEmoji = analysis.decision?.decision === 'AL' ? '✅' :
        analysis.decision?.decision === 'BEKLE' ? '⏸️' : '❌';

    // Risk warnings HTML
    const riskWarningsHtml = analysis.riskWarnings?.bullets?.length > 0
        ? `<div class="risk-warnings">
            <h4>⚠️ Dikkat Edilmesi Gerekenler</h4>
            <ul>${analysis.riskWarnings.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
           </div>`
        : '';

    // AI Interpretation summary
    const interpretationHtml = analysis.interpretation?.summary?.points?.length > 0
        ? `<div class="ai-summary">
            <h4>📊 Neden Bu Karar?</h4>
            <ul>${analysis.interpretation.summary.points.map(p =>
            `<li class="severity-${p.severity}">${p.icon} ${p.text}</li>`
        ).join('')}</ul>
           </div>`
        : '';

    // Improvement scenarios
    const scenariosHtml = analysis.interpretation?.improvementScenarios?.scenarios?.length > 0
        ? `<div class="improvement-scenarios">
            <h4>💡 ${analysis.interpretation.improvementScenarios.intro}</h4>
            <ul>${analysis.interpretation.improvementScenarios.scenarios.map(s =>
            `<li>${s.icon} ${s.condition} <span class="impact-${s.impact}">[${s.impact.toUpperCase()}]</span></li>`
        ).join('')}</ul>
           </div>`
        : '';

    content.innerHTML = `
        <!-- Decision Card -->
        <div class="decision-card" style="background: ${decisionStyle.bg}; color: ${decisionStyle.text};">
            <div class="decision-label">${decisionEmoji} ${analysis.decision?.decision || 'Analiz Edildi'}</div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${analysis.decision?.confidence || 50}%;"></div>
            </div>
            <div class="confidence-text">Güven: %${analysis.decision?.confidence || 50}</div>
            <p class="decision-reason">${analysis.decision?.reason || analysis.interpretation?.shortDecision?.text || ''}</p>
            ${analysis.decision?.note ? `<p class="decision-note">${analysis.decision.note}</p>` : ''}
        </div>

        <!-- Property Info -->
        <div class="result-card">
            <h3>🏠 ${home.name}</h3>
            <p style="color: var(--text-secondary);">${home.location || 'Konum belirtilmedi'}</p>
            
            <div class="score-display" style="--score: ${analysis.score}">
                <div class="score-circle">
                    <div class="score-inner">
                        <span class="score-value">${Math.round(analysis.score)}</span>
                        <span class="score-label">puan</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: var(--space-lg);">
                <p style="color: var(--text-secondary); margin-bottom: var(--space-sm);">Bu ev şu an için:</p>
                <span class="result-verdict ${analysis.verdictClass}">${analysis.verdict}</span>
            </div>
        </div>

        <!-- AI Interpretation -->
        ${interpretationHtml}
        
        <!-- Negotiation Target -->
        <div class="golden-box">
            <h3>🎯 PAZARLIK STRATEJİSİ</h3>
            <div class="negotiation-strategy">
                <div class="strategy-item">
                    <span class="strategy-label">🟢 Önerilen Teklif:</span>
                    <span class="strategy-value">${formatCurrency(analysis.negotiationStrategy?.suggestedOffer || analysis.fairPrice)}</span>
                </div>
                <div class="strategy-item">
                    <span class="strategy-label">🟡 Üst Sınır:</span>
                    <span class="strategy-value">${formatCurrency(analysis.negotiationStrategy?.maxAcceptable || analysis.fairPrice * 1.05)}</span>
                </div>
                <div class="strategy-item">
                    <span class="strategy-label">🔴 Masadan Kalk:</span>
                    <span class="strategy-value">${formatCurrency(analysis.negotiationStrategy?.walkAwayPoint || analysis.fairPrice * 1.1)}</span>
                </div>
            </div>
            <p class="strategy-note">${analysis.negotiationStrategy?.strategyNote || ''}</p>
        </div>
        
        <!-- Improvement Scenarios -->
        ${scenariosHtml}
        
        <!-- Risk Warnings -->
        ${riskWarningsHtml}
        
        <!-- Metrics Grid -->
        <div class="metrics-grid">
            <div class="metric-item">
                <div class="metric-label">Aylık Taksit</div>
                <div class="metric-value">${formatCurrency(analysis.monthlyPayment)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Aylık Kira</div>
                <div class="metric-value">${formatCurrency(home.rent)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Kira Karşılama</div>
                <div class="metric-value">%${Math.round(analysis.rentCoverage)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Amortisman</div>
                <div class="metric-value">${analysis.amortizationYears.toFixed(1)} yıl</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Net Aylık Fark</div>
                <div class="metric-value ${analysis.netMonthlyCost > 0 ? 'negative' : 'positive'}">${formatCurrency(analysis.netMonthlyCost)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Toplam Faiz</div>
                <div class="metric-value">${formatCurrency(analysis.totalInterest)}</div>
            </div>
        </div>

        <!-- Chart Placeholders -->
        <div class="charts-section">
            <div class="chart-container">
                <canvas id="chart-rent-mortgage" height="150"></canvas>
            </div>
        </div>
        
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeAllModals()">Kapat</button>
            <button class="btn btn-primary" onclick="switchTab('homes'); closeAllModals();">
                <span class="btn-icon">📋</span>
                Evlerime Git
            </button>
        </div>
    `;

    openModal('modal-analysis');

    // Render charts after modal is open
    setTimeout(() => {
        try {
            RentVsMortgageChart.create('chart-rent-mortgage', home.rent, analysis.monthlyPayment);
        } catch (e) {
            console.log('Chart creation skipped:', e.message);
        }
    }, 100);
}

function getVerdictExplanation(analysis) {
    // Use AI interpretation if available
    if (analysis.interpretation?.shortDecision?.text) {
        return analysis.interpretation.shortDecision.text;
    }

    // Fallback to legacy explanations
    if (analysis.verdict === 'UCUZ') {
        return 'Kira getirisi ve kredi maliyetine göre bu ev iyi bir fırsat. Değerlendirmeye değer!';
    } else if (analysis.verdict === 'MAKUL') {
        return 'Fiyat makul seviyede. Küçük bir pazarlık ile daha iyi bir anlaşma yapılabilir.';
    } else {
        return 'Mevcut kira getirisi ve kredi maliyetine göre fiyat yüksek. Pazarlık yapmanız önerilir.';
    }
}

// ===============================
// Homes List
// ===============================
function renderHomesList() {
    if (!DOM.homesList) return;

    if (AppState.homes.length === 0) {
        DOM.homesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏠</div>
                <p>Henüz kayıtlı ev yok.</p>
                <p class="empty-hint">İlk evini ekleyerek başla!</p>
            </div>
        `;
        return;
    }

    // Bulk actions bar
    const bulkActionsBar = `
        <div class="bulk-actions-bar">
            <label class="select-all-checkbox">
                <input type="checkbox" id="select-all-homes" onchange="toggleSelectAllHomes(this.checked)">
                <span>Tümünü Seç</span>
            </label>
            <button class="btn btn-danger btn-sm" onclick="deleteSelectedHomes()" id="btn-delete-selected" disabled>
                🗑️ Seçilenleri Sil
            </button>
            <button class="btn btn-primary btn-sm" onclick="compareSelectedHomes()" id="btn-compare-selected" disabled>
                ⚖️ Karşılaştır
            </button>
        </div>
    `;

    const homeCards = AppState.homes.map(home => {
        const sourceUrl = home.sourceUrl || home.analysis?.sourceUrl || '';
        return `
        <div class="home-card" data-home-id="${home.id}">
            <div class="home-card-select">
                <input type="checkbox" class="home-select-checkbox" 
                       data-home-id="${home.id}" 
                       onchange="updateBulkActionButtons()">
            </div>
            <div class="home-card-content" onclick="showHomeDetail('${home.id}')">
                <div class="home-card-header">
                    <div class="home-card-title">🏠 ${home.name}</div>
                    <span class="badge badge-${getBadgeClass(home.analysis?.verdict)}">${home.analysis?.verdict || 'Analiz Yok'}</span>
                </div>
                <div class="home-card-price">${formatCurrency(home.price)}</div>
                <div class="home-card-footer">
                    <span>📍 ${home.location || 'Konum yok'}</span>
                    <span>📊 Skor: ${home.analysis?.score || '-'}/100</span>
                </div>
                ${sourceUrl ? `
                    <div class="home-card-link">
                        <a href="${sourceUrl}" target="_blank" onclick="event.stopPropagation()">
                            🔗 İlanı Görüntüle
                        </a>
                    </div>
                ` : ''}
            </div>
            <div class="home-card-actions">
                <button class="btn-icon-action" onclick="event.stopPropagation(); editHome('${home.id}')" title="Düzenle">
                    ✏️
                </button>
                <button class="btn-icon-action btn-danger" onclick="event.stopPropagation(); deleteHome('${home.id}')" title="Sil">
                    🗑️
                </button>
            </div>
        </div>
    `}).join('');

    DOM.homesList.innerHTML = bulkActionsBar + homeCards;
}

function toggleSelectAllHomes(checked) {
    document.querySelectorAll('.home-select-checkbox').forEach(cb => {
        cb.checked = checked;
    });
    updateBulkActionButtons();
}

function updateBulkActionButtons() {
    const selected = document.querySelectorAll('.home-select-checkbox:checked');
    const deleteBtn = document.getElementById('btn-delete-selected');
    const compareBtn = document.getElementById('btn-compare-selected');

    if (deleteBtn) deleteBtn.disabled = selected.length === 0;
    if (compareBtn) compareBtn.disabled = selected.length < 2;
}

function getSelectedHomeIds() {
    return Array.from(document.querySelectorAll('.home-select-checkbox:checked'))
        .map(cb => cb.dataset.homeId);
}

function deleteHome(homeId) {
    // Show custom confirmation modal
    showConfirmModal(
        'Evi Sil',
        'Bu evi silmek istediğinize emin misiniz?',
        () => {
            AppState.homes = AppState.homes.filter(h => h.id !== homeId);
            saveToStorage();
            renderHomesList();
            updateStats();
            showToast('Ev silindi', 'success');
        }
    );
}

function deleteSelectedHomes() {
    const selectedIds = getSelectedHomeIds();
    if (selectedIds.length === 0) return;

    showConfirmModal(
        'Evleri Sil',
        `${selectedIds.length} ev silinecek. Emin misiniz?`,
        () => {
            AppState.homes = AppState.homes.filter(h => !selectedIds.includes(h.id));
            saveToStorage();
            renderHomesList();
            updateStats();
            showToast(`${selectedIds.length} ev silindi`, 'success');
        }
    );
}

// Custom confirmation modal
function showConfirmModal(title, message, onConfirm) {
    // Remove existing confirm modal if any
    const existing = document.getElementById('confirm-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'confirm-modal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeConfirmModal()"></div>
        <div class="modal-content" style="max-width: 400px; text-align: center;">
            <h3 style="margin-bottom: var(--space-md);">⚠️ ${title}</h3>
            <p style="margin-bottom: var(--space-lg); color: var(--text-secondary);">${message}</p>
            <div style="display: flex; gap: var(--space-md); justify-content: center;">
                <button class="btn btn-secondary" onclick="closeConfirmModal()">İptal</button>
                <button class="btn btn-danger" id="btn-confirm-action">Sil</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Attach confirm handler
    document.getElementById('btn-confirm-action').onclick = () => {
        closeConfirmModal();
        onConfirm();
    };
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

function editHome(homeId) {
    const home = AppState.homes.find(h => h.id === homeId);
    if (home) {
        openHomeForm(home);
    }
}

function compareSelectedHomes() {
    const selectedIds = getSelectedHomeIds();
    if (selectedIds.length < 2) {
        showToast('Karşılaştırma için en az 2 ev seçin', 'warning');
        return;
    }

    // Store selected homes for comparison
    AppState.compareHomes = AppState.homes.filter(h => selectedIds.includes(h.id));

    // Switch to compare tab and render
    switchTab('compare');
    renderCompareTab();
}

function showHomeDetail(homeId) {
    const home = AppState.homes.find(h => h.id === homeId);
    if (home) {
        showAnalysis(home);
    }
}

function getBadgeClass(verdict) {
    switch (verdict) {
        case 'UCUZ': return 'success';
        case 'MAKUL': return 'warning';
        case 'PAHALI': return 'danger';
        default: return 'warning';
    }
}

// ===============================
// Stats
// ===============================
function updateStats() {
    const homes = AppState.homes;

    // Total homes
    if (DOM.statHomes) {
        DOM.statHomes.textContent = homes.length;
    }

    // Best score
    if (DOM.statBestScore) {
        const scores = homes.map(h => h.analysis?.score || 0);
        const bestScore = scores.length > 0 ? Math.max(...scores) : '-';
        DOM.statBestScore.textContent = bestScore === '-' ? '-' : Math.round(bestScore);
    }

    // Average price
    if (DOM.statAvgPrice) {
        if (homes.length > 0) {
            const avgPrice = homes.reduce((sum, h) => sum + (h.price || 0), 0) / homes.length;
            DOM.statAvgPrice.textContent = formatShortCurrency(avgPrice);
        } else {
            DOM.statAvgPrice.textContent = '-';
        }
    }
}

// ===============================
// Authentication (Placeholder)
// ===============================
function handleGoogleLogin() {
    showToast('Firebase henüz yapılandırılmadı', 'warning');
    closeAllModals();
}

function handleGuestMode() {
    AppState.user = { type: 'guest' };
    showToast('Misafir olarak devam ediliyor', 'success');
    closeAllModals();
}

// ===============================
// Storage
// ===============================
function saveToStorage() {
    try {
        localStorage.setItem('mantikli_ev_homes', JSON.stringify(AppState.homes));
        localStorage.setItem('mantikli_ev_settings', JSON.stringify(AppState.settings));
    } catch (e) {
        console.error('Storage save error:', e);
    }
}

function loadFromStorage() {
    try {
        const homes = localStorage.getItem('mantikli_ev_homes');
        const settings = localStorage.getItem('mantikli_ev_settings');

        if (homes) AppState.homes = JSON.parse(homes);
        if (settings) AppState.settings = { ...AppState.settings, ...JSON.parse(settings) };
    } catch (e) {
        console.error('Storage load error:', e);
    }
}

// ===============================
// Utilities
// ===============================
function generateId() {
    return 'home_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatCurrency(value) {
    if (!value || isNaN(value)) return '₺0';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatShortCurrency(value) {
    if (!value || isNaN(value)) return '₺0';

    if (value >= 1000000) {
        return '₺' + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return '₺' + (value / 1000).toFixed(0) + 'K';
    }
    return formatCurrency(value);
}

function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${getToastIcon(type)}</span>
        <span>${message}</span>
    `;

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
    }
}

// ===============================
// Compare Tab
// ===============================
function renderCompareTab() {
    const container = document.getElementById('compare-container');
    if (!container) return;

    const homes = AppState.compareHomes || AppState.homes.slice(0, 4);

    if (homes.length < 2) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚖️</div>
                <p>Karşılaştırma için en az 2 ev seçin</p>
                <p class="empty-hint">Evlerim sekmesinden evleri seçip "Karşılaştır" butonuna tıklayın</p>
            </div>
        `;
        return;
    }

    const metrics = [
        { label: 'Fiyat', key: 'price', format: 'currency' },
        { label: 'm²', key: 'area', format: 'number', suffix: ' m²' },
        { label: 'm² Fiyatı', key: 'sqmPrice', format: 'currency', calc: h => Math.round(h.price / h.area) },
        { label: 'Konum', key: 'location', format: 'text' },
        { label: 'Kira', key: 'rent', format: 'currency' },
        { label: 'Skor', key: 'score', format: 'score', calc: h => h.analysis?.score || 0 },
        { label: 'Karar', key: 'verdict', format: 'verdict', calc: h => h.analysis?.verdict || '-' },
        { label: 'Aylık Taksit', key: 'payment', format: 'currency', calc: h => h.analysis?.monthlyPayment || 0 },
        { label: 'Amortisman (Yıl)', key: 'amortization', format: 'number', calc: h => h.analysis?.amortizationYears || 0 }
    ];

    const getValue = (home, metric) => {
        if (metric.calc) return metric.calc(home);
        return home[metric.key] || home.analysis?.[metric.key] || '-';
    };

    const formatValue = (value, metric) => {
        if (value === '-' || value === 0) return '-';
        switch (metric.format) {
            case 'currency': return formatCurrency(value);
            case 'number': return value + (metric.suffix || '');
            case 'score': return `${value}/100`;
            case 'verdict': return value;
            default: return value;
        }
    };

    container.innerHTML = `
        <div class="compare-header">
            <h3>📊 Ev Karşılaştırması (${homes.length} Ev)</h3>
            <button class="btn btn-secondary btn-sm" onclick="clearCompare()">Temizle</button>
        </div>
        <div class="compare-table-wrapper">
            <table class="compare-table">
                <thead>
                    <tr>
                        <th>Özellik</th>
                        ${homes.map(h => `<th>${h.name}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${metrics.map(metric => `
                        <tr>
                            <td class="metric-label">${metric.label}</td>
                            ${homes.map(h => {
        const val = getValue(h, metric);
        const formatted = formatValue(val, metric);
        const cls = metric.key === 'verdict' ? `verdict-${val.toLowerCase()}` : '';
        return `<td class="${cls}">${formatted}</td>`;
    }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="compare-recommendation">
            ${getCompareRecommendation(homes)}
        </div>
    `;
}

function getCompareRecommendation(homes) {
    if (!homes.length) return '';

    // Sort by score
    const sorted = [...homes].sort((a, b) => (b.analysis?.score || 0) - (a.analysis?.score || 0));
    const best = sorted[0];

    return `
        <div class="recommendation-card">
            <div class="recommendation-header">
                <span class="recommendation-icon">🏆</span>
                <h4>Öneri</h4>
            </div>
            <p><strong>${best.name}</strong> en yüksek skora (${best.analysis?.score || 0}/100) sahip.</p>
            <p>Karar: <span class="verdict-badge verdict-${(best.analysis?.verdict || 'makul').toLowerCase()}">${best.analysis?.verdict || 'Analiz Yok'}</span></p>
        </div>
    `;
}

function clearCompare() {
    AppState.compareHomes = [];
    renderCompareTab();
}

// ===============================
// Scenarios Tab
// ===============================
function renderScenariosTab() {
    const container = document.getElementById('scenarios-container');
    if (!container) return;

    if (AppState.homes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📈</div>
                <p>Senaryo analizi için ev ekleyin</p>
                <p class="empty-hint">İlk evinizi ekleyerek senaryoları görmeye başlayın</p>
            </div>
        `;
        return;
    }

    // Select first home for scenarios if none selected
    const home = AppState.currentScenarioHome || AppState.homes[0];

    container.innerHTML = `
        <div class="scenarios-header">
            <h3>📈 Senaryo Analizi</h3>
            <select id="scenario-home-select" onchange="selectScenarioHome(this.value)">
                ${AppState.homes.map(h => `
                    <option value="${h.id}" ${h.id === home.id ? 'selected' : ''}>${h.name}</option>
                `).join('')}
            </select>
        </div>
        
        <div class="scenarios-grid">
            ${renderScenario(home, 'İYİMSER', { appreciation: 40, rentIncrease: 30 })}
            ${renderScenario(home, 'GERÇEKÇI', { appreciation: home.appreciation || 25, rentIncrease: home.rentIncrease || 25 })}
            ${renderScenario(home, 'KÖTÜMSER', { appreciation: 15, rentIncrease: 20 })}
        </div>
        
        <div class="scenarios-summary">
            <h4>📊 5 Yıllık Projeksiyon</h4>
            <p>Bu senaryolar farklı piyasa koşullarında evinizin değerini ve yatırım getirisini tahmin eder.</p>
        </div>
    `;
}

function renderScenario(home, type, params) {
    const basePrice = home.price || 0;
    const baseRent = home.rent || 0;

    // 5 year projection
    const years = 5;
    const futurePrice = basePrice * Math.pow(1 + params.appreciation / 100, years);
    const futureRent = baseRent * Math.pow(1 + params.rentIncrease / 100, years);
    const appreciation = futurePrice - basePrice;
    const totalRent = calculateTotalRent(baseRent, params.rentIncrease, years);

    const icons = { 'İYİMSER': '🌟', 'GERÇEKÇI': '📊', 'KÖTÜMSER': '⚠️' };
    const colors = { 'İYİMSER': 'success', 'GERÇEKÇI': 'info', 'KÖTÜMSER': 'warning' };

    return `
        <div class="scenario-card scenario-${colors[type]}">
            <div class="scenario-header">
                <span class="scenario-icon">${icons[type]}</span>
                <h4>${type} Senaryo</h4>
            </div>
            <div class="scenario-params">
                <span>Değer Artışı: %${params.appreciation}/yıl</span>
                <span>Kira Artışı: %${params.rentIncrease}/yıl</span>
            </div>
            <div class="scenario-results">
                <div class="scenario-metric">
                    <span class="metric-label">Gelecek Değer (5 yıl)</span>
                    <span class="metric-value">${formatCurrency(futurePrice)}</span>
                </div>
                <div class="scenario-metric">
                    <span class="metric-label">Değer Artışı</span>
                    <span class="metric-value positive">+${formatCurrency(appreciation)}</span>
                </div>
                <div class="scenario-metric">
                    <span class="metric-label">Gelecek Kira</span>
                    <span class="metric-value">${formatCurrency(futureRent)}</span>
                </div>
                <div class="scenario-metric">
                    <span class="metric-label">Toplam Kira (5 yıl)</span>
                    <span class="metric-value">${formatCurrency(totalRent)}</span>
                </div>
            </div>
        </div>
    `;
}

function calculateTotalRent(baseRent, increaseRate, years) {
    let total = 0;
    let currentRent = baseRent;
    for (let i = 0; i < years * 12; i++) {
        total += currentRent;
        if ((i + 1) % 12 === 0) {
            currentRent *= (1 + increaseRate / 100);
        }
    }
    return total;
}

function selectScenarioHome(homeId) {
    AppState.currentScenarioHome = AppState.homes.find(h => h.id === homeId);
    renderScenariosTab();
}

// ===============================
// Initialize App
// ===============================
document.addEventListener('DOMContentLoaded', initApp);

// Export for console debugging
window.AppState = AppState;
window.showToast = showToast;
