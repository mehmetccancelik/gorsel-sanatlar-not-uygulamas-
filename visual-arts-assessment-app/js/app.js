// Main Application Entry Point
import db from './database.js';

class App {
    constructor() {
        this.currentRoute = 'classes';
        this.firebaseAuth = new FirebaseAuth();
        this.currentUser = null;
        this.checkAuthAndInit();
    }

    async checkAuthAndInit() {
        // Listen for auth state changes
        this.firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.init();
            } else {
                this.currentUser = null;
                this.firebaseAuth.renderAuthScreen((user) => {
                    this.currentUser = user;
                    this.init();
                });
            }
        });
    }

    async init() {
        // Initialize database
        try {
            await db.init();
            console.log('Database initialized');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            this.showToast('Veritabanı başlatılamadı', 'error');
        }

        // Register service worker
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./service-worker.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }

        // Setup navigation
        this.setupNavigation();

        // Handle browser back/forward buttons
        window.addEventListener('hashchange', () => {
            const route = window.location.hash.slice(1) || 'classes';
            this.navigate(route, false);
        });

        // Load initial route from URL hash or default
        const initialRoute = window.location.hash.slice(1) || 'main';
        this.navigate(initialRoute);
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('[data-route]');
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                this.navigate(route);

                // Close mobile menu
                navMenu.classList.remove('active');
            });
        });

        // Mobile menu toggle
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    async navigate(route, updateHash = true) {
        this.currentRoute = route;

        // Update URL hash
        if (updateHash) {
            window.location.hash = route;
        }

        // Update active nav link
        document.querySelectorAll('[data-route]').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-route') === route) {
                link.classList.add('active');
            }
        });

        // Load route content
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = '';

        this.showLoading(true);

        try {
            switch (route) {
                case 'main':
                    await this.loadMainFlow();
                    break;
                case 'classes':
                    await this.loadClassesView();
                    break;
                case 'students':
                    await this.loadStudentsView();
                    break;
                case 'criteria':
                    await this.loadCriteriaView();
                    break;
                case 'assessment':
                    await this.loadAssessmentView();
                    break;
                case 'grades':
                    await this.loadGradesView();
                    break;
                case 'reports':
                    await this.loadReportsView();
                    break;
                case 'semester-report':
                    await this.loadSemesterReportView();
                    break;
                case 'settings':
                    await this.loadSettingsView();
                    break;
                default:
                    mainContent.innerHTML = '<h2>Sayfa bulunamadı</h2>';
            }
        } catch (error) {
            console.error('Error loading view:', error);
            this.showToast('Sayfa yüklenirken hata oluştu', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Save state to localStorage
    static saveState(key, value) {
        try {
            localStorage.setItem(`app_state_${key}`, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    // Load state from localStorage
    static loadState(key) {
        try {
            const value = localStorage.getItem(`app_state_${key}`);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Failed to load state:', error);
            return null;
        }
    }

    // Instance methods that call static methods
    saveState(key, value) {
        return App.saveState(key, value);
    }

    loadState(key) {
        return App.loadState(key);
    }

    async loadClassesView() {
        const { default: ClassManager } = await import('./components/ClassManager.js');
        const manager = new ClassManager();
        await manager.render();
    }

    async loadStudentsView() {
        const { default: StudentManager } = await import('./components/StudentManager.js');
        const manager = new StudentManager();
        await manager.render();
    }

    async loadCriteriaView() {
        const { default: CriteriaManager } = await import('./components/CriteriaManager.js');
        const manager = new CriteriaManager();
        await manager.render();
    }

    async loadAssessmentView() {
        const { default: ArtworkAssessment } = await import('./components/ArtworkAssessment.js');
        const manager = new ArtworkAssessment();
        await manager.render();
    }

    async loadReportsView() {
        const { default: ReportsManager } = await import('./components/ReportsManager.js');
        const manager = new ReportsManager();
        await manager.render();
    }

    async loadSettingsView() {
        const { default: SettingsManager } = await import('./components/SettingsManager.js');
        const manager = new SettingsManager();
        await manager.render();
    }

    async loadGradesView() {
        const { default: GradeManager } = await import('./components/GradeManager.js');
        const manager = new GradeManager();
        await manager.render();
    }

    async loadSemesterReportView() {
        const { default: SemesterReportManager } = await import('./components/SemesterReportManager.js');
        const manager = new SemesterReportManager();
        await manager.render();
    }

    async loadMainFlow() {
        const { default: MainFlow } = await import('./components/MainFlow.js');
        const mainFlow = new MainFlow();
        await mainFlow.render();
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (show) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

export default App;
