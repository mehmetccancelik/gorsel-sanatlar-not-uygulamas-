/**
 * Mantıklı Ev Alma - Decision & AI Interpretation Engine
 * Otomatik karar motoru + AI yorumlama
 */

// ===============================
// OTOMATİK KARAR MOTORU
// ===============================
const AutomaticDecisionEngine = {

    decide(input) {
        const evaluation = this.evaluateRules(input);

        // Karar belirleme
        let decision;
        if (this.isStrongPass(evaluation)) {
            decision = 'VAZGEC';
        } else if (this.isStrongBuy(evaluation)) {
            decision = 'AL';
        } else if (this.shouldBuy(input)) {
            decision = 'AL';
        } else if (this.shouldPass(input)) {
            decision = 'VAZGEC';
        } else {
            decision = 'BEKLE';
        }

        const confidence = this.calculateConfidence(input, decision, evaluation);
        const reason = this.generateReason(input, decision, evaluation);
        const reconsiderIf = this.generateReconsiderConditions(input, decision);

        return {
            decision,
            confidence,
            reason,
            reconsiderIf,
            details: evaluation
        };
    },

    shouldBuy(input) {
        const rules = DECISION_RULES.BUY;
        return (
            input.investmentScore >= rules.scoreMin &&
            input.monthlyCashflow >= rules.cashflowMin &&
            input.paybackYears <= rules.paybackMax &&
            input.fairPriceGap <= rules.fairPriceGapMax &&
            input.rentToInstallmentRatio >= rules.rentRatioMin
        );
    },

    shouldPass(input) {
        const rules = DECISION_RULES.PASS;
        const criticalFlags = [
            input.investmentScore < rules.scoreMax,
            input.paybackYears > rules.paybackMin,
            input.rentToInstallmentRatio < rules.rentRatioMax,
            input.fairPriceGap > rules.fairPriceGapMin
        ];
        return criticalFlags.filter(Boolean).length >= 2;
    },

    evaluateRules(input) {
        const passed = [];
        const failed = [];
        const critical = [];

        // Skor kontrolü
        if (input.investmentScore >= 70) {
            passed.push('Yatırım skoru güçlü (≥70)');
        } else if (input.investmentScore >= 50) {
            failed.push('Yatırım skoru orta seviyede');
        } else {
            failed.push('Yatırım skoru düşük');
            critical.push('Düşük yatırım skoru');
        }

        // Nakit akışı
        if (input.monthlyCashflow >= 0) {
            passed.push('Pozitif nakit akışı');
        } else if (input.monthlyCashflow >= -50000) {
            failed.push('Hafif negatif nakit akışı');
        } else {
            failed.push('Ciddi negatif nakit akışı');
            critical.push('Yüksek aylık kayıp');
        }

        // Amortisman
        if (input.paybackYears <= 15) {
            passed.push('Hızlı amortisman (≤15 yıl)');
        } else if (input.paybackYears <= 20) {
            passed.push('Kabul edilebilir amortisman');
        } else if (input.paybackYears <= 25) {
            failed.push('Uzun amortisman süresi');
        } else {
            failed.push('Çok uzun amortisman');
            critical.push('Aşırı uzun geri ödeme süresi');
        }

        // Kira/Taksit oranı
        const rentPct = input.rentToInstallmentRatio * 100;
        if (rentPct >= 70) {
            passed.push(`Güçlü kira karşılama (%${rentPct.toFixed(0)})`);
        } else if (rentPct >= 50) {
            passed.push(`Yeterli kira karşılama (%${rentPct.toFixed(0)})`);
        } else if (rentPct >= 40) {
            failed.push(`Zayıf kira karşılama (%${rentPct.toFixed(0)})`);
        } else {
            failed.push(`Yetersiz kira karşılama (%${rentPct.toFixed(0)})`);
            critical.push('Kira taksiti karşılamıyor');
        }

        // Fiyat/Adil değer
        const gapPct = input.fairPriceGap * 100;
        if (gapPct <= 0) {
            passed.push('Adil değerin altında fiyat');
        } else if (gapPct <= 5) {
            passed.push('Fiyat adil değere yakın');
        } else if (gapPct <= 15) {
            failed.push(`Fiyat adil değerin %${gapPct.toFixed(0)} üzerinde`);
        } else {
            failed.push(`Fiyat çok yüksek (%${gapPct.toFixed(0)} üzeri)`);
            critical.push('Aşırı fiyatlandırma');
        }

        return { passedRules: passed, failedRules: failed, criticalFlags: critical };
    },

    isStrongBuy(evaluation) {
        return evaluation.passedRules.length >= 4 && evaluation.criticalFlags.length === 0;
    },

    isStrongPass(evaluation) {
        return evaluation.criticalFlags.length >= 3;
    },

    calculateConfidence(input, decision, evaluation) {
        const totalRules = evaluation.passedRules.length + evaluation.failedRules.length;

        if (decision === 'AL') {
            const passRatio = evaluation.passedRules.length / totalRules;
            const scoreBonus = (input.investmentScore - 50) / 100;
            return Math.min(99, Math.round((passRatio * 70) + (scoreBonus * 30)));
        }

        if (decision === 'VAZGEC') {
            const criticalWeight = evaluation.criticalFlags.length * 20;
            const failWeight = evaluation.failedRules.length * 10;
            return Math.min(99, Math.round(50 + criticalWeight + failWeight));
        }

        return Math.round(40 + Math.random() * 20);
    },

    generateReason(input, decision, evaluation) {
        switch (decision) {
            case 'AL':
                if (evaluation.passedRules.length >= 4) {
                    return 'Tüm temel kriterler karşılanıyor, veriler bu yatırımı destekliyor';
                }
                return 'Genel değerlendirme olumlu, yatırım yapılabilir';

            case 'BEKLE':
                if (input.fairPriceGap > 0.10) {
                    return 'Pazarlık yapılırsa mantıklı hale gelebilir';
                }
                if (input.interestRate > 2.5) {
                    return 'Faiz oranları düşerse yeniden değerlendirilebilir';
                }
                return 'Koşullar iyileşirse değerlendirilebilir, şu an için beklemek mantıklı';

            case 'VAZGEC':
                if (evaluation.criticalFlags.length >= 2) {
                    const flags = evaluation.criticalFlags.slice(0, 2).join(' ve ');
                    return `${flags} nedeniyle mevcut verilere göre vazgeçmek daha güvenli`;
                }
                return 'Risk/getiri dengesi olumsuz, vazgeçmek öneriliyor';

            default:
                return 'Değerlendirme tamamlandı';
        }
    },

    generateReconsiderConditions(input, decision) {
        const conditions = [];
        const fmt = (n) => new Intl.NumberFormat('tr-TR').format(n);

        if (decision === 'AL') {
            if (input.fairPriceGap > 0) {
                conditions.push('Fiyatta %5-10 indirim alınırsa daha güçlü yatırım olur');
            }
            return conditions.length ? conditions : ['Mevcut koşullar uygun, ek beklemeye gerek yok'];
        }

        if (input.fairPriceGap > 0.10) {
            const neededDrop = Math.round(input.fairPriceGap * 100);
            conditions.push(`Ev fiyatı %${Math.min(neededDrop + 5, 30)} düşerse`);
        }

        if (input.interestRate > 2.0) {
            conditions.push('Faiz oranı %2.0 altına düşerse');
        }

        if (input.downPaymentRatio < 0.30) {
            const targetPct = Math.min(40, Math.round(input.downPaymentRatio * 100) + 10);
            conditions.push(`Peşinat %${targetPct} seviyesine çıkarılırsa`);
        }

        if (input.rentToInstallmentRatio < 0.50) {
            conditions.push('Bölgede kira potansiyeli artarsa');
        }

        return conditions.slice(0, 4);
    }
};

