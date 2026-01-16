// Reports Manager Component - View and export data with student detail view
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
            
            <!-- Student Detail Modal -->
            <div id="studentDetailModal" class="modal-overlay hidden">
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3 id="studentModalTitle">Öğrenci Detayları</h3>
                        <button class="modal-close" id="closeStudentModal">✕</button>
                    </div>
                    <div id="studentDetailContent"></div>
                </div>
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

        // Close modal
        document.getElementById('closeStudentModal').addEventListener('click', () => {
            document.getElementById('studentDetailModal').classList.add('hidden');
        });

        document.getElementById('studentDetailModal').addEventListener('click', (e) => {
            if (e.target.id === 'studentDetailModal') {
                document.getElementById('studentDetailModal').classList.add('hidden');
            }
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
            <p class="text-light" style="margin-bottom: 1rem;">📌 Öğrenci ismine tıklayarak detayları görebilirsiniz</p>
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
                        <tr style="border-bottom: 1px solid var(--border);" class="student-row" data-student-id="${data.student.id}">
                            <td style="padding: 0.75rem;">${data.class?.name || '-'}</td>
                            <td style="padding: 0.75rem;">
                                <a href="#" class="student-link" data-student-id="${data.student.id}">
                                    ${data.student.name}
                                </a>
                            </td>
                            <td style="padding: 0.75rem; text-align: center;">${data.artworkCount}</td>
                            <td style="padding: 0.75rem; text-align: center;">
                                <span class="weight-display">${data.avgScore}</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Attach click listeners to student names
        document.querySelectorAll('.student-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const studentId = link.getAttribute('data-student-id');
                this.showStudentDetail(studentId);
            });
        });
    }

    async showStudentDetail(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const studentClass = this.classes.find(c => c.id === student.classId);
        const studentArtworks = this.artworks.filter(a => a.studentId === studentId);

        // Get photos for all artworks
        const artworksWithDetails = await Promise.all(studentArtworks.map(async (artwork) => {
            const photos = await db.getProgressPhotos(artwork.id);
            const artworkAssessments = this.assessments.filter(a => a.artworkId === artwork.id);
            const template = this.templates.find(t => t.id === artwork.templateId);

            return {
                ...artwork,
                photos,
                assessments: artworkAssessments,
                template
            };
        }));

        const modal = document.getElementById('studentDetailModal');
        const title = document.getElementById('studentModalTitle');
        const content = document.getElementById('studentDetailContent');

        title.textContent = `${student.name} - ${studentClass?.name || ''}`;

        content.innerHTML = `
            <div class="student-info">
                <p><strong>Öğrenci No:</strong> ${student.studentNumber || '-'}</p>
                <p><strong>Toplam Çalışma:</strong> ${studentArtworks.length}</p>
            </div>

            ${artworksWithDetails.length === 0 ? `
                <p class="text-light" style="text-align: center; padding: 2rem;">
                    Henüz değerlendirme yapılmamış.
                </p>
            ` : `
                <div class="artwork-list">
                    ${artworksWithDetails.map(artwork => `
                        <div class="artwork-card">
                            <div class="artwork-header">
                                <h4>${artwork.title}</h4>
                                <span class="artwork-date">${new Date(artwork.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                            
                            <div class="artwork-score">
                                <div class="score-badge ${this.getScoreClass(artwork.totalScore)}">
                                    ${artwork.totalScore.toFixed(1)}
                                </div>
                                <span>/ 100 puan</span>
                            </div>

                            ${artwork.photos.length > 0 ? `
                                <div class="artwork-photos">
                                    <h5>Fotoğraflar</h5>
                                    <div class="photo-gallery-mini">
                                        ${artwork.photos.map(photo => `
                                            <div class="photo-thumb" data-photo-url="${photo.photoUrl}" data-photo-date="${new Date(photo.capturedAt).toLocaleDateString('tr-TR')}">
                                                <img src="${photo.photoUrl}" alt="Photo">
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            ${artwork.template && artwork.assessments.length > 0 ? `
                                <div class="artwork-criteria">
                                    <h5>Ölçüt Puanları</h5>
                                    <ul class="criteria-list">
                                        ${artwork.template.criteria.map(criterion => {
            const assessment = artwork.assessments.find(a => a.criteriaId === criterion.id);
            return `
                                                <li>
                                                    <span class="criteria-name">${criterion.name}</span>
                                                    <span class="criteria-score">${assessment?.rawScore || 0}/10 (${assessment?.score?.toFixed(1) || 0})</span>
                                                </li>
                                            `;
        }).join('')}
                                    </ul>
                                </div>
                            ` : ''}

                            <div class="artwork-actions">
                                <button class="btn btn-sm btn-primary edit-artwork-btn" data-artwork-id="${artwork.id}">
                                    ✏️ Düzenle
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        `;

        modal.classList.remove('hidden');

        // Attach photo click listeners for lightbox
        document.querySelectorAll('.photo-thumb').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const photoUrl = thumb.getAttribute('data-photo-url');
                const photoDate = thumb.getAttribute('data-photo-date');
                this.showPhotoLightbox(photoUrl, photoDate);
            });
        });

        // Attach edit button listeners
        document.querySelectorAll('.edit-artwork-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const artworkId = btn.getAttribute('data-artwork-id');
                this.editArtwork(artworkId);
            });
        });
    }

    getScoreClass(score) {
        if (score >= 80) return 'score-high';
        if (score >= 50) return 'score-medium';
        return 'score-low';
    }

    showPhotoLightbox(photoUrl, photoDate) {
        const overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close">✕</button>
                <img src="${photoUrl}" alt="Photo" class="lightbox-image">
                <div class="lightbox-date">${photoDate}</div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
                overlay.remove();
            }
        });

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    editArtwork(artworkId) {
        // Close modal and navigate to assessment page with artwork selected
        document.getElementById('studentDetailModal').classList.add('hidden');

        // Find the artwork and student
        const artwork = this.artworks.find(a => a.id === artworkId);
        if (!artwork) return;

        const student = this.students.find(s => s.id === artwork.studentId);
        if (!student) return;

        // Save state for assessment page
        localStorage.setItem('app_state_assessment_classId', JSON.stringify(student.classId));
        localStorage.setItem('app_state_assessment_studentId', JSON.stringify(student.id));
        localStorage.setItem('app_state_assessment_artworkId', JSON.stringify(artworkId));

        // Navigate to assessment page
        window.location.hash = 'assessment';
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
