// Google Sheets Integration
// Uses Google Sheets API to automatically export assessment data

class GoogleSheetsManager {
    constructor() {
        this.apiKey = localStorage.getItem('google_sheets_api_key') || '';
        this.spreadsheetId = localStorage.getItem('google_sheets_spreadsheet_id') || '';
        this.sheetName = localStorage.getItem('google_sheets_sheet_name') || 'Değerlendirmeler';
        this.isEnabled = localStorage.getItem('google_sheets_enabled') === 'true';
    }

    // Save settings
    saveSettings(apiKey, spreadsheetId, sheetName = 'Değerlendirmeler') {
        localStorage.setItem('google_sheets_api_key', apiKey);
        localStorage.setItem('google_sheets_spreadsheet_id', spreadsheetId);
        localStorage.setItem('google_sheets_sheet_name', sheetName);

        this.apiKey = apiKey;
        this.spreadsheetId = spreadsheetId;
        this.sheetName = sheetName;
    }

    // Enable/disable integration
    setEnabled(enabled) {
        localStorage.setItem('google_sheets_enabled', enabled.toString());
        this.isEnabled = enabled;
    }

    // Check if configured
    isConfigured() {
        return this.apiKey && this.spreadsheetId;
    }

    // Append row to Google Sheets
    async appendRow(rowData) {
        if (!this.isEnabled || !this.isConfigured()) {
            console.log('Google Sheets integration not enabled or not configured');
            return { success: false, reason: 'not_configured' };
        }

        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(this.sheetName)}:append?valueInputOption=USER_ENTERED&key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [rowData]
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Google Sheets API error:', error);
                return {
                    success: false,
                    reason: 'api_error',
                    message: error.error?.message || 'API hatası'
                };
            }

            const result = await response.json();
            console.log('Row appended to Google Sheets:', result);
            return { success: true };
        } catch (error) {
            console.error('Failed to append to Google Sheets:', error);
            return {
                success: false,
                reason: 'network_error',
                message: error.message
            };
        }
    }

    // Format assessment data for export
    formatAssessmentRow(assessmentData) {
        const {
            date,
            className,
            studentName,
            studentNumber,
            artworkTitle,
            totalScore,
            criteriaScores
        } = assessmentData;

        // Base columns
        const row = [
            date || new Date().toLocaleDateString('tr-TR'),
            className || '',
            studentNumber || '',
            studentName || '',
            artworkTitle || '',
            totalScore?.toFixed(1) || '0'
        ];

        // Add criteria scores if available
        if (criteriaScores && Array.isArray(criteriaScores)) {
            criteriaScores.forEach(score => {
                row.push(score.toFixed(1));
            });
        }

        return row;
    }

    // Test connection
    async testConnection() {
        if (!this.isConfigured()) {
            return { success: false, message: 'API Key ve Spreadsheet ID girilmemiş' };
        }

        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}?key=${this.apiKey}`;

            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    message: error.error?.message || 'Bağlantı hatası'
                };
            }

            const data = await response.json();
            return {
                success: true,
                message: `Bağlantı başarılı: ${data.properties?.title || 'Spreadsheet'}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Ağ hatası: ${error.message}`
            };
        }
    }

    // Get settings for UI
    getSettings() {
        return {
            apiKey: this.apiKey,
            spreadsheetId: this.spreadsheetId,
            sheetName: this.sheetName,
            isEnabled: this.isEnabled
        };
    }
}

export default GoogleSheetsManager;
