/**
 * Mantıklı Ev Alma - Language & Text Generation Engine
 * Türkçe metin şablonları ve pazarlık metinleri
 */

// ===============================
// KISA KARAR ŞABLONLARİ
// ===============================
const SHORT_SUMMARY_TEMPLATES = {
    UCUZ_FIRSAT: 'Bu ev, mevcut piyasa koşullarında gerçek bir fırsat görünüyor.',
    MAKUL_AL: 'Fiyat makul seviyede, yatırım olarak değerlendirilebilir.',
    MAKUL_DIKKATLI: 'Fiyat uygun ancak kira geliri kredi yükünü karşılamıyor.',
    PAZARLIK_SART: 'Bu ev, ciddi bir pazarlık yapılmadan yatırım için uygun değil.',
    PAHALI: 'Mevcut fiyat, kira getirisi ve kredi maliyetine göre yüksek.',
    COK_PAHALI: 'Bu fiyatla ev almak finansal açıdan önerilmez.'
};

// ===============================
// KARAR DİLİ MOTORU
// ===============================
const DecisionLanguageEngine = {

    generateShortSummary(verdict) {
        return SHORT_SUMMARY_TEMPLATES[verdict] || SHORT_SUMMARY_TEMPLATES.PAHALI;
    },

    generateDetailedAnalysis(input) {
        const fmt = (n) => new Intl.NumberFormat('tr-TR').format(n);
        const paragraphs = [];

        // Paragraf 1: Fiyat karşılaştırması
        paragraphs.push(
            `Satıcının istediği fiyat ${fmt(input.askingPrice)} TL. ` +
            `Kira getirisi ve kredi maliyetine göre bu evin adil değeri ` +
            `${fmt(input.fairPrice)} TL olarak hesaplandı.`
        );

        // Paragraf 2: Amortisman
        const amortStatus = input.amortizationYears <= 15
            ? 'uygun bir sürede'
            : input.amortizationYears <= 20
                ? 'kabul edilebilir bir sürede'
                : 'oldukça uzun bir sürede';
        paragraphs.push(
            `Bu ev kendini ${input.amortizationYears.toFixed(1)} yılda amorti ediyor. ` +
            `Bu ${amortStatus} kendini ödeyen bir yatırım.`
        );

        // Paragraf 3: Nakit akışı
        if (input.monthlyCashFlow >= 0) {
            paragraphs.push(
                `Aylık kira geliri, kredi taksitini karşılayarak ` +
                `${fmt(input.monthlyCashFlow)} TL pozitif nakit akışı sağlıyor.`
            );
        } else {
            paragraphs.push(
                `Aylık kira geliri kredi taksitini karşılamıyor. ` +
                `Her ay ${fmt(Math.abs(input.monthlyCashFlow))} TL cebinizden çıkacak.`
            );
        }

        return paragraphs;
    },

    generateVerdict(score) {
        if (score >= 75) return 'UCUZ_FIRSAT';
        if (score >= 60) return 'MAKUL_AL';
        if (score >= 50) return 'MAKUL_DIKKATLI';
        if (score >= 40) return 'PAZARLIK_SART';
        if (score >= 25) return 'PAHALI';
        return 'COK_PAHALI';
    }
};

