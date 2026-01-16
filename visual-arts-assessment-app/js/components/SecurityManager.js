// Security Manager - PIN-based authentication for mobile use
class SecurityManager {
    constructor() {
        this.defaultPin = '1234';
        this.sessionKey = 'app_session';
        this.pinKey = 'app_pin';
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    }

    // Check if user is authenticated
    isAuthenticated() {
        const session = localStorage.getItem(this.sessionKey);
        if (!session) return false;

        try {
            const sessionData = JSON.parse(session);
            const now = Date.now();

            // Check if session is still valid
            if (sessionData.expiresAt > now) {
                return true;
            }

            // Session expired
            this.logout();
            return false;
        } catch {
            return false;
        }
    }

    // Verify PIN
    verifyPin(enteredPin) {
        const storedPin = localStorage.getItem(this.pinKey) || this.defaultPin;
        return enteredPin === storedPin;
    }

    // Login with PIN
    login(pin) {
        if (this.verifyPin(pin)) {
            const session = {
                loggedInAt: Date.now(),
                expiresAt: Date.now() + this.sessionDuration
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
            return true;
        }
        return false;
    }

    // Logout
    logout() {
        localStorage.removeItem(this.sessionKey);
    }

    // Change PIN
    changePin(oldPin, newPin) {
        if (!this.verifyPin(oldPin)) {
            return { success: false, message: 'Mevcut PIN hatalı' };
        }

        if (newPin.length < 4) {
            return { success: false, message: 'PIN en az 4 karakter olmalı' };
        }

        localStorage.setItem(this.pinKey, newPin);
        return { success: true, message: 'PIN değiştirildi' };
    }

    // Get current PIN (for display in settings)
    hasCustomPin() {
        return localStorage.getItem(this.pinKey) !== null;
    }

    // Reset PIN to default
    resetPin() {
        localStorage.removeItem(this.pinKey);
    }

    // Render login screen
    renderLoginScreen(onSuccess) {
        const app = document.getElementById('app');
        const originalContent = app.innerHTML;

        app.innerHTML = `
            <div class="login-screen">
                <div class="login-card">
                    <div class="login-icon">🎨</div>
                    <h1>Sanat Değerlendirme</h1>
                    <p class="login-subtitle">Devam etmek için PIN girin</p>
                    
                    <div class="pin-input-container">
                        <input type="password" 
                               id="pinInput" 
                               class="pin-input" 
                               maxlength="6" 
                               placeholder="••••"
                               inputmode="numeric"
                               pattern="[0-9]*"
                               autocomplete="off">
                    </div>
                    
                    <button class="btn btn-primary btn-lg" id="loginBtn">Giriş</button>
                    
                    <p class="login-hint" id="loginError"></p>
                </div>
            </div>
        `;

        const pinInput = document.getElementById('pinInput');
        const loginBtn = document.getElementById('loginBtn');
        const errorDisplay = document.getElementById('loginError');

        const attemptLogin = () => {
            const pin = pinInput.value;

            if (this.login(pin)) {
                app.innerHTML = originalContent;
                onSuccess();
            } else {
                errorDisplay.textContent = 'Hatalı PIN!';
                errorDisplay.classList.add('error');
                pinInput.value = '';
                pinInput.focus();

                // Shake animation
                pinInput.classList.add('shake');
                setTimeout(() => pinInput.classList.remove('shake'), 500);
            }
        };

        loginBtn.addEventListener('click', attemptLogin);

        pinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                attemptLogin();
            }
        });

        // Focus on PIN input
        pinInput.focus();
    }
}

export default SecurityManager;
