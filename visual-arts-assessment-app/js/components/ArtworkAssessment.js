// Artwork Assessment Component - Photo tracking + Weighted scoring
import db from '../database.js';
import Camera from '../utils/camera.js';
import Storage from '../utils/storage.js';
import ScoreCalculator from '../utils/calculator.js';
import GoogleSheetsManager from '../utils/googleSheets.js';
import App from '../app.js';

class ArtworkAssessment {
    constructor() {
        this.students = [];
        this.classes = [];
        this.templates = [];
        this.artworks = [];
        this.currentArtwork = null;
        this.camera = new Camera();
        this.googleSheets = new GoogleSheetsManager();
    }

    async render() {
        const mainContent = document.getElementById('mainContent');

        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Çalışma Değerlendirme</h2>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Sınıf Seç</label>
                    <select class="form-select" id="selectClass">
                        <option value="">Önce sınıf seçin...</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Öğrenci Seç</label>
                    <select class="form-select" id="selectStudent" disabled>
                        <option value="">Önce sınıf seçin...</option>
                    </select>
                </div>
                
                <div id="studentArtworks" class="hidden"></div>
                <div id="assessmentArea" class="hidden"></div>
            </div>
        `;

        await this.loadData();
        this.attachEventListeners();
    }

    async loadData() {
        this.students = await db.getStudents();
        this.classes = await db.getClasses();
        this.templates = await db.getCriteriaTemplates();
        this.artworks = await db.getArtworks();

        const classSelect = document.getElementById('selectClass');
        classSelect.innerHTML = '<option value="">Önce sınıf seçin...</option>' +
            this.classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        // Restore previous selections from localStorage
        const savedClassId = App.loadState('assessment_classId');
        const savedStudentId = App.loadState('assessment_studentId');
        const savedArtworkId = App.loadState('assessment_artworkId');

        // Clear the artworkId state after reading (one-time navigation)
        if (savedArtworkId) {
            localStorage.removeItem('app_state_assessment_artworkId');
        }

        if (savedClassId && this.classes.find(c => c.id === savedClassId)) {
            classSelect.value = savedClassId;
            classSelect.dispatchEvent(new Event('change'));

            // Restore student selection after a short delay
            if (savedStudentId) {
                setTimeout(async () => {
                    const studentSelect = document.getElementById('selectStudent');
                    if (studentSelect && this.students.find(s => s.id === savedStudentId)) {
                        studentSelect.value = savedStudentId;
                        studentSelect.dispatchEvent(new Event('change'));

                        // If there's a saved artworkId, open it directly
                        if (savedArtworkId && this.artworks.find(a => a.id === savedArtworkId)) {
                            setTimeout(() => {
                                this.showAssessmentArea(savedArtworkId);
                            }, 200);
                        }
                    }
                }, 100);
            }
        }
    }

    attachEventListeners() {
        document.getElementById('selectClass').addEventListener('change', (e) => {
            const classId = e.target.value;
            const studentSelect = document.getElementById('selectStudent');

            // Save class selection
            App.saveState('assessment_classId', classId);

            if (classId) {
                // Filter students by selected class
                const filteredStudents = this.students.filter(s => s.classId === classId);
                studentSelect.disabled = false;
                studentSelect.innerHTML = '<option value="">Öğrenci seçin...</option>' +
                    filteredStudents.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            } else {
                studentSelect.disabled = true;
                studentSelect.innerHTML = '<option value="">Önce sınıf seçin...</option>';
                App.saveState('assessment_studentId', null);
            }

            // Hide artworks and assessment areas
            document.getElementById('studentArtworks').classList.add('hidden');
            document.getElementById('assessmentArea').classList.add('hidden');
        });

        document.getElementById('selectStudent').addEventListener('change', (e) => {
            const studentId = e.target.value;

            // Save student selection
            App.saveState('assessment_studentId', studentId);

            if (studentId) {
                this.showStudentArtworks(studentId);
            } else {
                document.getElementById('studentArtworks').classList.add('hidden');
                document.getElementById('assessmentArea').classList.add('hidden');
            }
        });
    }

    async showStudentArtworks(studentId) {
        const container = document.getElementById('studentArtworks');
        const artworks = await db.getArtworksByStudent(studentId);

        container.classList.remove('hidden');
        container.innerHTML = `
            <h3>Çalışmalar</h3>
            <button class="btn btn-primary" id="newArtworkBtn">+ Yeni Çalışma</button>
            <div class="grid grid-2" style="margin-top: 1rem;">
                ${artworks.map(artwork => {
            // Handle Firestore timestamp
            let dateStr = '-';
            if (artwork.createdAt) {
                const date = artwork.createdAt.toDate ? artwork.createdAt.toDate() : new Date(artwork.createdAt);
                dateStr = date.toLocaleDateString('tr-TR');
            }
            const score = artwork.totalScore !== undefined ? artwork.totalScore : 0;
            return `
                    <div class="card">
                        <h4>${artwork.title}</h4>
                        <p class="text-light">${dateStr}</p>
                        <div class="score-display">
                            <div class="score-value">${score}</div>
                            <div class="score-label">/ 100</div>
                        </div>
                        <button class="btn btn-sm btn-primary" data-assess="${artwork.id}">Değerlendir</button>
                    </div>
                    `;
        }).join('')}
            </div>
        `;

        document.getElementById('newArtworkBtn').addEventListener('click', () => {
            this.createNewArtwork(studentId);
        });

        document.querySelectorAll('[data-assess]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const artworkId = e.target.getAttribute('data-assess');
                this.showAssessmentArea(artworkId);
            });
        });
    }

    async createNewArtwork(studentId) {
        if (this.templates.length === 0) {
            this.showToast('Önce bir ölçüt şablonu oluşturun', 'warning');
            return;
        }

        // Get student's class to filter templates by grade level
        const student = this.students.find(s => s.id === studentId);
        const studentClass = this.classes.find(c => c.id === student?.classId);

        // Extract grade level from class name (e.g., "9-A" -> "9")
        const gradeLevel = studentClass?.name?.match(/^\d+/)?.[0];

        // Filter templates by grade level
        const availableTemplates = this.templates.filter(t =>
            t.gradeLevel === 'all' || t.gradeLevel === gradeLevel
        );

        if (availableTemplates.length === 0) {
            this.showToast(`${gradeLevel}. sınıf için ölçüt şablonu bulunamadı. "Tüm Sınıflar" için şablon oluşturun.`, 'warning');
            return;
        }

        // Show template selection modal
        const mainContent = document.getElementById('mainContent');
        const originalContent = mainContent.innerHTML;

        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Yeni Çalışma Oluştur</h2>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Çalışma Başlığı</label>
                    <input type="text" class="form-input" id="newArtworkTitle" placeholder="örn: Natürmort Çalışması">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Değerlendirme Ölçütü Seç</label>
                    <select class="form-select" id="newArtworkTemplate">
                        <option value="">Ölçüt şablonu seçin...</option>
                        ${availableTemplates.map(t => `
                            <option value="${t.id}">
                                ${t.name} (${t.gradeLevel === 'all' ? 'Tüm Sınıflar' : t.gradeLevel + '. Sınıf'})
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div id="templatePreview" class="hidden" style="margin-top: 1rem; padding: 1rem; background: var(--bg); border-radius: 0.5rem;">
                    <h4>Ölçütler:</h4>
                    <ul id="criteriaPreviewList"></ul>
                </div>
                
                <div style="margin-top: 1.5rem;">
                    <button class="btn btn-success" id="confirmCreateBtn">Oluştur</button>
                    <button class="btn btn-secondary" id="cancelCreateBtn">İptal</button>
                </div>
            </div>
        `;

        // Template preview
        document.getElementById('newArtworkTemplate').addEventListener('change', (e) => {
            const templateId = e.target.value;
            const preview = document.getElementById('templatePreview');
            const list = document.getElementById('criteriaPreviewList');

            if (templateId) {
                const template = availableTemplates.find(t => t.id === templateId);
                if (template) {
                    list.innerHTML = template.criteria.map(c =>
                        `<li>${c.name} - <span class="weight-display">${c.weight}%</span></li>`
                    ).join('');
                    preview.classList.remove('hidden');
                }
            } else {
                preview.classList.add('hidden');
            }
        });

        // Confirm button
        document.getElementById('confirmCreateBtn').addEventListener('click', async () => {
            const title = document.getElementById('newArtworkTitle').value.trim();
            const templateId = document.getElementById('newArtworkTemplate').value;

            if (!title) {
                this.showToast('Lütfen çalışma başlığı girin', 'warning');
                return;
            }

            if (!templateId) {
                this.showToast('Lütfen bir ölçüt şablonu seçin', 'warning');
                return;
            }

            await db.addArtwork({
                studentId,
                title,
                templateId,
                startDate: new Date().toISOString()
            });

            this.showToast('Çalışma oluşturuldu', 'success');
            await this.render();

            // Re-select the class and student
            document.getElementById('selectClass').value = student.classId;
            document.getElementById('selectClass').dispatchEvent(new Event('change'));
            setTimeout(() => {
                document.getElementById('selectStudent').value = studentId;
                document.getElementById('selectStudent').dispatchEvent(new Event('change'));
            }, 100);
        });

        // Cancel button
        document.getElementById('cancelCreateBtn').addEventListener('click', async () => {
            await this.render();

            // Re-select the class and student
            document.getElementById('selectClass').value = student.classId;
            document.getElementById('selectClass').dispatchEvent(new Event('change'));
            setTimeout(() => {
                document.getElementById('selectStudent').value = studentId;
                document.getElementById('selectStudent').dispatchEvent(new Event('change'));
            }, 100);
        });
    }

    async showAssessmentArea(artworkId) {
        this.currentArtwork = await db.get('artworks', artworkId);
        const template = this.templates.find(t => t.id === this.currentArtwork.templateId);
        const photos = await db.getProgressPhotos(artworkId);
        const assessments = await db.getAssessmentsByArtwork(artworkId);

        const container = document.getElementById('assessmentArea');
        container.classList.remove('hidden');

        container.innerHTML = `
            <div class="card">
                <h3>${this.currentArtwork.title}</h3>
                
                <h4>Fotoğraf Çek / Yükle</h4>
                <div class="camera-container">
                    <video id="cameraVideo" class="camera-video hidden" autoplay playsinline></video>
                    <canvas id="photoCanvas" class="hidden"></canvas>
                </div>
                <div class="camera-controls">
                    <button class="btn btn-primary" id="startCameraBtn">📷 Kamera Aç</button>
                    <button class="btn btn-success hidden" id="captureBtn">Fotoğraf Çek</button>
                    <button class="btn btn-secondary hidden" id="stopCameraBtn">Kapat</button>
                    <input type="file" id="uploadPhoto" accept="image/*" class="hidden">
                    <button class="btn btn-secondary" id="uploadPhotoBtn">📁 Dosyadan Yükle</button>
                </div>
                
                <h4 style="margin-top: 2rem;">Fotoğraf Geçmişi</h4>
                <div class="photo-gallery">
                    ${photos.map(photo => `
                        <div class="photo-item" data-photo-url="${photo.photoUrl}" data-photo-date="${new Date(photo.capturedAt).toLocaleDateString('tr-TR')}">
                            <img src="${photo.photoUrl}" alt="Progress photo">
                            <div class="photo-item-date">${new Date(photo.capturedAt).toLocaleDateString('tr-TR')}</div>
                        </div>
                    `).join('') || '<p class="text-light">Henüz fotoğraf yok</p>'}
                </div>
                
                <h4 style="margin-top: 2rem;">Puanlama (100 Puan Sistemi)</h4>
                ${template ? this.renderScoringForm(template, assessments) : '<p>Şablon bulunamadı</p>'}
                
                <div class="score-display">
                    <div class="score-label">Toplam Puan</div>
                    <div class="score-value" id="totalScore">${this.currentArtwork.totalScore}</div>
                </div>
                
                <button class="btn btn-success" id="saveAssessmentBtn">Değerlendirmeyi Kaydet</button>
            </div>
        `;

        this.attachAssessmentEventListeners();
        this.attachPhotoClickListeners();
    }

    renderScoringForm(template, existingAssessments) {
        return template.criteria.map(criterion => {
            const existing = existingAssessments.find(a => a.criteriaId === criterion.id);
            return `
                <div class="criteria-item">
                    <label class="form-label">
                        ${criterion.name} 
                        <span class="weight-display">${criterion.weight}%</span>
                    </label>
                    <input type="range" class="weight-slider" 
                           data-criterion-id="${criterion.id}"
                           data-weight="${criterion.weight}"
                           min="0" max="10" step="0.5" 
                           value="${existing?.rawScore || 0}">
                    <span id="score-${criterion.id}">
                        ${existing?.rawScore || 0}/10 
                        (Katkı: ${existing?.score || 0} puan)
                    </span>
                </div>
            `;
        }).join('');
    }

    attachAssessmentEventListeners() {
        // Camera controls
        document.getElementById('startCameraBtn').addEventListener('click', async () => {
            try {
                const video = document.getElementById('cameraVideo');
                await this.camera.start(video);
                video.classList.remove('hidden');
                document.getElementById('startCameraBtn').classList.add('hidden');
                document.getElementById('captureBtn').classList.remove('hidden');
                document.getElementById('stopCameraBtn').classList.remove('hidden');
            } catch (error) {
                this.showToast(error.message, 'error');
            }
        });

        document.getElementById('captureBtn').addEventListener('click', async () => {
            const blob = await this.camera.capture();
            await this.savePhoto(blob);
        });

        document.getElementById('stopCameraBtn').addEventListener('click', () => {
            this.camera.stop();
            document.getElementById('cameraVideo').classList.add('hidden');
            document.getElementById('startCameraBtn').classList.remove('hidden');
            document.getElementById('captureBtn').classList.add('hidden');
            document.getElementById('stopCameraBtn').classList.add('hidden');
        });

        document.getElementById('uploadPhotoBtn').addEventListener('click', () => {
            document.getElementById('uploadPhoto').click();
        });

        document.getElementById('uploadPhoto').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const dataUrl = await Camera.captureFromFile(file);
                const blob = await fetch(dataUrl).then(r => r.blob());
                await this.savePhoto(blob);
            }
        });

        // Scoring sliders
        document.querySelectorAll('.weight-slider').forEach(slider => {
            slider.addEventListener('input', () => {
                this.updateScores();
            });
        });

        document.getElementById('saveAssessmentBtn').addEventListener('click', () => {
            this.saveAssessment();
        });
    }

    async savePhoto(blob) {
        const compressed = await Camera.compressImage(blob);
        const photoUrl = await Storage.savePhoto(compressed, this.currentArtwork.id);

        await db.addProgressPhoto({
            artworkId: this.currentArtwork.id,
            photoUrl,
            notes: ''
        });

        this.showToast('Fotoğraf kaydedildi', 'success');
        this.showAssessmentArea(this.currentArtwork.id);
    }

    updateScores() {
        const template = this.templates.find(t => t.id === this.currentArtwork.templateId);
        if (!template) return;

        let totalScore = 0;

        template.criteria.forEach(criterion => {
            const slider = document.querySelector(`[data-criterion-id="${criterion.id}"]`);
            const rawScore = parseFloat(slider.value);
            const weight = parseFloat(slider.getAttribute('data-weight'));

            const score = ScoreCalculator.calculateCriterionScore(rawScore, weight, 10);
            totalScore += score;

            const display = document.getElementById(`score-${criterion.id}`);
            if (display) {
                display.textContent = `${rawScore}/10 (Katkı: ${score.toFixed(1)} puan)`;
            }
        });

        document.getElementById('totalScore').textContent = totalScore.toFixed(1);
    }

    async saveAssessment() {
        try {
            const template = this.templates.find(t => t.id === this.currentArtwork.templateId);
            if (!template) {
                this.showToast('Şablon bulunamadı', 'error');
                return;
            }

            console.log('Saving assessment for artwork:', this.currentArtwork.id);
            console.log('Template:', template);

            // Delete old assessments
            const oldAssessments = await db.getAssessmentsByArtwork(this.currentArtwork.id);
            console.log('Deleting old assessments:', oldAssessments.length);
            for (const assessment of oldAssessments) {
                await db.deleteAssessment(assessment.id);
            }

            // Save new assessments
            const assessments = [];
            for (const criterion of template.criteria) {
                const slider = document.querySelector(`[data-criterion-id="${criterion.id}"]`);

                if (!slider) {
                    console.error('Slider not found for criterion:', criterion.id);
                    continue;
                }

                const rawScore = parseFloat(slider.value);
                const weight = parseFloat(slider.getAttribute('data-weight'));
                const score = ScoreCalculator.calculateCriterionScore(rawScore, weight, 10);

                console.log(`Criterion ${criterion.name}: rawScore=${rawScore}, weight=${weight}, score=${score}`);

                await db.addAssessment({
                    artworkId: this.currentArtwork.id,
                    criteriaId: criterion.id,
                    rawScore,
                    weight,
                    score
                });

                assessments.push({ rawScore, weight, score });
            }

            // Update artwork total score
            const totalScore = ScoreCalculator.calculateTotalScore(assessments, 10);
            console.log('Total score:', totalScore);

            await db.updateArtwork(this.currentArtwork.id, { totalScore });

            this.showToast('Değerlendirme kaydedildi! Toplam: ' + totalScore.toFixed(1), 'success');

            // Export to Google Sheets if enabled
            await this.exportToGoogleSheets(totalScore, assessments);

            // Refresh the assessment area to show updated scores
            await this.showAssessmentArea(this.currentArtwork.id);
        } catch (error) {
            console.error('Error saving assessment:', error);
            this.showToast('Hata: ' + error.message, 'error');
        }
    }

    async exportToGoogleSheets(totalScore, assessments) {
        try {
            // Get student and class info
            const student = this.students.find(s => s.id === this.currentArtwork.studentId);
            const studentClass = this.classes.find(c => c.id === student?.classId);

            const rowData = this.googleSheets.formatAssessmentRow({
                date: new Date().toLocaleDateString('tr-TR'),
                className: studentClass?.name || '',
                studentName: student?.name || '',
                studentNumber: student?.studentNumber || '',
                artworkTitle: this.currentArtwork.title,
                totalScore: totalScore,
                criteriaScores: assessments.map(a => a.score)
            });

            const result = await this.googleSheets.appendRow(rowData);

            if (result.success) {
                console.log('Assessment exported to Google Sheets');
            } else if (result.reason !== 'not_configured') {
                console.warn('Google Sheets export failed:', result.message);
            }
        } catch (error) {
            console.error('Error exporting to Google Sheets:', error);
            // Don't show error to user - this is a background operation
        }
    }

    showToast(message, type) {
        window.app.showToast(message, type);
    }

    attachPhotoClickListeners() {
        document.querySelectorAll('.photo-item[data-photo-url]').forEach(item => {
            item.addEventListener('click', () => {
                const photoUrl = item.getAttribute('data-photo-url');
                const photoDate = item.getAttribute('data-photo-date');
                this.showPhotoLightbox(photoUrl, photoDate);
            });
        });
    }

    showPhotoLightbox(photoUrl, photoDate) {
        // Create lightbox overlay
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

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
                overlay.remove();
            }
        });

        // Close on Escape key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
}

export default ArtworkAssessment;
