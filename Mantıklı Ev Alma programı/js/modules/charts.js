/**
 * Mantıklı Ev Alma - Chart.js Integration
 * Grafik bileşenleri ve görselleştirme
 */

// ===============================
// GRAFİK YÖNETİCİSİ
// ===============================
const ChartManager = {
    charts: new Map(),

    // Tüm grafikleri temizle
    destroyAll() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    },

    // Tek grafik temizle
    destroy(id) {
        if (this.charts.has(id)) {
            this.charts.get(id).destroy();
            this.charts.delete(id);
        }
    },

    // Grafik güncelle
    update(id, newData) {
        const chart = this.charts.get(id);
        if (chart) {
            chart.data.datasets[0].data = newData;
            chart.update('active');
        }
    }
};

// ===============================
// 1. KİRA vs TAKSİT BAR CHART
// ===============================
const RentVsMortgageChart = {

    create(canvasId, monthlyRent, monthlyMortgage) {
        ChartManager.destroy(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const difference = monthlyMortgage - monthlyRent;
        const mortgageColor = difference > 0 ? '#ef4444' : '#22c55e';

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Aylık Kira', 'Aylık Taksit'],
                datasets: [{
                    data: [monthlyRent, monthlyMortgage],
                    backgroundColor: ['#9ca3af', mortgageColor],
                    borderRadius: 8,
                    barThickness: 40
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Kira Ödesem mi, Taksit mi?',
                        color: '#e5e7eb',
                        font: { size: 14, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${new Intl.NumberFormat('tr-TR').format(ctx.raw)} ₺`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: {
                            color: '#9ca3af',
                            callback: (val) => `${(val / 1000).toFixed(0)}K`
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#e5e7eb' }
                    }
                }
            }
        });

        ChartManager.charts.set(canvasId, chart);
        return chart;
    },

    getComparisonText(monthlyRent, monthlyMortgage) {
        const diff = Math.abs(monthlyMortgage - monthlyRent);
        const fmt = (n) => new Intl.NumberFormat('tr-TR').format(n);

        if (monthlyMortgage > monthlyRent) {
            return `Kirada kalmak ayda ${fmt(diff)} ₺ daha ekonomik.`;
        } else if (monthlyMortgage < monthlyRent) {
            return `Taksit ödemek ayda ${fmt(diff)} ₺ daha avantajlı!`;
        }
        return 'Her iki seçenek de aynı maliyette.';
    }
};

// ===============================
// 2. NET POZİSYON LİNE CHART
// ===============================
const NetPositionChart = {

    create(canvasId, projectionData, breakEvenYear = null) {
        ChartManager.destroy(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const years = [1, 3, 5, 7, 9, 11, 13, 15];
        const colors = projectionData.map(val => val >= 0 ? '#22c55e' : '#ef4444');

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years.map(y => `${y}. Yıl`),
                datasets: [{
                    data: projectionData,
                    borderColor: '#7c3aed',
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    pointRadius: 6,
                    pointBackgroundColor: colors,
                    pointBorderColor: colors,
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Ne Zaman Kâra Geçerim?',
                        color: '#e5e7eb',
                        font: { size: 14, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const val = ctx.raw;
                                const fmt = new Intl.NumberFormat('tr-TR').format(Math.abs(val));
                                return val >= 0 ? `+${fmt} ₺` : `-${fmt} ₺`;
                            }
                        }
                    },
                    annotation: breakEvenYear ? {
                        annotations: {
                            breakEvenLine: {
                                type: 'line',
                                yMin: 0,
                                yMax: 0,
                                borderColor: '#6b7280',
                                borderDash: [5, 5],
                                borderWidth: 2
                            }
                        }
                    } : {}
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#9ca3af' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: {
                            color: '#9ca3af',
                            callback: (val) => {
                                if (val === 0) return '0';
                                return `${val > 0 ? '+' : ''}${(val / 1000000).toFixed(1)}M`;
                            }
                        }
                    }
                }
            }
        });

        ChartManager.charts.set(canvasId, chart);
        return chart;
    },

    findBreakEvenYear(projectionData) {
        const years = [1, 3, 5, 7, 9, 11, 13, 15];
        for (let i = 0; i < projectionData.length; i++) {
            if (projectionData[i] >= 0 && (i === 0 || projectionData[i - 1] < 0)) {
                return years[i];
            }
        }
        return null;
    }
};

// ===============================
// 3. ALTERNATİF YATIRIM GROUPED BAR
// ===============================
const AlternativeComparisonChart = {

    create(canvasId, alternatives5Year, alternatives10Year) {
        ChartManager.destroy(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Konut', 'Mevduat', 'Altın', 'Döviz'],
                datasets: [
                    {
                        label: '5 Yıl',
                        data: alternatives5Year,
                        backgroundColor: '#7c3aed',
                        borderRadius: 4
                    },
                    {
                        label: '10 Yıl',
                        data: alternatives10Year,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Alternatif Yatırımlar Ne Kazandırırdı?',
                        color: '#e5e7eb',
                        font: { size: 14, weight: 'bold' }
                    },
                    legend: {
                        labels: { color: '#e5e7eb' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const fmt = new Intl.NumberFormat('tr-TR').format(ctx.raw);
                                return `${ctx.dataset.label}: ${fmt} ₺`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#e5e7eb' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: {
                            color: '#9ca3af',
                            callback: (val) => `${(val / 1000000).toFixed(1)}M`
                        }
                    }
                }
            }
        });

        ChartManager.charts.set(canvasId, chart);
        return chart;
    }
};

// ===============================
// 4. SKOR GAUGE (CSS-Based)
// ===============================
const ScoreGauge = {

    create(containerId, score, verdict) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const color = score >= 70 ? '#22c55e' : score >= 45 ? '#eab308' : '#ef4444';
        const emoji = score >= 70 ? '🟢' : score >= 45 ? '🟡' : '🔴';
        const label = score >= 70 ? 'Mantıklı' : score >= 45 ? 'Sınırda' : 'Riskli';

        container.innerHTML = `
            <div class="gauge-container">
                <div class="gauge-background">
                    <div class="gauge-fill" style="--score: ${score}; --color: ${color};"></div>
                </div>
                <div class="gauge-center">
                    <span class="gauge-score">${Math.round(score)}</span>
                    <span class="gauge-max">/100</span>
                </div>
            </div>
            <div class="gauge-label" style="color: ${color};">
                ${emoji} ${label}
            </div>
        `;
    },

    getStyles() {
        return `
            .gauge-container {
                position: relative;
                width: 120px;
                height: 60px;
                margin: 0 auto;
            }
            
            .gauge-background {
                width: 120px;
                height: 60px;
                border-radius: 60px 60px 0 0;
                background: linear-gradient(90deg, 
                    #ef4444 0% 40%, 
                    #eab308 40% 70%, 
                    #22c55e 70% 100%
                );
                overflow: hidden;
                position: relative;
            }
            
            .gauge-fill {
                position: absolute;
                bottom: 0;
                left: 50%;
                width: 8px;
                height: 55px;
                background: var(--color);
                transform-origin: bottom center;
                transform: translateX(-50%) rotate(calc(var(--score) * 1.8deg - 90deg));
                border-radius: 4px;
                box-shadow: 0 0 10px var(--color);
            }
            
            .gauge-center {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                text-align: center;
                background: var(--bg-secondary);
                padding: 5px 15px;
                border-radius: 20px;
            }
            
            .gauge-score {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--text-primary);
            }
            
            .gauge-max {
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            
            .gauge-label {
                text-align: center;
                font-weight: 600;
                margin-top: 10px;
            }
        `;
    }
};

// ===============================
// SKOR BREAKDOWN BAR
// ===============================
const ScoreBreakdownChart = {

    create(canvasId, breakdown) {
        ChartManager.destroy(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const labels = breakdown.map(b => b.criterion);
        const values = breakdown.map(b => b.rawScore);
        const colors = values.map(v => v >= 70 ? '#22c55e' : v >= 45 ? '#eab308' : '#ef4444');

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Skor Dağılımı',
                        color: '#e5e7eb',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                scales: {
                    x: {
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#9ca3af' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#e5e7eb', font: { size: 10 } }
                    }
                }
            }
        });

        ChartManager.charts.set(canvasId, chart);
        return chart;
    }
};

// ===============================
// GRAFİK VERİSİ HAZIRLA
// ===============================
const ChartDataPreparer = {

    prepareNetProjection(inflationData) {
        // 1, 3, 5, 7, 9, 11, 13, 15 yıl için
        const years = [1, 5, 10, 15];
        const projection = [];

        // Medium senaryodan al
        if (inflationData && inflationData.medium) {
            for (const result of inflationData.medium) {
                projection.push(result.netGainLoss);
            }
        }

        // 8 elemanlı diziye genişlet (interpolasyon)
        const fullYears = [1, 3, 5, 7, 9, 11, 13, 15];
        const fullProjection = fullYears.map((year, i) => {
            if (year === 1) return projection[0] || 0;
            if (year <= 5) return projection[1] || projection[0] * (year / 5);
            if (year <= 10) return projection[2] || projection[1] * (year / 10);
            return projection[3] || projection[2] * (year / 15);
        });

        return fullProjection;
    },

    prepareAlternatives(altData) {
        if (!altData) return { year5: [0, 0, 0, 0], year10: [0, 0, 0, 0] };

        // 5 yıl için hesapla (orantılı)
        const year5 = [
            altData.property?.totalReturn * 0.4 || 0,
            altData.deposit?.totalReturn * 0.4 || 0,
            altData.gold?.totalReturn * 0.4 || 0,
            altData.forex?.totalReturn * 0.4 || 0
        ];

        const year10 = [
            altData.property?.totalReturn || 0,
            altData.deposit?.totalReturn || 0,
            altData.gold?.totalReturn || 0,
            altData.forex?.totalReturn || 0
        ];

        return { year5, year10 };
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChartManager,
        RentVsMortgageChart,
        NetPositionChart,
        AlternativeComparisonChart,
        ScoreGauge,
        ScoreBreakdownChart,
        ChartDataPreparer
    };
}
