// MainFlow Component - Hierarchical navigation for mobile
// Flow: School → Year → Grade Level → Section → Students
import db from '../database.js';

class MainFlow {
    constructor() {
        this.schools = [];
        this.academicYears = [];
        this.classes = [];
        this.students = [];
        this.artworks = [];
        this.grades = [];

        // Current selections
        this.selectedSchool = null;
        this.selectedYear = null;
        this.selectedGradeLevel = null;
        this.selectedSection = null;

        // Current step
        this.currentStep = 'schools'; // schools, years, grades, sections, students
    }

    async render() {
        const mainContent = document.getElementById('mainContent');
        await this.loadData();

        mainContent.innerHTML = `
            <div class="flow-container">
                ${this.renderBreadcrumb()}
                <div id="flowContent"></div>
            </div>
        `;

        this.renderCurrentStep();
    }

    async loadData() {
        this.schools = await db.getSchools();
        this.academicYears = await db.getAcademicYears();
        this.classes = await db.getClasses();
        this.students = await db.getStudents();
        this.artworks = await db.getArtworks();
        this.grades = await db.getSemesterGrades();
    }

    renderBreadcrumb() {
        const crumbs = [];

        if (this.selectedSchool) {
            crumbs.push({ label: '🏫', action: 'reset' });
            crumbs.push({ label: this.selectedSchool.name, action: 'toSchools' });
        }

        if (this.selectedYear) {
            crumbs.push({ label: this.selectedYear.name, action: 'toYears' });
        }

        if (this.selectedGradeLevel) {
            crumbs.push({ label: `${this.selectedGradeLevel}. Sınıf`, action: 'toGrades' });
        }

        if (this.selectedSection) {
            crumbs.push({ label: this.selectedSection, action: 'toSections' });
        }

        if (crumbs.length === 0) {
            return '';
        }

        return `
            <div class="breadcrumb">
                ${crumbs.map((c, i) => `
                    <span class="crumb" data-action="${c.action}">${c.label}</span>
                    ${i < crumbs.length - 1 ? '<span class="crumb-sep">›</span>' : ''}
                `).join('')}
            </div>
        `;
    }

    renderCurrentStep() {
        const container = document.getElementById('flowContent');

        switch (this.currentStep) {
            case 'schools':
                this.renderSchools(container);
                break;
            case 'years':
                this.renderYears(container);
                break;
            case 'grades':
                this.renderGrades(container);
                break;
            case 'sections':
                this.renderSections(container);
                break;
            case 'students':
                this.renderStudents(container);
                break;
        }

        this.attachBreadcrumbListeners();
    }

    // ========== SCHOOLS ==========
    getBackButton(action, label = 'Geri') {
        return `<button class="btn-back" data-back-action="${action}">← ${label}</button>`;
    }

    renderSchools(container) {
        container.innerHTML = `
            <div class="flow-header">
                <h2>🏫 Okul Seçin</h2>
            </div>
            
            <div class="flow-grid">
                ${this.schools.map(school => `
                    <div class="flow-card" data-school-id="${school.id}">
                        <div class="flow-card-icon">🏫</div>
                        <div class="flow-card-title">${school.name}</div>
                    </div>
                `).join('')}
                
                <div class="flow-card flow-card-add" id="addSchoolCard">
                    <div class="flow-card-icon">+</div>
                    <div class="flow-card-title">Yeni Okul</div>
                </div>
            </div>
            
            <div id="addSchoolForm" class="add-form hidden">
                <input type="text" class="form-input" id="newSchoolName" placeholder="Okul adı...">
                <div class="form-buttons">
                    <button class="btn btn-success" id="saveSchoolBtn">Kaydet</button>
                    <button class="btn btn-secondary" id="cancelSchoolBtn">İptal</button>
                </div>
            </div>
        `;

        this.attachSchoolListeners();
    }