// ===============================
// RİSK AYARLI KARAR MOTORU
// ===============================
const RiskAdjustedDecisionEngine = {

    decide(input, riskProfile = 'TEMKINLI') {
        const config = RISK_PROFILES[riskProfile];
        const thresholds = config.thresholds;

        const baseDecision = AutomaticDecisionEngine.decide(input);

        // VAZGEÇ asla değişmez
        if (baseDecision.decision === 'VAZGEC') {
            return {
                ...baseDecision,
                riskProfile,
                riskAdjusted: false,
                note: 'Risk profili bu kararı değiştirmez - temel riskler çok yüksek'
            };
        }

        // BEKLE → AL dönüşümü mümkün mü?
        if (baseDecision.decision === 'BEKLE') {
            const canUpgrade = this.canUpgradeToBuy(input, thresholds);

            if (canUpgrade) {
                return {
                    decision: 'AL',
                    confidence: Math.min(baseDecision.confidence + 5, 80),
                    reason: `${config.name} risk profiline göre bu yatırım kabul edilebilir sınırda.`,
                    reconsiderIf: baseDecision.reconsiderIf,
                    riskProfile,
                    riskAdjusted: true,
                    note: `${config.emoji} ${config.name} profile göre sınırda bir yatırım, dikkatli ilerlenmeli`,
                    details: baseDecision.details
                };
            }
        }

        return {
            ...baseDecision,
            riskProfile,
            riskAdjusted: false,
            note: `${config.emoji} ${config.name} profil ile uyumlu karar`
        };
    },

    canUpgradeToBuy(input, thresholds) {
        if (input.paybackYears > thresholds.maxPaybackYears) return false;

        const cashflowRatio = input.monthlyCashflow / Math.abs(input.monthlyMortgage || 1);
        if (cashflowRatio < thresholds.minCashflowRatio) return false;

        if (input.fairPriceGap > thresholds.maxFairPriceDeviation) return false;

        if (input.investmentScore < 55) return false;

        return true;
    }
};

