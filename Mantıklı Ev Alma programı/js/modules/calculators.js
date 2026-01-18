/**
 * Mantıklı Ev Alma - Calculation Modules
 * 5 ana hesaplama modülü + Core Engine
 */

// ===============================
// 1. KİRA ÇARPANI HESAPLAYICI
// ===============================
const RentMultiplierCalculator = {
    calculate(askingPrice, monthlyRent, regionalAvgMultiplier = 20) {
        const annualRent = monthlyRent * 12;
        const rentMultiplier = annualRent > 0 ? askingPrice / annualRent : Infinity;
        const amortizationYears = rentMultiplier;

        const comparisonPercent = ((rentMultiplier - regionalAvgMultiplier) / regionalAvgMultiplier) * 100;

        let regionalComparison;
        if (comparisonPercent <= -10) {
            regionalComparison = 'cheap';
        } else if (comparisonPercent >= 10) {
            regionalComparison = 'expensive';
        } else {
            regionalComparison = 'normal';
        }

        // Skor: düşük çarpan = yüksek skor (10 yıl → 100, 30 yıl → 0)
        const score = Math.max(0, Math.min(100, 100 - ((rentMultiplier - 10) / 20) * 100));

        return {
            annualRent: Math.round(annualRent),
            rentMultiplier: Math.round(rentMultiplier * 10) / 10,
            amortizationYears: Math.round(amortizationYears * 10) / 10,
            regionalComparison,
            comparisonPercent: Math.round(comparisonPercent * 10) / 10,
            score: Math.round(score)
        };
    }
};

// ===============================
// 2. KREDİ MALİYET HESAPLAYICI
// ===============================
const LoanCostCalculator = {
    calculate(propertyPrice, downPayment, annualInterestRate, termMonths, processingFeeRate = 0.02, expertiseFee = 5000) {
        const loanAmount = propertyPrice - downPayment;
        const processingFee = loanAmount * processingFeeRate + expertiseFee;
        const monthlyRate = annualInterestRate / 100 / 12;

        let monthlyPayment;
        if (monthlyRate === 0) {
            monthlyPayment = loanAmount / termMonths;
        } else {
            const factor = Math.pow(1 + monthlyRate, termMonths);
            monthlyPayment = loanAmount * (monthlyRate * factor) / (factor - 1);
        }

        const totalPayment = monthlyPayment * termMonths + processingFee;
        const totalInterest = totalPayment - loanAmount;
        const effectiveInterestRate = loanAmount > 0 ? (totalInterest / loanAmount) * 100 : 0;
        const loanToValueRatio = (loanAmount / propertyPrice) * 100;

        // Skor: Düşük efektif faiz = Yüksek skor (%50 → 100, %200 → 0)
        const score = Math.max(0, Math.min(100, 100 - ((effectiveInterestRate - 50) / 150) * 100));

        return {
            loanAmount: Math.round(loanAmount),
            processingFee: Math.round(processingFee),
            monthlyPayment: Math.round(monthlyPayment),
            totalPayment: Math.round(totalPayment),
            totalInterest: Math.round(totalInterest),
            effectiveInterestRate: Math.round(effectiveInterestRate * 10) / 10,
            loanToValueRatio: Math.round(loanToValueRatio),
            score: Math.round(score)
        };
    }
};