// ===============================
// PAZARLIK METNİ ÜRETİCİ
// ===============================
const NegotiationScriptGenerator = {

    generate(input, strategy) {
        const fmt = (n) => new Intl.NumberFormat('tr-TR').format(n);

        const opening = "Evi gerçekten beğendim ve ciddi olarak ilgileniyorum.";

        const argument =
            `Ancak kendi kredi ve kira hesaplarımı yaptığımda, ` +
            `mevcut faiz oranları ve bölgedeki kira getirileriyle ` +
            `bu ev benim için en fazla ${fmt(strategy.suggestedOffer)} TL ` +
            `seviyesinde mantıklı oluyor.`;

        const offer =
            "Bu fiyata inebilirseniz hemen işlemleri başlatabiliriz.";

        let closing;
        if (strategy.suggestedOffer < input.askingPrice * 0.9) {
            closing =
                `Anlıyorum bu sizin için düşük gelebilir, ` +
                `ama piyasa koşulları ve yatırım mantığı bunu gerektiriyor.`;
        } else {
            closing =
                `Zaten fiyatınıza çok yakın bir noktadayız, ` +
                `küçük bir adımla anlaşabiliriz.`;
        }

        return {
            opening,
            argument,
            offer,
            closing,
            fullScript: `${opening}\n\n${argument}\n\n${offer}\n\n${closing}`
        };
    },

    generateStrategy(askingPrice, fairPrice) {
        const suggestedOffer = Math.round(fairPrice * 0.95);
        const maxAcceptable = Math.round(fairPrice * 1.05);
        const walkAwayPoint = Math.round(fairPrice * 1.10);

        const calcDiscount = (price) => ((askingPrice - price) / askingPrice) * 100;

        const gap = ((askingPrice - fairPrice) / askingPrice) * 100;
        let strategyNote;

        if (gap <= 5) {
            strategyNote = "Fiyat zaten makul seviyede. Sembolik bir indirimle anlaşmaya çalışın.";
        } else if (gap <= 15) {
            strategyNote = "Makul bir pazarlık aralığı var. Kararlı ama saygılı bir tutum benimseyin.";
        } else if (gap <= 25) {
            strategyNote = "Ciddi pazarlık gerekiyor. Rakamlarınızı net sunun, aceleci olmayın.";
        } else {
            strategyNote = "Çok büyük fark var. Ya satıcı çok motive olmalı ya da alternatif aramalısınız.";
        }

        return {
            suggestedOffer,
            maxAcceptable,
            walkAwayPoint,
            discountFromAsking: {
                suggested: Math.round(calcDiscount(suggestedOffer) * 10) / 10,
                max: Math.round(calcDiscount(maxAcceptable) * 10) / 10,
                walkAway: Math.round(calcDiscount(walkAwayPoint) * 10) / 10
            },
            strategyNote
        };
    }
};

// ===============================
// RİSK UYARI ÜRETİCİ
// ===============================
const RiskWarningGenerator = {

    generate(input) {
        const bullets = [];
        const fmt = (n) => new Intl.NumberFormat('tr-TR').format(Math.abs(n));

        // Kira karşılama riski
        if (input.rentCoverageRatio < 30) {
            bullets.push(
                `⚠️ Kira geliri kredi taksitinin yalnızca %${input.rentCoverageRatio.toFixed(0)}'ini karşılıyor. ` +
                `Bu durum ciddi nakit yükü oluşturabilir.`
            );
        }

        // Negatif nakit akışı
        if (input.monthlyCashFlow < 0) {
            bullets.push(
                `⚠️ Her ay cebinizden ${fmt(input.monthlyCashFlow)} TL çıkacak. ` +
                `Bu yükü uzun vadeli taşıyabileceğinizden emin olun.`
            );
        }

        // Uzun amortisman
        if (input.amortizationYears > 25) {
            bullets.push(
                `⚠️ ${input.amortizationYears.toFixed(0)} yıllık amortisman süresi çok uzun. ` +
                `Bu sürede piyasa koşulları önemli ölçüde değişebilir.`
            );
        }

        // Büyük fiyat farkı
        if (input.discountNeeded > 25) {
            bullets.push(
                `⚠️ Adil fiyata ulaşmak için %${input.discountNeeded.toFixed(0)} indirim gerekiyor. ` +
                `Bu büyüklükte pazarlık genellikle zordur.`
            );
        }

        // Yüksek faiz
        if (input.effectiveInterestRate > 100) {
            bullets.push(
                `⚠️ Efektif faiz oranı %${input.effectiveInterestRate.toFixed(0)} seviyesinde. ` +
                `Krediye ödediğiniz faiz, aldığınız evin değerini aşıyor.`
            );
        }

        const hasHighRisk = bullets.length >= 2;

        const summary = hasHighRisk
            ? "Bu yatırımda dikkat edilmesi gereken önemli riskler var."
            : bullets.length > 0
                ? "Bazı noktalara dikkat etmeniz önerilir."
                : "Belirgin bir risk tespit edilmedi.";

        return { hasHighRisk, bullets, summary };
    }
};