// ===============================
// AI YORUMLAMA MOTORU
// ===============================
const AIInterpretationEngine = {

    interpret(input) {
        const shortDecision = this.generateShortDecision(input);
        const summary = this.generateSummary(input);
        const improvementScenarios = this.generateScenarios(input);

        return {
            shortDecision,
            summary,
            improvementScenarios,
            meta: {
                generatedAt: new Date().toISOString(),
                inputScore: input.investmentScore
            }
        };
    },

    generateShortDecision(input) {
        const score = input.investmentScore;

        if (score >= 75) {
            return {
                text: 'Bu ev, mevcut koşullarda iyi bir yatırım fırsatı olarak görünüyor.',
                emoji: '🟢',
                tone: 'encouraging'
            };
        }
        if (score >= 60) {
            return {
                text: 'Fiyat makul seviyede, pazarlıkla daha da iyileştirilebilir.',
                emoji: '🟢',
                tone: 'encouraging'
            };
        }
        if (score >= 45) {
            return {
                text: 'Yatırım olarak sınırda, dikkatli değerlendirme gerekiyor.',
                emoji: '🟡',
                tone: 'cautious'
            };
        }
        if (score >= 30) {
            return {
                text: 'Bu ev, mevcut koşullarda yatırım amaçlı pahalı görünüyor.',
                emoji: '🟠',
                tone: 'warning'
            };
        }
        return {
            text: 'Bu fiyat ve koşullarla yatırım olarak önerilmiyor.',
            emoji: '🔴',
            tone: 'critical'
        };
    },

    generateSummary(input) {
        const points = [];

        // Kira/Taksit oranı
        const ratio = input.rentToInstallmentRatio * 100;
        if (ratio >= 80) {
            points.push({ icon: '✅', text: `Kira geliri, kredi taksitinin %${ratio.toFixed(0)}'ini karşılıyor - güçlü bir oran`, severity: 'positive' });
        } else if (ratio >= 50) {
            points.push({ icon: '⚖️', text: `Kira geliri, taksitin %${ratio.toFixed(0)}'ini karşılıyor - kabul edilebilir`, severity: 'neutral' });
        } else {
            points.push({ icon: '⚠️', text: `Aylık kira, kredi taksitinin yalnızca %${ratio.toFixed(0)}'ini karşılıyor`, severity: 'negative' });
        }

        // Amortisman
        if (input.paybackYears <= 15) {
            points.push({ icon: '✅', text: `${input.paybackYears.toFixed(1)} yıllık amortisman süresi - hızlı geri dönüş`, severity: 'positive' });
        } else if (input.paybackYears <= 22) {
            points.push({ icon: '⚖️', text: `Amortisman süresi ${input.paybackYears.toFixed(1)} yıl - orta vadeli yatırım`, severity: 'neutral' });
        } else {
            points.push({ icon: '⚠️', text: `Amortisman süresi ${input.paybackYears.toFixed(1)} yıl ile oldukça uzun`, severity: 'negative' });
        }

        // Nakit akışı
        const fmt = (n) => new Intl.NumberFormat('tr-TR').format(Math.abs(n));
        if (input.monthlyCashflow >= 0) {
            points.push({ icon: '✅', text: input.monthlyCashflow > 0 ? `Aylık ${fmt(input.monthlyCashflow)} TL pozitif nakit akışı sağlıyor` : 'Kira geliri taksiti tam karşılıyor', severity: 'positive' });
        } else {
            points.push({ icon: '⚠️', text: `Her ay cebinizden ${fmt(input.monthlyCashflow)} TL çıkacak`, severity: 'negative' });
        }

        // Alternatif
        if (input.alternativesBetter) {
            points.push({ icon: '💡', text: `Aynı sermaye ${input.bestAlternative || 'alternatif yatırımlarda'} daha düşük riskle benzer getiri sunuyor`, severity: 'negative' });
        }

        const negativeCount = points.filter(p => p.severity === 'negative').length;
        const overallTone = negativeCount >= 3 ? 'negative' : negativeCount >= 1 ? 'mixed' : 'positive';

        return { points: points.slice(0, 4), overallTone };
    },

    generateScenarios(input) {
        const scenarios = [];
        const fmt = (n) => new Intl.NumberFormat('tr-TR').format(n);

        if (input.interestRate > 2.0) {
            scenarios.push({ condition: 'Faiz oranı %2.0 altına düşerse', impact: 'high', feasibility: 'possible', icon: '📉' });
        }

        if (input.fairPriceGap > 0.05) {
            const drop = Math.round(input.fairPriceGap * 100) + 5;
            scenarios.push({ condition: `Ev fiyatı %${Math.min(drop, 30)} düşerse`, impact: 'high', feasibility: drop <= 15 ? 'likely' : 'possible', icon: '💰' });
        }

        if (input.rentToInstallmentRatio < 0.5 && input.monthlyMortgage) {
            const targetRent = Math.round(input.monthlyMortgage * 0.6);
            scenarios.push({ condition: `Kira ${fmt(targetRent)} TL seviyesine çıkarsa`, impact: 'medium', feasibility: 'possible', icon: '🏠' });
        }

        if (input.downPaymentRatio < 0.30) {
            scenarios.push({ condition: 'Peşinat %30\'a çıkarılırsa', impact: 'medium', feasibility: 'likely', icon: '💵' });
        }

        const intro = input.investmentScore < 50
            ? 'Aşağıdaki koşullardan biri olursa tablo değişebilir:'
            : 'Daha da iyileştirmek için:';

        return { intro, scenarios: scenarios.slice(0, 4) };
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AutomaticDecisionEngine,
        RiskAdjustedDecisionEngine,
        AIInterpretationEngine
    };
}
