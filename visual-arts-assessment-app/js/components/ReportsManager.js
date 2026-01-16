// Reports Manager Component - View and export data
import db from '../database.js';
import ExcelExporter from '../utils/excel.js';

class ReportsManager {
    constructor() {
        this.classes = [];
        this.students = [];
        this.artworks = [];
        this.assessments = [];
        this.templates = [];
    }

    async render() {
        const mainContent = document.getElementById('mainContent');

        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Raporlar</h2>
                    <div>
                        <button class="btn btn-success" id="exportBasicBtn">📊 Temel Rapor (CSV)</button>
                        <button class="btn btn-primary" id="exportDetailedBtn">📋 Detaylı Rapor (CSV)</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Sınıfa Göre Filtrele</label>
                    <select class="form-select" id="filterClass">
                        <option value="">Tüm Sınıflar</option>
                    </select>
                </div>
                
                <div id="reportContent"></div>
            </div>
        `;

        await this.loadData();
        this.attachEventListeners();
        this.renderReport();
    }

    async loadData() {
        this.classes = await db.getClasses();
        this.students = await db.getStudents();
        this.artworks = await db.getArtworks();
        this.assessments = await db.getAssessments();
        this.templates = await db.getCriteriaTemplates();

        const select = document.getElementById('filterClass');
        select.innerHTML = '<option value="">Tüm Sınıflar</option>' +
            this.classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    attachEventListeners() {
        document.getElementById('exportBasicBtn').addEventListener('click', () => {
            this.exportBasic();
        });

        document.getElementById('exportDetailedBtn').addEventListener('click', () => {
            this.exportDetailed();
        });

        document.getElementById('filterClass').addEventListener('change', (e) => {
            this.renderReport(e.target.value);
        });
    }

    renderReport(filterClassId = '') {
        const container = document.getElementById('reportContent');

        let filteredStudents = this.students;
        if (filterClassId) {
            filteredStudents = this.students.filter(s => s.classId === filterClassId);
        }

        const reportData = filteredStudents.map(student => {
            const studentClass = this.classes.find(c => c.id === student.classId);
            const studentArtworks = this.artworks.filter(a => a.studentId === student.id);
            const avgScore = studentArtworks.length > 0
                ? (studentArtworks.reduce((sum, a) => sum + a.totalScore, 0) / studentArtworks.length).toFixed(1)
                : 0;

            return {
                student,
                class: studentClass,
                artworkCount: studentArtworks.length,
                avgScore
            };
        });

        container.innerHTML = `
            <h3>Özet</h3>
            <div class="grid grid-3">
                <div class="card">
                    <h4>Toplam Öğrenci</h4>
                    <div class="score-value">${filteredStudents.length}</div>
                </div>
                <div class="card">
                    <h4>Toplam Çalışma</h4>
                    <div class="score-value">${this.artworks.length}</div>
                </div>
                <div class="card">
                    <h4>Ortalama Puan</h4>
                    <div class="score-value">
                        ${reportData.length > 0
                ? (reportData.reduce((sum, d) => sum + parseFloat(d.avgScore), 0) / reportData.length).toFixed(1)
                : 0}
                    </div>
                </div>
            </div>
            
            <h3 style="margin-top: 2rem;">Öğrenci Detayları</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: var(--bg); border-bottom: 2px solid var(--border);">
                        <th style="padding: 0.75rem; text-align: left;">Sınıf</th>
                        <th style="padding: 0.75rem; text-align: left;">Öğrenci</th>
                        <th style="padding: 0.75rem; text-align: center;">Çalışma Sayısı</th>
                        <th style="padding: 0.75rem; text-align: center;">Ortalama Puan</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.map(data => `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 0.75rem;">${data.class?.name || '-'}</td>
                            <td style="padding: 0.75rem;">${data.student.name}</td>
                            <td style="padding: 0.75rem; text-align: center;">${data.artworkCount}</td>
                            <td style="padding: 0.75rem; text-align: center;">
                                <span class="weight-display">${data.avgScore}</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async exportBasic() {
        const filterClassId = document.getElementById('filterClass').value;
        await ExcelExporter.exportToExcel({
            classes: this.classes,
            students: this.students,
            artworks: this.artworks,
            assessments: this.assessments
        }, filterClassId);

        const filterText = filterClassId ?
            ` (${this.classes.find(c => c.id === filterClassId)?.name})` : '';
        this.showToast(`Rapor indirildi${filterText}`, 'success');
    }

    async exportDetailed() {
        const filterClassId = document.getElementById('filterClass').value;
        await ExcelExporter.exportDetailedReport({
            classes: this.classes,
            students: this.students,
            artworks: this.artworks,
            assessments: this.assessments,
            criteriaTemplates: this.templates
        }, filterClassId);

        const filterText = filterClassId ?
            ` (${this.classes.find(c => c.id === filterClassId)?.name})` : '';
        this.showToast(`Detaylı rapor indirildi${filterText}`, 'success');
    }

    showToast(message, type) {
        window.app.showToast(message, type);
    }
}

export default ReportsManager;