// ===============================
// 3. ALTERNATİF YATIRIM HESAPLAYICI
// ===============================
const AlternativeInvestmentCalculator = {
    calculate(initialCapital, investmentPeriodYears, depositRate, goldRate, forexRate, propertyAppreciation, annualRentIncome) {
        const years = investmentPeriodYears;

        // Mevduat: Bileşik faiz
        const depositFV = initialCapital * Math.pow(1 + depositRate, years);
        const depositReturn = depositFV - initialCapital;

        // Altın
        const goldFV = initialCapital * Math.pow(1 + goldRate, years);
        const goldReturn = goldFV - initialCapital;

        // Döviz
        const forexFV = initialCapital * Math.pow(1 + forexRate, years);
        const forexReturn = forexFV - initialCapital;

        // Emlak: Değer artışı + Kira geliri
        const propertyFV = initialCapital * Math.pow(1 + propertyAppreciation, years);

        // Kira geliri (her yıl %25 artış varsayımı)
        let totalRent = 0;
        let currentRent = annualRentIncome;
        for (let i = 0; i < years; i++) {
            totalRent += currentRent;
            currentRent *= 1.25;
        }

        const propertyReturn = (propertyFV - initialCapital) + totalRent;

        // Yıllık bileşik getiri
        const annualize = (total) => (Math.pow((initialCapital + total) / initialCapital, 1 / years) - 1) * 100;

        // En iyi alternatif
        const returns = { deposit: depositReturn, gold: goldReturn, forex: forexReturn, property: propertyReturn };
        const sorted = Object.entries(returns).sort((a, b) => b[1] - a[1]);
        const bestAlt = sorted[0][0];

        // Fırsat maliyeti
        const maxAltReturn = Math.max(depositReturn, goldReturn, forexReturn);
        const opportunityCost = maxAltReturn - propertyReturn;

        // Skor: Emlak en iyiyse 100, en kötüyse 0
        const propertyRank = Object.values(returns).filter(r => r <= propertyReturn).length;
        const score = ((propertyRank - 1) / 3) * 100;

        return {
            deposit: {
                futureValue: Math.round(depositFV),
                totalReturn: Math.round(depositReturn),
                annualizedReturn: Math.round(annualize(depositReturn) * 10) / 10
            },
            gold: {
                futureValue: Math.round(goldFV),
                totalReturn: Math.round(goldReturn),
                annualizedReturn: Math.round(annualize(goldReturn) * 10) / 10
            },
            forex: {
                futureValue: Math.round(forexFV),
                totalReturn: Math.round(forexReturn),
                annualizedReturn: Math.round(annualize(forexReturn) * 10) / 10
            },
            property: {
                futureValue: Math.round(propertyFV),
                totalRentIncome: Math.round(totalRent),
                totalReturn: Math.round(propertyReturn),
                annualizedReturn: Math.round(annualize(propertyReturn) * 10) / 10
            },
            opportunityCost: Math.round(opportunityCost),
            bestAlternative: bestAlt,
            score: Math.round(score)
        };
    }
};

// ===============================
// 4. ENFLASYON & DEĞER ARTIŞI HESAPLAYICI
// ===============================
const InflationValueCalculator = {
    calculate(currentPrice, annualRent, scenarios) {
        const years = [1, 5, 10, 15];

        const processScenario = (inflation, appreciation) => {
            return years.map(year => {
                const nominalValue = currentPrice * Math.pow(1 + appreciation, year);
                const realValue = nominalValue / Math.pow(1 + inflation, year);

                let cumRent = 0;
                let rent = annualRent;
                for (let i = 0; i < year; i++) {
                    cumRent += rent;
                    rent *= 1.25;
                }

                const netGainLoss = (realValue - currentPrice) + cumRent;

                return {
                    year,
                    nominalValue: Math.round(nominalValue),
                    realValue: Math.round(realValue),
                    cumulativeRent: Math.round(cumRent),
                    netGainLoss: Math.round(netGainLoss)
                };
            });
        };

        const low = processScenario(scenarios.low.inflation, scenarios.low.appreciation);
        const medium = processScenario(scenarios.medium.inflation, scenarios.medium.appreciation);
        const high = processScenario(scenarios.high.inflation, scenarios.high.appreciation);

        const mediumResult10 = medium.find(r => r.year === 10);
        const recommendation = mediumResult10.netGainLoss > 0
            ? "Orta vadede olumlu getiri bekleniyor."
            : "Reel bazda değer kaybı riski var.";

        const realReturnRate = (mediumResult10.realValue - currentPrice) / currentPrice;
        const score = Math.max(0, Math.min(100, 50 + realReturnRate * 100));

        return { low, medium, high, recommendation, score: Math.round(score) };
    }
};