// ===============================
// KARAR AÇIKLAMA METİNLERİ
// ===============================
const VerdictExplanations = {

    getExplanation(verdict, analysis) {
        const fmt = (n) => new Intl.NumberFormat('tr-TR').format(n);

        switch (verdict) {
            case 'UCUZ':
            case 'UCUZ_FIRSAT':
                return `Bu ev, ${analysis.amortizationYears.toFixed(1)} yılda kendini amorti ediyor. ` +
                    `Kira geliri taksitin %${analysis.rentCoverageRatio?.toFixed(0) || '?'}'sini karşılıyor. ` +
                    `Bölge ortalamasına göre değerli bir fırsat.`;

            case 'MAKUL':
            case 'MAKUL_AL':
                return `${analysis.amortizationYears.toFixed(1)} yıllık amortisman süresi kabul edilebilir seviyede. ` +
                    `Pazarlıkla ${fmt(analysis.fairPrice)} TL'ye indirilebilirse ideal olur.`;

            case 'MAKUL_DIKKATLI':
                return `Fiyat makul ancak kira geliri yetersiz. Her ay ${fmt(Math.abs(analysis.netMonthlyCost || 0))} TL ` +
                    `cebinizden gidecek. Bu yükü taşıyabiliyorsanız değerlendirilebilir.`;

            case 'PAZARLIK_SART':
                return `Mevcut fiyat yatırım mantığına uymuyor. ` +
                    `En az %${analysis.discountNeeded?.toFixed(0) || '?'} indirim yapılmalı.`;

            case 'PAHALI':
                return `${analysis.amortizationYears.toFixed(1)} yıllık amortisman süresi çok uzun. ` +
                    `Kira geliri taksitin sadece %${analysis.rentCoverageRatio?.toFixed(0) || '?'}'sini karşılıyor. ` +
                    `Ciddi pazarlık veya alternatif arayışı önerilir.`;

            case 'COK_PAHALI':
                return `Bu fiyatla ev almak yatırım mantığına aykırı. ` +
                    `${fmt(analysis.fairPrice)} TL'nin çok üzerinde. Uzak durmanızı öneririm.`;

            default:
                return 'Analiz sonuçlarına göre değerlendirme yapıldı.';
        }
    }
};

// ===============================
// TON MODİFİKATÖRLERİ
// ===============================
const ToneModifiers = {
    encouraging: {
        prefix: ['Güzel haber:', 'Olumlu gelişme:'],
        intensifiers: ['oldukça', 'gayet']
    },
    cautious: {
        prefix: ['Dikkat:', 'Not:'],
        intensifiers: ['biraz', 'kısmen']
    },
    warning: {
        prefix: ['Uyarı:', 'Dikkatli ol:'],
        intensifiers: ['ciddi şekilde', 'önemli ölçüde']
    },
    critical: {
        prefix: ['Önemli uyarı:', 'Kritik:'],
        intensifiers: ['çok', 'fazlasıyla']
    },

    apply(text, tone) {
        const mod = this[tone];
        if (!mod) return text;
        const prefix = mod.prefix[Math.floor(Math.random() * mod.prefix.length)];
        return `${prefix} ${text}`;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DecisionLanguageEngine,
        NegotiationScriptGenerator,
        RiskWarningGenerator,
        VerdictExplanations,
        ToneModifiers,
        SHORT_SUMMARY_TEMPLATES
    };
}
