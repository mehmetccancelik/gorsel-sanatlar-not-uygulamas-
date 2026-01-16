// Semester Report Manager - Generate school-based Excel reports
import db from '../database.js';

class SemesterReportManager {
    constructor() {
        this.classes = [];
        this.students = [];
        this.grades = [];
        this.schools = [];
        this.selectedClasses = [];
        this.schoolName = '';
        this.currentSemester = 1;
        this.currentYear = this.getAcademicYear();
    }

    getAcademicYear() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        if (month >= 8) {
            return `${year}-${year + 1}`;
        }
        return `${year - 1}-${year}`;
    }

    async render() {
        const mainContent = document.getElementById('mainContent');

        mainContent.innerHTML = `
            <div class="card report-card">
                <div class="card-header">
                    <h2 class="card-title">📋 Dönem Sonu Raporu</h2>
                </div>
                
                <div class="report-controls">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">🏫 Okul Seç</label>
                            <select class="form-select" id="schoolSelect">
                                <option value="">-- Okul Seçin --</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">✏️ veya Manuel Gir</label>
                            <input type="text" class="form-input" id="schoolNameInput" 
                                   placeholder="Okul adı yazın..." value="${this.schoolName}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">📅 Dönem</label>
                        <select class="form-select" id="reportSemesterSelect">
                            <option value="1" ${this.currentSemester === 1 ? 'selected' : ''}>1. Dönem</option>
                            <option value="2" ${this.currentSemester === 2 ? 'selected' : ''}>2. Dönem</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <div class="label-with-actions">
                            <label class="form-label">📚 Sınıflar</label>
                            <div class="select-actions">
                                <button class="btn btn-sm btn-secondary" id="selectAllBtn">Tümünü Seç</button>
                                <button class="btn btn-sm btn-secondary" id="deselectAllBtn">Hiçbirini Seçme</button>
                            </div>
                        </div>
                        <div class="class-checkboxes" id="classCheckboxes"></div>
                    </div>
                </div>
                
                <div class="report-actions">
                    <button class="btn btn-primary btn-lg" id="previewReportBtn">👁️ Önizleme</button>
                    <button class="btn btn-success btn-lg" id="exportExcelBtn">📊 Ayrı Excel</button>
                    <button class="btn btn-warning btn-lg" id="exportCombinedBtn">📑 Birleşik Rapor</button>
                </div>
                
                <div id="reportPreview" class="report-preview hidden"></div>
            </div>
        `;

        await this.loadData();
        this.attachEventListeners();
    }

    async loadData() {
        this.classes = await db.getClasses();
        this.students = await db.getStudents();
        this.grades = await db.getSemesterGrades();
        this.schools = await db.getSchools();

        // Populate school dropdown
        const schoolSelect = document.getElementById('schoolSelect');
        this.schools.forEach(school => {
            const option = document.createElement('option');
            option.value = school.name;
            option.textContent = school.name;
            schoolSelect.appendChild(option);
        });

        // Populate class checkboxes
        const checkboxContainer = document.getElementById('classCheckboxes');
        checkboxContainer.innerHTML = this.classes.map(c => `
            <label class="checkbox-label">
                <input type="checkbox" class="class-checkbox" value="${c.id}">
                <span>${c.name}</span>
            </label>
        `).join('');
    }

    attachEventListeners() {
        document.getElementById('schoolSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.schoolName = e.target.value;
                document.getElementById('schoolNameInput').value = e.target.value;
            }
        });

        document.getElementById('schoolNameInput').addEventListener('input', (e) => {
            this.schoolName = e.target.value;
            // Reset dropdown when manual input is used
            document.getElementById('schoolSelect').value = '';
        });

        document.getElementById('reportSemesterSelect').addEventListener('change', (e) => {
            this.currentSemester = parseInt(e.target.value);
        });

        document.getElementById('previewReportBtn').addEventListener('click', () => {
            this.previewReport();
        });

        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            this.exportToExcel(false);
        });

        document.getElementById('exportCombinedBtn').addEventListener('click', () => {
            this.exportToExcel(true);
        });

        // Select All / Deselect All buttons
        document.getElementById('selectAllBtn').addEventListener('click', () => {
            document.querySelectorAll('.class-checkbox').forEach(cb => cb.checked = true);
        });

        document.getElementById('deselectAllBtn').addEventListener('click', () => {
            document.querySelectorAll('.class-checkbox').forEach(cb => cb.checked = false);
        });
    }

    getSelectedClasses() {
        const checkboxes = document.querySelectorAll('.class-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    getReportData() {
        const selectedClassIds = this.getSelectedClasses();

        if (selectedClassIds.length === 0) {
            this.showToast('Lütfen en az bir sınıf seçin', 'warning');
            return null;
        }

        const reportData = [];

        for (const classId of selectedClassIds) {
            const classInfo = this.classes.find(c => c.id === classId);
            const classStudents = this.students.filter(s => s.classId === classId);

            const studentGrades = classStudents.map(student => {
                const grade = this.grades.find(g =>
                    g.studentId === student.id &&
                    g.semester === this.currentSemester &&
                    g.year === this.currentYear
                );

                const exam1 = grade?.exam1 ?? '-';
                const oral1 = grade?.oral1 ?? '-';
                const exam2 = grade?.exam2 ?? '-';
                const oral2 = grade?.oral2 ?? '-';

                // Calculate average
                const validGrades = [grade?.exam1, grade?.oral1, grade?.exam2, grade?.oral2]
                    .filter(g => g !== null && g !== undefined);
                const average = validGrades.length > 0
                    ? (validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length).toFixed(1)
                    : '-';

                return {
                    studentNumber: student.studentNumber || '-',
                    name: student.name,
                    exam1,
                    oral1,
                    exam2,
                    oral2,
                    average
                };
            });

            // Sort by student number
            studentGrades.sort((a, b) => {
                if (a.studentNumber === '-') return 1;
                if (b.studentNumber === '-') return -1;
                return a.studentNumber.localeCompare(b.studentNumber);
            });

            reportData.push({
                className: classInfo?.name || 'Bilinmeyen Sınıf',
                students: studentGrades
            });
        }

        // Sort by class name
        reportData.sort((a, b) => a.className.localeCompare(b.className));

        return reportData;
    }

    previewReport() {
        const reportData = this.getReportData();
        if (!reportData) return;

        const container = document.getElementById('reportPreview');
        container.classList.remove('hidden');

        container.innerHTML = `
            <div class="report-header">
                <h3>${this.schoolName || 'Okul Adı Girilmemiş'}</h3>
                <p>${this.currentSemester}. Dönem - ${this.currentYear}</p>
            </div>
            
            ${reportData.map(classData => `
                <div class="report-class">
                    <h4>${classData.className}</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Öğrenci Adı</th>
                                <th>1. Yazılı</th>
                                <th>1. Sözlü</th>
                                <th>2. Yazılı</th>
                                <th>2. Sözlü</th>
                                <th>Ortalama</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${classData.students.map((s, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${s.name}</td>
                                    <td>${s.exam1}</td>
                                    <td>${s.oral1}</td>
                                    <td>${s.exam2}</td>
                                    <td>${s.oral2}</td>
                                    <td class="avg-cell">${s.average}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}
        `;
    }

    exportToExcel(combined) {
        const reportData = this.getReportData();
        if (!reportData) return;

        const schoolName = this.schoolName || 'Okul';
        const semester = this.currentSemester;
        const year = this.currentYear;

        if (combined) {
            this.downloadCombinedExcel(reportData, schoolName, semester, year);
        } else {
            this.downloadSeparateExcel(reportData, schoolName, semester, year);
        }

        this.showToast('Rapor indirildi', 'success');
    }

    downloadCombinedExcel(reportData, schoolName, semester, year) {
        let csv = '';

        // BOM for UTF-8
        csv += '\ufeff';

        for (const classData of reportData) {
            // Header info directly above table (using same columns)
            csv += `${schoolName.toUpperCase()};;;;;;;\n`;
            csv += `${semester}. Dönem - ${year};;;;;;;\n`;
            csv += `${classData.className};;;;;;;\n`;
            csv += 'No;Öğrenci Adı;1. Yazılı;1. Sözlü;2. Yazılı;2. Sözlü;Ortalama\n';

            classData.students.forEach((s, i) => {
                csv += `${i + 1};${s.name};${s.exam1};${s.oral1};${s.exam2};${s.oral2};${s.average}\n`;
            });

            csv += ';;;;;;;\n'; // Empty row between classes
        }

        const filename = `${schoolName}_${semester}Donem_${year}.csv`;
        this.downloadCSV(csv, filename);
    }

    downloadSeparateExcel(reportData, schoolName, semester, year) {
        // Download each class as separate file
        for (const classData of reportData) {
            let csv = '\ufeff';

            // Header info directly above table (using same columns)
            csv += `${schoolName.toUpperCase()};;;;;;;\n`;
            csv += `${semester}. Dönem - ${year};;;;;;;\n`;
            csv += `${classData.className};;;;;;;\n`;
            csv += 'No;Öğrenci Adı;1. Yazılı;1. Sözlü;2. Yazılı;2. Sözlü;Ortalama\n';

            classData.students.forEach((s, i) => {
                csv += `${i + 1};${s.name};${s.exam1};${s.oral1};${s.exam2};${s.oral2};${s.average}\n`;
            });

            const safeName = classData.className.replace(/[^a-zA-Z0-9-_]/g, '_');
            const filename = `${schoolName}_${safeName}_${semester}Donem.csv`;
            this.downloadCSV(csv, filename);
        }
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showToast(message, type) {
        window.app.showToast(message, type);
    }
}

export default SemesterReportManager;