// ===============================
// 5. VERGİ & GİDER HESAPLAYICI
// ===============================
const TaxExpenseCalculator = {
    calculate(annualRentGross, rentExemption, taxBrackets, monthlyMaintenanceFee, annualInsurance, annualRepairBudget, propertyPrice, deedTaxRate = 0.04, agentCommissionRate = 0.02, expertiseFee = 5000) {
        // Vergiye tabi gelir
        const taxableIncome = Math.max(0, annualRentGross - rentExemption);

        // Kademeli vergi
        let annualTax = 0;
        let remaining = taxableIncome;
        let prevLimit = 0;

        for (const bracket of taxBrackets) {
            const bracketAmount = Math.min(remaining, bracket.upperLimit - prevLimit);
            if (bracketAmount <= 0) break;
            annualTax += bracketAmount * bracket.rate;
            remaining -= bracketAmount;
            prevLimit = bracket.upperLimit;
        }

        const effectiveTaxRate = annualRentGross > 0 ? (annualTax / annualRentGross) * 100 : 0;
        const netAnnualRent = annualRentGross - annualTax;

        // Yıllık giderler
        const annualMaintenanceFee = monthlyMaintenanceFee * 12;
        const totalAnnualExpenses = annualMaintenanceFee + annualInsurance + annualRepairBudget;
        const netAnnualIncome = netAnnualRent - totalAnnualExpenses;

        // Alım masrafları
        const deedTax = propertyPrice * deedTaxRate;
        const agentCommission = propertyPrice * agentCommissionRate;
        const totalPurchaseCosts = deedTax + agentCommission + expertiseFee;

        // Getiri oranları
        const totalInvestment = propertyPrice + totalPurchaseCosts;
        const grossYield = (annualRentGross / totalInvestment) * 100;
        const netYield = (netAnnualIncome / totalInvestment) * 100;

        // Skor: Net getiri %5+ = 100, %0 = 0
        const score = Math.max(0, Math.min(100, netYield * 20));

        return {
            taxableIncome: Math.round(taxableIncome),
            annualTax: Math.round(annualTax),
            effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
            netAnnualRent: Math.round(netAnnualRent),
            annualMaintenanceFee: Math.round(annualMaintenanceFee),
            annualInsurance: Math.round(annualInsurance),
            annualRepairBudget: Math.round(annualRepairBudget),
            totalAnnualExpenses: Math.round(totalAnnualExpenses),
            netAnnualIncome: Math.round(netAnnualIncome),
            deedTax: Math.round(deedTax),
            agentCommission: Math.round(agentCommission),
            expertiseFee: expertiseFee,
            totalPurchaseCosts: Math.round(totalPurchaseCosts),
            grossYield: Math.round(grossYield * 100) / 100,
            netYield: Math.round(netYield * 100) / 100,
            score: Math.round(score)
        };
    }
};

