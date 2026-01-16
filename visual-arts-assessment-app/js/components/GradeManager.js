// Grade Manager Component - Calculate exam and oral grades from artworks
import db from '../database.js';

class GradeManager {
    constructor() {
        this.classes = [];
        this.students = [];
        this.artworks = [];
        this.grades = [];
        this.selectedClassId = '';
        this.currentSemester = 1;
        this.currentYear = this.getAcademicYear();
        this.oralBonus = 7; // Default bonus for oral grade (can be changed)
    }

    getAcademicYear() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        // Academic year starts in September
        if (month >= 8) { // September onwards
            return `${year}-${year + 1}`;
        }
        return `${year - 1}-${year}`;
    }

    async render() {
        const mainContent = document.getElementById('mainContent');

        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📊 Not Hesaplama</h2>
                </div>
                
                <div class="grade-controls">
                    <div class="form-group">
                        <label class="form-label">Dönem</label>
                        <select class="form-select" id="semesterSelect">
                            <option value="1" ${this.currentSemester === 1 ? 'selected' : ''}>1. Dönem</option>
                            <option value="2" ${this.currentSemester === 2 ? 'selected' : ''}>2. Dönem</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Sınıf Seç</label>
                        <select class="form-select" id="gradeClassSelect">
                            <option value="">Sınıf seçin...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Sözlü Bonus Puanı</label>
                        <input type="number" class="form-input" id="oralBonusInput" 
                               value="${this.oralBonus}" min="0" max="15" style="width: 80px;">
                        <small class="form-hint">Sınav notuna eklenecek puan (90+ = 100)</small>
                    </div>
                </div>
                
                <div id="gradeContent"></div>
            </div>
        `;

        await this.loadData();
        this.attachEventListeners();
    }

    async loadData() {
        this.classes = await db.getClasses();
        this.students = await db.getStudents();
        this.artworks = await db.getArtworks();
        this.grades = await db.getSemesterGrades();

        const classSelect = document.getElementById('gradeClassSelect');
        classSelect.innerHTML = '<option value="">Sınıf seçin...</option>' +
            this.classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    attachEventListeners() {
        document.getElementById('gradeClassSelect').addEventListener('change', (e) => {
            this.selectedClassId = e.target.value;
            if (this.selectedClassId) {
                this.renderStudentGrades();
            } else {
                document.getElementById('gradeContent').innerHTML = '';
            }
        });

        document.getElementById('semesterSelect').addEventListener('change', (e) => {
            this.currentSemester = parseInt(e.target.value);
            if (this.selectedClassId) {
                this.renderStudentGrades();
            }
        });

        document.getElementById('oralBonusInput').addEventListener('change', (e) => {
            this.oralBonus = parseInt(e.target.value) || 7;
        });
    }

    async renderStudentGrades() {
        const container = document.getElementById('gradeContent');
        const classStudents = this.students.filter(s => s.classId === this.selectedClassId);

        if (classStudents.length === 0) {
            container.innerHTML = '<p class="text-light">Bu sınıfta öğrenci yok.</p>';
            return;
        }

        // Get artworks and grades for each student
        const studentData = await Promise.all(classStudents.map(async (student) => {
            const studentArtworks = this.artworks.filter(a => a.studentId === student.id);
            const grade = await db.getOrCreateSemesterGrade(student.id, this.currentSemester, this.currentYear);
            return { student, artworks: studentArtworks, grade };
        }));

        container.innerHTML = `
            <div class="grade-list">
                ${studentData.map(data => this.renderStudentGradeCard(data)).join('')}
            </div>
            
            <div class="grade-actions">
                <button class="btn btn-success" id="saveAllGradesBtn">💾 Tüm Notları Kaydet</button>
                <button class="btn btn-primary" id="calculateAllBtn">🧮 Tümünü Hesapla</button>
            </div>
        `;

        this.attachGradeEventListeners();
    }

    renderStudentGradeCard(data) {
        const { student, artworks, grade } = data;

        return `
            <div class="grade-card" data-student-id="${student.id}" data-grade-id="${grade.id}">
                <div class="grade-card-header">
                    <h4>${student.name}</h4>
                    <span class="student-number">${student.studentNumber || ''}</span>
                </div>
                
                <div class="grade-sections">
                    <!-- 1. Yazılı Section -->
                    <div class="grade-section">
                        <h5>1. Yazılı & Sözlü</h5>
                        ${artworks.length > 0 ? `
                            <div class="artwork-checkboxes">
                                ${artworks.map((a, i) => `
                                    <label class="checkbox-label">
                                        <input type="checkbox" 
                                               class="artwork-checkbox-1" 
                                               data-artwork-id="${a.id}"
                                               data-score="${a.totalScore}"
                                               ${grade.selectedArtworks1?.includes(a.id) ? 'checked' : ''}>
                                        <span>${a.title} (${a.totalScore.toFixed(0)})</span>
                                    </label>
                                `).join('')}
                            </div>
                            <button class="btn btn-sm btn-secondary calc-exam1-btn">Hesapla</button>
                        ` : '<p class="text-light">Çalışma yok</p>'}
                        
                        <div class="grade-inputs">
                            <div class="grade-input-group">
                                <label>Yazılı</label>
                                <input type="number" class="form-input exam1-input" 
                                       value="${grade.exam1 ?? ''}" min="0" max="100">
                            </div>
                            <div class="grade-input-group">
                                <label>Sözlü</label>
                                <input type="number" class="form-input oral1-input" 
                                       value="${grade.oral1 ?? ''}" min="0" max="100">
                            </div>
                        </div>
                    </div>
                    
                    <!-- 2. Yazılı Section -->
                    <div class="grade-section">
                        <h5>2. Yazılı & Sözlü</h5>
                        ${artworks.length > 0 ? `
                            <div class="artwork-checkboxes">
                                ${artworks.map((a, i) => `
                                    <label class="checkbox-label">
                                        <input type="checkbox" 
                                               class="artwork-checkbox-2" 
                                               data-artwork-id="${a.id}"
                                               data-score="${a.totalScore}"
                                               ${grade.selectedArtworks2?.includes(a.id) ? 'checked' : ''}>
                                        <span>${a.title} (${a.totalScore.toFixed(0)})</span>
                                    </label>
                                `).join('')}
                            </div>
                            <button class="btn btn-sm btn-secondary calc-exam2-btn">Hesapla</button>
                        ` : '<p class="text-light">Çalışma yok</p>'}
                        
                        <div class="grade-inputs">
                            <div class="grade-input-group">
                                <label>Yazılı</label>
                                <input type="number" class="form-input exam2-input" 
                                       value="${grade.exam2 ?? ''}" min="0" max="100">
                            </div>
                            <div class="grade-input-group">
                                <label>Sözlü</label>
                                <input type="number" class="form-input oral2-input" 
                                       value="${grade.oral2 ?? ''}" min="0" max="100">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="grade-summary">
                    <span class="avg-label">Dönem Ortalaması:</span>
                    <span class="avg-value">${this.calculateSemesterAverage(grade)}</span>
                </div>
            </div>
        `;
    }

    calculateSemesterAverage(grade) {
        const grades = [grade.exam1, grade.oral1, grade.exam2, grade.oral2].filter(g => g !== null);
        if (grades.length === 0) return '-';
        const avg = grades.reduce((sum, g) => sum + g, 0) / grades.length;
        return avg.toFixed(1);
    }

    calculateOralGrade(examGrade) {
        if (examGrade >= 90) return 100;
        const oral = examGrade + this.oralBonus;
        return Math.min(oral, 100);
    }

    attachGradeEventListeners() {
        // Calculate Exam 1 buttons
        document.querySelectorAll('.calc-exam1-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.grade-card');
                this.calculateExam(card, 1);
            });
        });

        // Calculate Exam 2 buttons
        document.querySelectorAll('.calc-exam2-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.grade-card');
                this.calculateExam(card, 2);
            });
        });

        // Calculate All button
        document.getElementById('calculateAllBtn')?.addEventListener('click', () => {
            document.querySelectorAll('.grade-card').forEach(card => {
                this.calculateExam(card, 1);
                this.calculateExam(card, 2);
            });
            this.showToast('Tüm notlar hesaplandı', 'success');
        });

        // Save All button
        document.getElementById('saveAllGradesBtn')?.addEventListener('click', () => {
            this.saveAllGrades();
        });
    }

    calculateExam(card, examNumber) {
        const checkboxes = card.querySelectorAll(`.artwork-checkbox-${examNumber}:checked`);
        const scores = Array.from(checkboxes).map(cb => parseFloat(cb.dataset.score));

        if (scores.length === 0) {
            return;
        }

        const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const examGrade = Math.round(average);
        const oralGrade = this.calculateOralGrade(examGrade);

        const examInput = card.querySelector(`.exam${examNumber}-input`);
        const oralInput = card.querySelector(`.oral${examNumber}-input`);

        examInput.value = examGrade;
        oralInput.value = oralGrade;

        // Update semester average display
        this.updateSemesterAverage(card);
    }

    updateSemesterAverage(card) {
        const exam1 = parseFloat(card.querySelector('.exam1-input').value) || null;
        const oral1 = parseFloat(card.querySelector('.oral1-input').value) || null;
        const exam2 = parseFloat(card.querySelector('.exam2-input').value) || null;
        const oral2 = parseFloat(card.querySelector('.oral2-input').value) || null;

        const avgDisplay = card.querySelector('.avg-value');
        const grades = [exam1, oral1, exam2, oral2].filter(g => g !== null);

        if (grades.length === 0) {
            avgDisplay.textContent = '-';
        } else {
            const avg = grades.reduce((sum, g) => sum + g, 0) / grades.length;
            avgDisplay.textContent = avg.toFixed(1);
        }
    }

    async saveAllGrades() {
        const cards = document.querySelectorAll('.grade-card');
        let savedCount = 0;

        for (const card of cards) {
            const gradeId = card.dataset.gradeId;

            // Get selected artworks
            const selectedArtworks1 = Array.from(card.querySelectorAll('.artwork-checkbox-1:checked'))
                .map(cb => cb.dataset.artworkId);
            const selectedArtworks2 = Array.from(card.querySelectorAll('.artwork-checkbox-2:checked'))
                .map(cb => cb.dataset.artworkId);

            // Get grade values
            const exam1 = parseFloat(card.querySelector('.exam1-input').value) || null;
            const oral1 = parseFloat(card.querySelector('.oral1-input').value) || null;
            const exam2 = parseFloat(card.querySelector('.exam2-input').value) || null;
            const oral2 = parseFloat(card.querySelector('.oral2-input').value) || null;

            await db.updateSemesterGrade(gradeId, {
                exam1, oral1, exam2, oral2,
                selectedArtworks1, selectedArtworks2
            });

            savedCount++;
        }

        this.showToast(`${savedCount} öğrencinin notları kaydedildi`, 'success');
    }

    showToast(message, type) {
        window.app.showToast(message, type);
    }
}

export default GradeManager;
