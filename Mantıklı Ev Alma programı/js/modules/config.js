/**
 * Mantıklı Ev Alma - Configuration & Constants
 * Sabitler, vergi dilimleri, varsayılan değerler
 */

// ===============================
// 2024 VERGİ DİLİMLERİ (Türkiye)
// ===============================
const TAX_BRACKETS_2024 = [
    { upperLimit: 110000, rate: 0.15 },
    { upperLimit: 230000, rate: 0.20 },
    { upperLimit: 580000, rate: 0.27 },
    { upperLimit: 3000000, rate: 0.35 },
    { upperLimit: Infinity, rate: 0.40 }
];

const RENT_EXEMPTION_2024 = 33000;

// ===============================
// RİSK PROFİLLERİ
// ===============================
const RISK_PROFILES = {
    TEMKINLI: {
        name: 'Temkinli',
        emoji: '🛡️',
        description: 'Sadece çok net fırsatlarda harekete geç',
        thresholds: {
            maxPaybackYears: 20,
            minCashflowRatio: 0,
            maxFairPriceDeviation: 0.05
        }
    },
    DENGELI: {
        name: 'Dengeli',
        emoji: '⚖️',
        description: 'Makul risklerle orta vadeli yatırım',
        thresholds: {
            maxPaybackYears: 23,
            minCashflowRatio: -0.10,
            maxFairPriceDeviation: 0.10
        }
    },
    AGRESIF: {
        name: 'Agresif',
        emoji: '🚀',
        description: 'Potansiyel için daha fazla risk alabilirim',
        thresholds: {
            maxPaybackYears: 26,
            minCashflowRatio: -0.25,
            maxFairPriceDeviation: 0.15
        }
    }
};

// ===============================
// SKOR AĞIRLIKLARI
// ===============================
const SCORE_WEIGHTS = {
    rentMultiplier: 0.25,
    loanCost: 0.20,
    alternativeInvestment: 0.20,
    inflationResistance: 0.15,
    taxExpenseRatio: 0.10,
    regionTrend: 0.10
};

// ===============================
// KARAR KURALLARI
// ===============================
const DECISION_RULES = {
    BUY: {
        scoreMin: 70,
        cashflowMin: 0,
        paybackMax: 20,
        fairPriceGapMax: 0.05,
        rentRatioMin: 0.50
    },
    WAIT: {
        scoreRange: { min: 50, max: 69 },
        cashflowMin: -50000,
        paybackMax: 25
    },
    PASS: {
        scoreMax: 50,
        paybackMin: 25,
        rentRatioMax: 0.40,
        fairPriceGapMin: 0.15
    }
};

// ===============================
// MUTLAK GÜVENLİK SINRRLARI
// ===============================
const IMMUTABLE_RULES = {
    absoluteMinScore: 45,
    absoluteMaxPayback: 30,
    absoluteMinRentRatio: 0.20,
    absoluteMaxPriceGap: 0.25,
    maxCriticalFlags: 1
};

// ===============================
// VARSAYILAN AYARLAR
// ===============================
const DEFAULT_SETTINGS = {
    defaultInterest: 2.5,
    defaultInflation: 40,
    defaultRentIncrease: 25,
    defaultAppreciation: 30,
    targetAmortizationYears: 15,
    purchaseCostRate: 0.04,
    riskProfile: 'TEMKINLI',
    darkMode: true,
    currency: 'TRY',
    language: 'tr'
};

// ===============================
// ENFLASYON SENARYOLARI
// ===============================
const INFLATION_SCENARIOS = {
    low: { inflation: 0.25, appreciation: 0.30 },
    medium: { inflation: 0.40, appreciation: 0.35 },
    high: { inflation: 0.60, appreciation: 0.25 }
};

// ===============================
// ALTERNATİF YATIRIM ORANLARI (2024)
// ===============================
const ALTERNATIVE_RATES = {
    deposit: 0.45,    // Mevduat faizi
    gold: 0.35,       // Altın değer artışı
    forex: 0.40       // Döviz değer artışı
};

// ===============================
// UI SABİTLERİ
// ===============================
const UI_CONSTANTS = {
    SCORE_THRESHOLDS: {
        excellent: 75,
        good: 60,
        borderline: 45,
        poor: 30
    },
    COLORS: {
        positive: '#22c55e',
        warning: '#eab308',
        negative: '#ef4444',
        neutral: '#9ca3af',
        primary: '#7c3aed',
        secondary: '#3b82f6'
    },
    VERDICT_LABELS: {
        UCUZ: { emoji: '🟢', text: 'UCUZ', class: 'cheap' },
        MAKUL: { emoji: '🟡', text: 'MAKUL', class: 'reasonable' },
        PAHALI: { emoji: '🔴', text: 'PAHALI', class: 'expensive' }
    },
    DECISION_LABELS: {
        AL: { emoji: '✅', text: 'AL', color: '#22c55e' },
        BEKLE: { emoji: '⏸️', text: 'BEKLE', color: '#eab308' },
        VAZGEC: { emoji: '❌', text: 'VAZGEÇ', color: '#ef4444' }
    }
};

// ===============================
// YARDIMCI FONKSİYONLAR
// ===============================
function formatCurrency(amount, showSymbol = true) {
    const formatted = new Intl.NumberFormat('tr-TR').format(Math.round(amount));
    return showSymbol ? `₺${formatted}` : formatted;
}

function formatPercent(value, decimals = 1) {
    return `%${(value * 100).toFixed(decimals)}`;
}

function formatYears(years) {
    return `${years.toFixed(1)} yıl`;
}

// Export for module usage (ES6 modules support)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TAX_BRACKETS_2024,
        RENT_EXEMPTION_2024,
        RISK_PROFILES,
        SCORE_WEIGHTS,
        DECISION_RULES,
        IMMUTABLE_RULES,
        DEFAULT_SETTINGS,
        INFLATION_SCENARIOS,
        ALTERNATIVE_RATES,
        UI_CONSTANTS,
        formatCurrency,
        formatPercent,
        formatYears
    };
}
