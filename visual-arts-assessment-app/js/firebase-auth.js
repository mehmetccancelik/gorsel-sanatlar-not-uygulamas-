// Firebase Authentication Module
// Handles user registration, login, and password reset

class FirebaseAuth {
    constructor() {
        // Initialize Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyA88j_2_FUs4akPDD0p-7DobQiME0P_ue4",
            authDomain: "gorsel-sanatlar-app.firebaseapp.com",
            projectId: "gorsel-sanatlar-app",
            storageBucket: "gorsel-sanatlar-app.firebasestorage.app",
            messagingSenderId: "450683935388",
            appId: "1:450683935388:web:e187e42247fcb086aaeb59"
        };

        // Initialize Firebase app if not already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        this.auth = firebase.auth();
        this.db = firebase.firestore();
    }

    // Get current user
    getCurrentUser() {
        return this.auth.currentUser;
    }

    // Check if user is logged in
    isAuthenticated() {
        return this.auth.currentUser !== null;
    }

    // Register new user with email and password
    async register(email, password, displayName = '') {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update display name if provided
            if (displayName) {
                await user.updateProfile({ displayName });
            }

            // Create user document in Firestore
            await this.db.collection('users').doc(user.uid).set({
                email: email,
                displayName: displayName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Login with email and password
    async login(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Logout
    async logout() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Send password reset email
    async sendPasswordReset(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
            return { success: true, message: 'Şifre sıfırlama e-postası gönderildi' };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Change password (for logged in user)
    async changePassword(newPassword) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                return { success: false, error: 'Oturum açılmamış' };
            }
            await user.updatePassword(newPassword);
            return { success: true, message: 'Şifre değiştirildi' };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Listen for auth state changes
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }

    // Error message translation
    getErrorMessage(errorCode) {
        const messages = {
            'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanımda',
            'auth/invalid-email': 'Geçersiz e-posta adresi',
            'auth/operation-not-allowed': 'E-posta/şifre girişi devre dışı',
            'auth/weak-password': 'Şifre çok zayıf (en az 6 karakter)',
            'auth/user-disabled': 'Bu hesap devre dışı bırakılmış',
            'auth/user-not-found': 'Bu e-posta ile hesap bulunamadı',
            'auth/wrong-password': 'Yanlış şifre',
            'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekleyin',
            'auth/network-request-failed': 'İnternet bağlantısı yok'
        };
        return messages[errorCode] || 'Bir hata oluştu';
    }

    // Render login/register screen
    renderAuthScreen(onSuccess) {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="auth-screen">
                <div class="auth-card">
                    <div class="auth-icon">🎨</div>
                    <h1>Sanat Değerlendirme</h1>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Giriş</button>
                        <button class="auth-tab" data-tab="register">Kayıt</button>
                    </div>
                    
                    <!-- Login Form -->
                    <div class="auth-form" id="loginForm">
                        <div class="form-group">
                            <label class="form-label">E-posta</label>
                            <input type="email" class="form-input" id="loginEmail" placeholder="ornek@mail.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Şifre</label>
                            <input type="password" class="form-input" id="loginPassword" placeholder="••••••">
                        </div>
                        <button class="btn btn-primary btn-full" id="loginBtn">Giriş Yap</button>
                        <button class="btn-link" id="forgotPasswordBtn">Şifremi Unuttum</button>
                    </div>
                    
                    <!-- Register Form -->
                    <div class="auth-form hidden" id="registerForm">
                        <div class="form-group">
                            <label class="form-label">Ad Soyad</label>
                            <input type="text" class="form-input" id="registerName" placeholder="Adınız Soyadınız">
                        </div>
                        <div class="form-group">
                            <label class="form-label">E-posta</label>
                            <input type="email" class="form-input" id="registerEmail" placeholder="ornek@mail.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Şifre</label>
                            <input type="password" class="form-input" id="registerPassword" placeholder="En az 6 karakter">
                        </div>
                        <button class="btn btn-success btn-full" id="registerBtn">Kayıt Ol</button>
                    </div>
                    
                    <!-- Forgot Password Form -->
                    <div class="auth-form hidden" id="forgotForm">
                        <p class="auth-info">E-posta adresinize şifre sıfırlama linki gönderilecek.</p>
                        <div class="form-group">
                            <label class="form-label">E-posta</label>
                            <input type="email" class="form-input" id="resetEmail" placeholder="ornek@mail.com">
                        </div>
                        <button class="btn btn-primary btn-full" id="resetBtn">Şifre Sıfırla</button>
                        <button class="btn-link" id="backToLoginBtn">Giriş'e Dön</button>
                    </div>
                    
                    <p class="auth-error hidden" id="authError"></p>
                </div>
            </div>
        `;

        this.attachAuthListeners(onSuccess);
    }

    attachAuthListeners(onSuccess) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const forgotForm = document.getElementById('forgotForm');
        const authError = document.getElementById('authError');

        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                loginForm.classList.add('hidden');
                registerForm.classList.add('hidden');
                forgotForm.classList.add('hidden');
                authError.classList.add('hidden');

                if (tab.dataset.tab === 'login') {
                    loginForm.classList.remove('hidden');
                } else {
                    registerForm.classList.remove('hidden');
                }
            });
        });

        // Login
        document.getElementById('loginBtn').addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                this.showError('Lütfen tüm alanları doldurun');
                return;
            }

            document.getElementById('loginBtn').disabled = true;
            document.getElementById('loginBtn').textContent = 'Giriş yapılıyor...';

            const result = await this.login(email, password);
            if (result.success) {
                // Reload page for clean initialization
                window.location.reload();
            } else {
                document.getElementById('loginBtn').disabled = false;
                document.getElementById('loginBtn').textContent = 'Giriş Yap';
                this.showError(result.error);
            }
        });

        // Register
        document.getElementById('registerBtn').addEventListener('click', async () => {
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            if (!email || !password) {
                this.showError('Lütfen tüm alanları doldurun');
                return;
            }

            document.getElementById('registerBtn').disabled = true;
            document.getElementById('registerBtn').textContent = 'Kayıt yapılıyor...';

            const result = await this.register(email, password, name);
            if (result.success) {
                // Reload page for clean initialization
                window.location.reload();
            } else {
                document.getElementById('registerBtn').disabled = false;
                document.getElementById('registerBtn').textContent = 'Kayıt Ol';
                this.showError(result.error);
            }
        });

        // Forgot Password
        document.getElementById('forgotPasswordBtn').addEventListener('click', () => {
            loginForm.classList.add('hidden');
            forgotForm.classList.remove('hidden');
            authError.classList.add('hidden');
        });

        document.getElementById('backToLoginBtn').addEventListener('click', () => {
            forgotForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });

        document.getElementById('resetBtn').addEventListener('click', async () => {
            const email = document.getElementById('resetEmail').value;

            if (!email) {
                this.showError('Lütfen e-posta adresinizi girin');
                return;
            }

            const result = await this.sendPasswordReset(email);
            if (result.success) {
                this.showSuccess(result.message);
            } else {
                this.showError(result.error);
            }
        });

        // Enter key support
        ['loginEmail', 'loginPassword'].forEach(id => {
            document.getElementById(id)?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') document.getElementById('loginBtn').click();
            });
        });
    }

    showError(message) {
        const authError = document.getElementById('authError');
        authError.textContent = message;
        authError.classList.remove('hidden');
        authError.classList.remove('success');
    }

    showSuccess(message) {
        const authError = document.getElementById('authError');
        authError.textContent = message;
        authError.classList.remove('hidden');
        authError.classList.add('success');
    }
}

// Export for use
window.FirebaseAuth = FirebaseAuth;