    attachSchoolListeners() {
        document.querySelectorAll('.flow-card[data-school-id]').forEach(card => {
            card.addEventListener('click', () => {
                const schoolId = card.dataset.schoolId;
                this.selectedSchool = this.schools.find(s => s.id === schoolId);
                this.currentStep = 'years';
                this.render();
            });
        });

        document.getElementById('addSchoolCard')?.addEventListener('click', () => {
            document.getElementById('addSchoolForm').classList.remove('hidden');
            document.getElementById('addSchoolCard').classList.add('hidden');
            document.getElementById('newSchoolName').focus();
        });

        document.getElementById('saveSchoolBtn')?.addEventListener('click', async () => {
            const name = document.getElementById('newSchoolName').value.trim();
            if (name) {
                await db.addSchool({ name });
                await this.render();
                this.showToast('Okul eklendi', 'success');
            }
        });

        document.getElementById('cancelSchoolBtn')?.addEventListener('click', () => {
            document.getElementById('addSchoolForm').classList.add('hidden');
            document.getElementById('addSchoolCard').classList.remove('hidden');
        });
    }

    // ========== YEARS ==========
    renderYears(container) {
        const schoolYears = this.academicYears.filter(y => y.schoolId === this.selectedSchool.id);

        container.innerHTML = `
            <div class="flow-header">
                ${this.getBackButton('toSchools', 'Okullar')}
                <h2>📅 Eğitim Yılı</h2>
            </div>
            
            <div class="flow-grid">
                ${schoolYears.map(year => `
                    <div class="flow-card" data-year-id="${year.id}">
                        <div class="flow-card-icon">📅</div>
                        <div class="flow-card-title">${year.name}</div>
                    </div>
                `).join('')}
                
                <div class="flow-card flow-card-add" id="addYearCard">
                    <div class="flow-card-icon">+</div>
                    <div class="flow-card-title">Yeni Yıl</div>
                </div>
            </div>
            
            <div id="addYearForm" class="add-form hidden">
                <input type="text" class="form-input" id="newYearName" placeholder="örn: 2025-2026">
                <div class="form-buttons">
                    <button class="btn btn-success" id="saveYearBtn">Kaydet</button>
                    <button class="btn btn-secondary" id="cancelYearBtn">İptal</button>
                </div>
            </div>
        `;

        this.attachYearListeners();
    }

    attachYearListeners() {
        document.querySelectorAll('.flow-card[data-year-id]').forEach(card => {
            card.addEventListener('click', () => {
                const yearId = card.dataset.yearId;
                this.selectedYear = this.academicYears.find(y => y.id === yearId);
                this.currentStep = 'grades';
                this.render();
            });
        });

        document.getElementById('addYearCard')?.addEventListener('click', () => {
            document.getElementById('addYearForm').classList.remove('hidden');
            document.getElementById('addYearCard').classList.add('hidden');
            document.getElementById('newYearName').focus();
        });

        document.getElementById('saveYearBtn')?.addEventListener('click', async () => {
            const name = document.getElementById('newYearName').value.trim();
            if (name) {
                await db.addAcademicYear({ name, schoolId: this.selectedSchool.id });
                await this.loadData();
                this.renderCurrentStep();
                this.showToast('Eğitim yılı eklendi', 'success');
            }
        });

        document.getElementById('cancelYearBtn')?.addEventListener('click', () => {
            document.getElementById('addYearForm').classList.add('hidden');
            document.getElementById('addYearCard').classList.remove('hidden');
        });
    }

    // ========== GRADES ==========
    renderGrades(container) {
        // Get existing grade levels for this school/year
        const existingClasses = this.classes.filter(c =>
            c.schoolId === this.selectedSchool.id &&
            c.yearId === this.selectedYear.id
        );
        const existingGradeLevels = [...new Set(existingClasses.map(c => c.gradeLevel))];
        const defaultGrades = ['9', '10', '11', '12'];
        const allGrades = [...new Set([...existingGradeLevels, ...defaultGrades])].sort();

        container.innerHTML = `
            <div class="flow-header">
                ${this.getBackButton('toYears', this.selectedYear.name)}
                <h2>📚 Sınıf Seviyesi</h2>
            </div>
            
            <div class="flow-grid flow-grid-small">
                ${allGrades.map(grade => {
            const count = existingClasses.filter(c => c.gradeLevel === grade).length;
            return `
                        <div class="flow-card flow-card-compact" data-grade="${grade}">
                            <div class="flow-card-number">${grade}</div>
                            <div class="flow-card-subtitle">${count > 0 ? count + ' şube' : ''}</div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;

        this.attachGradeListeners();
    }

