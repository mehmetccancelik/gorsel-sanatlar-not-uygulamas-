// Settings Manager Component
import GoogleSheetsManager from '../utils/googleSheets.js';
import SecurityManager from './SecurityManager.js';

class SettingsManager {
    constructor() {
        this.googleSheets = new GoogleSheetsManager();
        this.security = new SecurityManager();
    }

    async render() {
        const mainContent = document.getElementById('mainContent');
        const settings = this.googleSheets.getSettings();

        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">⚙️ Ayarlar</h2>
                </div>
                
                <!-- Google Sheets Settings -->
                <div class="settings-section">
                    <h3>📊 Google Sheets Entegrasyonu</h3>
                    <p class="text-light">Değerlendirmeler otomatik olarak Google Sheets'e kaydedilir.</p>
                    
                    <div class="form-group">
                        <label class="toggle-label">
                            <input type="checkbox" id="sheetsEnabled" ${settings.isEnabled ? 'checked' : ''}>
                            <span>Google Sheets entegrasyonu aktif</span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Spreadsheet ID</label>
                        <input type="text" class="form-input" id="spreadsheetId" 
                               value="${settings.spreadsheetId}" 
                               placeholder="1BxiMVs0XRA5nFMdKvBd...">
                        <small class="form-hint">Google Sheets URL'sindeki /d/ ile /edit arasındaki kısım</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">API Key</label>
                        <input type="password" class="form-input" id="apiKey" 
                               value="${settings.apiKey}" 
                               placeholder="AIzaSy...">
                        <small class="form-hint">Google Cloud Console'dan alınır</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Sheet Adı</label>
                        <input type="text" class="form-input" id="sheetName" 
                               value="${settings.sheetName}" 
                               placeholder="Değerlendirmeler">
                    </div>
                    
                    <div class="btn-group">
                        <button class="btn btn-primary" id="saveSheetSettings">Kaydet</button>
                        <button class="btn btn-secondary" id="testConnection">Bağlantıyı Test Et</button>
                    </div>
                    
                    <div id="connectionResult" class="connection-result hidden"></div>
                </div>
                
                <!-- PIN Settings -->
                <div class="settings-section">
                    <h3>🔐 Güvenlik Ayarları</h3>
                    <p class="text-light">Uygulama girişi için PIN koruması.</p>
                    
                    <div class="form-group">
                        <label class="form-label">Mevcut PIN</label>
                        <input type="password" class="form-input" id="currentPin" placeholder="••••">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Yeni PIN</label>
                        <input type="password" class="form-input" id="newPin" placeholder="En az 4 karakter">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Yeni PIN (Tekrar)</label>
                        <input type="password" class="form-input" id="confirmPin" placeholder="••••">
                    </div>
                    
                    <button class="btn btn-primary" id="changePin">PIN'i Değiştir</button>
                    
                    <p class="form-hint" style="margin-top: 1rem;">
                        ${this.security.hasCustomPin() ? '✓ Özel PIN ayarlanmış' : 'Varsayılan PIN: 1234'}
                    </p>
                </div>
                
                <!-- Session -->
                <div class="settings-section">
                    <h3>🚪 Oturum</h3>
                    <button class="btn btn-danger" id="logoutBtn">Çıkış Yap</button>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Google Sheets toggle
        document.getElementById('sheetsEnabled').addEventListener('change', (e) => {
            this.googleSheets.setEnabled(e.target.checked);
            this.showToast(e.target.checked ? 'Google Sheets aktif' : 'Google Sheets devre dışı', 'info');
        });

        // Save Sheets settings
        document.getElementById('saveSheetSettings').addEventListener('click', () => {
            const spreadsheetId = document.getElementById('spreadsheetId').value.trim();
            const apiKey = document.getElementById('apiKey').value.trim();
            const sheetName = document.getElementById('sheetName').value.trim() || 'Değerlendirmeler';

            this.googleSheets.saveSettings(apiKey, spreadsheetId, sheetName);
            this.showToast('Ayarlar kaydedildi', 'success');
        });

        // Test connection
        document.getElementById('testConnection').addEventListener('click', async () => {
            const resultDiv = document.getElementById('connectionResult');
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = '⏳ Test ediliyor...';
            resultDiv.className = 'connection-result';

            // Save settings first
            const spreadsheetId = document.getElementById('spreadsheetId').value.trim();
            const apiKey = document.getElementById('apiKey').value.trim();
            const sheetName = document.getElementById('sheetName').value.trim() || 'Değerlendirmeler';
            this.googleSheets.saveSettings(apiKey, spreadsheetId, sheetName);

            const result = await this.googleSheets.testConnection();

            resultDiv.innerHTML = result.success
                ? `✅ ${result.message}`
                : `❌ ${result.message}`;
            resultDiv.className = `connection-result ${result.success ? 'success' : 'error'}`;
        });

        // Change PIN
        document.getElementById('changePin').addEventListener('click', () => {
            const currentPin = document.getElementById('currentPin').value;
            const newPin = document.getElementById('newPin').value;
            const confirmPin = document.getElementById('confirmPin').value;

            if (newPin !== confirmPin) {
                this.showToast('Yeni PIN\'ler eşleşmiyor', 'error');
                return;
            }

            const result = this.security.changePin(currentPin, newPin);
            this.showToast(result.message, result.success ? 'success' : 'error');

            if (result.success) {
                document.getElementById('currentPin').value = '';
                document.getElementById('newPin').value = '';
                document.getElementById('confirmPin').value = '';
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
                this.security.logout();
                location.reload();
            }
        });
    }

    showToast(message, type) {
        window.app.showToast(message, type);
    }
}

export default SettingsManager;