// ===============================
// CORE ENGINE (Aggregator)
// ===============================
const CoreEngine = {
    analyze(propertyData, settings) {
        const {
            askingPrice,
            monthlyRent,
            downPayment,
            annualInterestRate,
            termMonths,
            monthlyMaintenanceFee = 2000,
            annualInsurance = 3000,
            annualRepairBudget = 10000
        } = propertyData;

        // 1. Kira çarpanı
        const rentMultiplier = RentMultiplierCalculator.calculate(askingPrice, monthlyRent);

        // 2. Kredi maliyeti
        const loanCost = LoanCostCalculator.calculate(
            askingPrice,
            downPayment,
            annualInterestRate,
            termMonths
        );

        // 3. Alternatif yatırım
        const alternativeInvestment = AlternativeInvestmentCalculator.calculate(
            downPayment + (askingPrice * 0.04), // Sermaye: peşinat + masraflar
            10, // 10 yıl
            settings.defaultInflation / 100 * 1.1, // Mevduat: enflasyon + alpha
            settings.defaultInflation / 100 * 0.9, // Altın
            settings.defaultInflation / 100, // Döviz
            settings.defaultAppreciation / 100, // Emlak değer artışı
            monthlyRent * 12 * 0.85 // Net yıllık kira
        );

        // 4. Enflasyon senaryoları
        const inflationValue = InflationValueCalculator.calculate(
            askingPrice,
            monthlyRent * 12 * 0.85,
            {
                low: { inflation: 0.25, appreciation: 0.30 },
                medium: { inflation: settings.defaultInflation / 100, appreciation: settings.defaultAppreciation / 100 },
                high: { inflation: 0.60, appreciation: 0.25 }
            }
        );

        // 5. Vergi & giderler
        const taxExpense = TaxExpenseCalculator.calculate(
            monthlyRent * 12,
            33000, // 2024 istisna
            TAX_BRACKETS_2024,
            monthlyMaintenanceFee,
            annualInsurance,
            annualRepairBudget,
            askingPrice
        );

        // 6. Ağırlıklı skor hesaplama
        const weightedScore = this.calculateWeightedScore({
            rentMultiplier: rentMultiplier.score,
            loanCost: loanCost.score,
            alternativeInvestment: alternativeInvestment.score,
            inflationResistance: inflationValue.score,
            taxExpenseRatio: taxExpense.score,
            regionTrend: 70 // Varsayılan bölge trendi
        });

        // 7. Türetilmiş değerler
        const fairPrice = this.calculateFairPrice(
            taxExpense.netAnnualIncome,
            settings.targetAmortizationYears,
            taxExpense.totalPurchaseCosts,
            loanCost.totalInterest
        );

        const discountNeeded = askingPrice > fairPrice
            ? ((askingPrice - fairPrice) / askingPrice) * 100
            : 0;

        const monthlyCashFlow = monthlyRent - loanCost.monthlyPayment;
        const rentCoverageRatio = loanCost.monthlyPayment > 0
            ? (monthlyRent / loanCost.monthlyPayment) * 100
            : 100;

        return {
            modules: {
                rentMultiplier,
                loanCost,
                alternativeInvestment,
                inflationValue,
                taxExpense
            },
            valuation: {
                totalScore: weightedScore.totalScore,
                scoreBreakdown: weightedScore.breakdown,
                fairPrice: Math.round(fairPrice),
                discountNeeded: Math.round(discountNeeded * 10) / 10,
                amortizationYears: rentMultiplier.amortizationYears,
                monthlyCashFlow: Math.round(monthlyCashFlow),
                rentCoverageRatio: Math.round(rentCoverageRatio * 10) / 10
            },
            calculatedAt: new Date().toISOString()
        };
    },

    calculateWeightedScore(scores) {
        const weights = SCORE_WEIGHTS;
        const breakdown = [
            { criterion: 'Kira Çarpanı', weight: weights.rentMultiplier, rawScore: scores.rentMultiplier, weightedScore: scores.rentMultiplier * weights.rentMultiplier },
            { criterion: 'Kredi Yükü', weight: weights.loanCost, rawScore: scores.loanCost, weightedScore: scores.loanCost * weights.loanCost },
            { criterion: 'Alternatif Yatırım', weight: weights.alternativeInvestment, rawScore: scores.alternativeInvestment, weightedScore: scores.alternativeInvestment * weights.alternativeInvestment },
            { criterion: 'Enflasyon Dayanıklılığı', weight: weights.inflationResistance, rawScore: scores.inflationResistance, weightedScore: scores.inflationResistance * weights.inflationResistance },
            { criterion: 'Vergi & Gider', weight: weights.taxExpenseRatio, rawScore: scores.taxExpenseRatio, weightedScore: scores.taxExpenseRatio * weights.taxExpenseRatio },
            { criterion: 'Bölge Trendi', weight: weights.regionTrend, rawScore: scores.regionTrend, weightedScore: scores.regionTrend * weights.regionTrend }
        ];

        const totalScore = Math.round(breakdown.reduce((sum, b) => sum + b.weightedScore, 0));

        return { totalScore, breakdown };
    },

    calculateFairPrice(netAnnualIncome, targetYears, purchaseCosts, totalInterest) {
        return (netAnnualIncome * targetYears) - purchaseCosts - (totalInterest * 0.5);
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RentMultiplierCalculator,
        LoanCostCalculator,
        AlternativeInvestmentCalculator,
        InflationValueCalculator,
        TaxExpenseCalculator,
        CoreEngine
    };
}