    attachGradeListeners() {
        document.querySelectorAll('.flow-card[data-grade]').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedGradeLevel = card.dataset.grade;
                this.currentStep = 'sections';
                this.render();
            });
        });
    }

    // ========== SECTIONS ==========
    renderSections(container) {
        const sections = this.classes.filter(c =>
            c.schoolId === this.selectedSchool.id &&
            c.yearId === this.selectedYear.id &&
            c.gradeLevel === this.selectedGradeLevel
        );

        container.innerHTML = `
            <div class="flow-header">
                ${this.getBackButton('toGrades', this.selectedGradeLevel + '. Sınıflar')}
                <h2>🔤 ${this.selectedGradeLevel}. Sınıf Şubeleri</h2>
            </div>
            
            <div class="flow-grid flow-grid-small">
                ${sections.map(section => {
            const studentCount = this.students.filter(s => s.classId === section.id).length;
            return `
                        <div class="flow-card flow-card-compact" data-section-id="${section.id}">
                            <div class="flow-card-number">${section.section}</div>
                            <div class="flow-card-subtitle">${studentCount} öğrenci</div>
                        </div>
                    `;
        }).join('')}
                
                <div class="flow-card flow-card-compact flow-card-add" id="addSectionCard">
                    <div class="flow-card-number">+</div>
                    <div class="flow-card-subtitle">Şube Ekle</div>
                </div>
            </div>
            
            <div id="addSectionForm" class="add-form hidden">
                <input type="text" class="form-input" id="newSectionName" placeholder="Şube adı (A, B, C...)" maxlength="3">
                <div class="form-buttons">
                    <button class="btn btn-success" id="saveSectionBtn">Kaydet</button>
                    <button class="btn btn-secondary" id="cancelSectionBtn">İptal</button>
                </div>
            </div>
        `;

        this.attachSectionListeners();
    }

    attachSectionListeners() {
        document.querySelectorAll('.flow-card[data-section-id]').forEach(card => {
            card.addEventListener('click', () => {
                const sectionId = card.dataset.sectionId;
                const sectionClass = this.classes.find(c => c.id === sectionId);
                this.selectedSection = sectionClass.section;
                this.selectedClassId = sectionId;
                this.currentStep = 'students';
                this.render();
            });
        });

        document.getElementById('addSectionCard')?.addEventListener('click', () => {
            document.getElementById('addSectionForm').classList.remove('hidden');
            document.getElementById('addSectionCard').classList.add('hidden');
            document.getElementById('newSectionName').focus();
        });

        document.getElementById('saveSectionBtn')?.addEventListener('click', async () => {
            const section = document.getElementById('newSectionName').value.trim().toUpperCase();
            if (section) {
                await db.addClass({
                    name: `${this.selectedGradeLevel}-${section}`,
                    schoolId: this.selectedSchool.id,
                    yearId: this.selectedYear.id,
                    gradeLevel: this.selectedGradeLevel,
                    section: section,
                    year: this.selectedYear.name
                });
                await this.loadData();
                this.renderCurrentStep();
                this.showToast('Şube eklendi', 'success');
            }
        });

        document.getElementById('cancelSectionBtn')?.addEventListener('click', () => {
            document.getElementById('addSectionForm').classList.add('hidden');
            document.getElementById('addSectionCard').classList.remove('hidden');
        });
    }

    // ========== STUDENTS ==========
    renderStudents(container) {
        const classStudents = this.students.filter(s => s.classId === this.selectedClassId);

        // Sort by student number
        classStudents.sort((a, b) => {
            if (!a.studentNumber) return 1;
            if (!b.studentNumber) return -1;
            return a.studentNumber.localeCompare(b.studentNumber);
        });

        container.innerHTML = `
            <div class="flow-header">
                ${this.getBackButton('toSections', 'Şubeler')}
                <h2>👥 ${this.selectedGradeLevel}-${this.selectedSection} Öğrencileri</h2>
                <span class="student-count">${classStudents.length} öğrenci</span>
            </div>
            
            <div class="student-list">
                ${classStudents.map((student, i) => {
            const studentArtworks = this.artworks.filter(a => a.studentId === student.id);
            const avgScore = studentArtworks.length > 0
                ? (studentArtworks.reduce((sum, a) => sum + a.totalScore, 0) / studentArtworks.length).toFixed(0)
                : '-';

            return `
                        <div class="student-card" data-student-id="${student.id}">
                            <div class="student-number">${i + 1}</div>
                            <div class="student-info">
                                <div class="student-name">${student.name}</div>
                                <div class="student-meta">
                                    ${student.studentNumber || 'No yok'} • ${studentArtworks.length} çalışma
                                </div>
                            </div>
                            <div class="student-score ${this.getScoreClass(parseFloat(avgScore))}">${avgScore}</div>
                        </div>
                    `;
        }).join('')}
                
                ${classStudents.length === 0 ? `
                    <p class="empty-message">Henüz öğrenci eklenmemiş</p>
                ` : ''}
            </div>
            
            <div class="flow-actions">
                <button class="btn btn-success" id="addStudentBtn">+ Öğrenci Ekle</button>
                <button class="btn btn-primary" id="importStudentsBtn">📥 Excel'den İçe Aktar</button>
            </div>
            
            <div id="addStudentForm" class="add-form hidden">
                <input type="text" class="form-input" id="newStudentName" placeholder="Öğrenci adı">
                <input type="text" class="form-input" id="newStudentNumber" placeholder="Öğrenci no">
                <div class="form-buttons">
                    <button class="btn btn-success" id="saveStudentBtn">Kaydet</button>
                    <button class="btn btn-secondary" id="cancelStudentBtn">İptal</button>
                </div>
            </div>
        `;

        this.attachStudentListeners();
    }

    getScoreClass(score) {
        if (isNaN(score)) return '';
        if (score >= 80) return 'score-high';
        if (score >= 50) return 'score-medium';
        return 'score-low';
    }

    attachStudentListeners() {
        document.querySelectorAll('.student-card').forEach(card => {
            card.addEventListener('click', () => {
                const studentId = card.dataset.studentId;
                this.showStudentDetail(studentId);
            });
        });

        document.getElementById('addStudentBtn')?.addEventListener('click', () => {
            document.getElementById('addStudentForm').classList.toggle('hidden');
            document.getElementById('newStudentName').focus();
        });

        document.getElementById('saveStudentBtn')?.addEventListener('click', async () => {
            const name = document.getElementById('newStudentName').value.trim();
            const studentNumber = document.getElementById('newStudentNumber').value.trim();
            if (name) {
                await db.addStudent({
                    name,
                    studentNumber,
                    classId: this.selectedClassId
                });
                await this.loadData();
                this.renderCurrentStep();
                this.showToast('Öğrenci eklendi', 'success');
            }
        });

        document.getElementById('cancelStudentBtn')?.addEventListener('click', () => {
            document.getElementById('addStudentForm').classList.add('hidden');
        });

        document.getElementById('importStudentsBtn')?.addEventListener('click', () => {
            // Navigate to student import page with class context
            localStorage.setItem('app_state_import_classId', JSON.stringify(this.selectedClassId));
            window.location.hash = 'students';
        });
    }

    // ========== STUDENT DETAIL ==========
    async showStudentDetail(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const studentArtworks = this.artworks.filter(a => a.studentId === studentId);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>${student.name}</h3>
                    <button class="modal-close">✕</button>
                </div>
                <div class="student-detail-content">
                    <div class="student-actions-grid">
                        <button class="action-btn" data-action="assessment">
                            <span class="action-icon">📝</span>
                            <span class="action-label">Değerlendirme</span>
                        </button>
                        <button class="action-btn" data-action="grades">
                            <span class="action-icon">📊</span>
                            <span class="action-label">Not Hesapla</span>
                        </button>
                        <button class="action-btn" data-action="photos">
                            <span class="action-icon">📷</span>
                            <span class="action-label">Fotoğraflar</span>
                        </button>
                        <button class="action-btn" data-action="history">
                            <span class="action-icon">📋</span>
                            <span class="action-label">Geçmiş</span>
                        </button>
                    </div>
                    
                    <h4>Çalışmalar (${studentArtworks.length})</h4>
                    <div class="artwork-mini-list">
                        ${studentArtworks.map(a => `
                            <div class="artwork-mini-card" data-artwork-id="${a.id}">
                                <div class="artwork-mini-title">${a.title}</div>
                                <div class="artwork-mini-score">${a.totalScore.toFixed(0)}</div>
                            </div>
                        `).join('')}
                        ${studentArtworks.length === 0 ? '<p class="text-light">Henüz çalışma yok</p>' : ''}
                    </div>
                    
                    <button class="btn btn-success btn-full" id="newArtworkBtn">+ Yeni Çalışma</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close handlers
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Action handlers
        modal.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                modal.remove();
                this.handleStudentAction(studentId, action);
            });
        });

        // New artwork
        modal.querySelector('#newArtworkBtn')?.addEventListener('click', () => {
            modal.remove();
            localStorage.setItem('app_state_assessment_classId', JSON.stringify(this.selectedClassId));
            localStorage.setItem('app_state_assessment_studentId', JSON.stringify(studentId));
            window.location.hash = 'assessment';
        });

        // Artwork click
        modal.querySelectorAll('.artwork-mini-card').forEach(card => {
            card.addEventListener('click', () => {
                modal.remove();
                localStorage.setItem('app_state_assessment_classId', JSON.stringify(this.selectedClassId));
                localStorage.setItem('app_state_assessment_studentId', JSON.stringify(studentId));
                localStorage.setItem('app_state_assessment_artworkId', JSON.stringify(card.dataset.artworkId));
                window.location.hash = 'assessment';
            });
        });
    }

    handleStudentAction(studentId, action) {
        const student = this.students.find(s => s.id === studentId);

        switch (action) {
            case 'assessment':
                localStorage.setItem('app_state_assessment_classId', JSON.stringify(this.selectedClassId));
                localStorage.setItem('app_state_assessment_studentId', JSON.stringify(studentId));
                window.location.hash = 'assessment';
                break;
            case 'grades':
                window.location.hash = 'grades';
                break;
            case 'photos':
            case 'history':
                localStorage.setItem('app_state_assessment_classId', JSON.stringify(this.selectedClassId));
                localStorage.setItem('app_state_assessment_studentId', JSON.stringify(studentId));
                window.location.hash = 'assessment';
                break;
        }
    }

    // ========== BREADCRUMB ==========
    attachBreadcrumbListeners() {
        // Breadcrumb navigation
        document.querySelectorAll('.crumb').forEach(crumb => {
            crumb.addEventListener('click', () => {
                this.handleBackAction(crumb.dataset.action);
            });
        });

        // Back button navigation
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleBackAction(btn.dataset.backAction);
            });
        });
    }

    handleBackAction(action) {
        switch (action) {
            case 'reset':
            case 'toSchools':
                this.resetToSchools();
                break;
            case 'toYears':
                this.resetToYears();
                break;
            case 'toGrades':
                this.resetToGrades();
                break;
            case 'toSections':
                this.resetToSections();
                break;
        }
    }

    resetToSchools() {
        this.selectedSchool = null;
        this.selectedYear = null;
        this.selectedGradeLevel = null;
        this.selectedSection = null;
        this.currentStep = 'schools';
        this.render();
    }

    resetToYears() {
        this.selectedYear = null;
        this.selectedGradeLevel = null;
        this.selectedSection = null;
        this.currentStep = 'years';
        this.render();
    }

    resetToGrades() {
        this.selectedGradeLevel = null;
        this.selectedSection = null;
        this.currentStep = 'grades';
        this.render();
    }

    resetToSections() {
        this.selectedSection = null;
        this.currentStep = 'sections';
        this.render();
    }

    showToast(message, type) {
        window.app.showToast(message, type);
    }
}

export default MainFlow;
