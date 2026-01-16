// Criteria Manager Component - Manages weighted scoring templates
import db from '../database.js';
import ScoreCalculator from '../utils/calculator.js';

class CriteriaManager {
    constructor() {
        this.templates = [];
        this.currentTemplate = null;
        this.editingCriteria = [];
    }

    async render() {
        const mainContent = document.getElementById('mainContent');

        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Değerlendirme Ölçütleri</h2>
                    <button class="btn btn-primary" id="addTemplateBtn">+ Yeni Şablon</button>
                </div>
                
                <div id="templateForm" class="hidden">
                    <div class="form-group">
                        <label class="form-label">Şablon Adı</label>
                        <input type="text" class="form-input" id="templateName" placeholder="örn: Resim Çalışması">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Sınıf Seviyesi</label>
                        <select class="form-select" id="templateGradeLevel">
                            <option value="9">9. Sınıf</option>
                            <option value="10">10. Sınıf</option>
                            <option value="11">11. Sınıf</option>
                            <option value="12">12. Sınıf</option>
                            <option value="all">Tüm Sınıflar</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Açıklama</label>
                        <textarea class="form-textarea" id="templateDesc" placeholder="Şablon açıklaması"></textarea>
                    </div>
                    
                    <h3>Ölçütler (100 Puan Sistemi)</h3>
                    <div id="criteriaList"></div>
                    
                    <button class="btn btn-secondary btn-sm" id="addCriterionBtn">+ Ölçüt Ekle</button>
                    
                    <div class="score-display" style="margin-top: 1rem;">
                        <div class="score-label">Toplam Ağırlık</div>
                        <div class="score-value" id="totalWeight">0%</div>
                    </div>
                    
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-success" id="saveTemplateBtn">Kaydet</button>
                        <button class="btn btn-secondary" id="cancelTemplateBtn">İptal</button>
                    </div>
                </div>
                
                <div id="templateList"></div>
            </div>
        `;

        await this.loadTemplates();
        this.attachEventListeners();
    }

    async loadTemplates() {
        try {
            const result = await db.getCriteriaTemplates();
            this.templates = Array.isArray(result) ? result : [];
            console.log('Loaded templates:', this.templates.length);
        } catch (error) {
            console.error('Error loading templates:', error);
            this.templates = [];
        }
        this.renderTemplateList();
    }

    renderTemplateList() {
        const container = document.getElementById('templateList');

        if (this.templates.length === 0) {
            container.innerHTML = '<p class="text-light">Henüz ölçüt şablonu eklenmemiş.</p>';
            return;
        }

        container.innerHTML = `
            <div class="grid grid-2">
                ${this.templates.map(template => `
                    <div class="card">
                        <h3>${template.name}</h3>
                        <p class="text-light">
                            <strong>Sınıf:</strong> ${template.gradeLevel === 'all' ? 'Tüm Sınıflar' : template.gradeLevel + '. Sınıf'}
                        </p>
                        <p class="text-light">${template.description || ''}</p>
                        <div style="margin-top: 1rem;">
                            <strong>Ölçütler:</strong>
                            <ul style="margin-top: 0.5rem;">
                                ${template.criteria.map(c => `
                                    <li>${c.name} - <span class="weight-display">${c.weight}%</span></li>
                                `).join('')}
                            </ul>
                        </div>
                        <div class="list-item-actions" style="margin-top: 1rem;">
                            <button class="btn btn-sm btn-secondary" data-edit="${template.id}">Düzenle</button>
                            <button class="btn btn-sm btn-danger" data-delete="${template.id}">Sil</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.attachListEventListeners();
    }

    attachEventListeners() {
        document.getElementById('addTemplateBtn').addEventListener('click', () => {
            this.showTemplateForm();
        });

        // Use onclick instead of addEventListener to prevent duplicate handlers
        document.getElementById('saveTemplateBtn').onclick = () => {
            this.saveTemplate();
        };

        document.getElementById('cancelTemplateBtn').addEventListener('click', () => {
            this.hideForm();
        });

        document.getElementById('addCriterionBtn').addEventListener('click', () => {
            this.addCriterion();
        });
    }

    attachListEventListeners() {
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-delete');
                if (confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
                    await db.deleteCriteriaTemplate(id);
                    await this.loadTemplates();
                    this.showToast('Şablon silindi', 'success');
                }
            });
        });

        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-edit');
                this.editTemplate(id);
            });
        });
    }

    showTemplateForm() {
        document.getElementById('templateForm').classList.remove('hidden');
        this.editingCriteria = [];
        this.addCriterion();
        this.addCriterion();
        this.addCriterion(); // Start with 3 criteria
    }

    addCriterion() {
        const id = 'criterion_' + Date.now() + '_' + Math.random();
        const criterion = {
            id,
            name: '',
            description: '',
            weight: 0,
            order: this.editingCriteria.length
        };

        this.editingCriteria.push(criterion);

        // Auto-distribute weights
        const weights = ScoreCalculator.distributeWeightsEvenly(this.editingCriteria.length);
        this.editingCriteria.forEach((c, i) => {
            c.weight = weights[i];
        });

        this.renderCriteriaList();
    }

    renderCriteriaList() {
        const container = document.getElementById('criteriaList');

        container.innerHTML = this.editingCriteria.map((criterion, index) => `
            <div class="criteria-item">
                <div class="form-group">
                    <label class="form-label">Ölçüt ${index + 1}</label>
                    <input type="text" class="form-input" 
                           data-criterion-id="${criterion.id}" 
                           data-field="name"
                           value="${criterion.name}"
                           placeholder="örn: Kompozisyon">
                </div>
                <div class="form-group">
                    <label class="form-label">Ağırlık (%)</label>
                    <input type="range" class="weight-slider" 
                           data-criterion-id="${criterion.id}"
                           min="0" max="100" step="1" 
                           value="${criterion.weight}">
                    <span class="weight-display">${criterion.weight}%</span>
                </div>
                ${this.editingCriteria.length > 3 ? `
                    <button class="btn btn-sm btn-danger" data-remove="${criterion.id}">Kaldır</button>
                ` : ''}
            </div>
        `).join('');

        this.updateTotalWeight();
        this.attachCriteriaEventListeners();
    }

    attachCriteriaEventListeners() {
        // Name inputs
        document.querySelectorAll('[data-field="name"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const id = e.target.getAttribute('data-criterion-id');
                const criterion = this.editingCriteria.find(c => c.id === id);
                if (criterion) {
                    criterion.name = e.target.value;
                }
            });
        });

        // Weight sliders
        document.querySelectorAll('.weight-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const id = e.target.getAttribute('data-criterion-id');
                const newWeight = parseFloat(e.target.value);

                // Redistribute weights
                this.editingCriteria = ScoreCalculator.redistributeWeights(
                    this.editingCriteria,
                    id,
                    newWeight
                );

                this.renderCriteriaList();
            });
        });

        // Remove buttons
        document.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-remove');
                this.editingCriteria = this.editingCriteria.filter(c => c.id !== id);

                // Redistribute weights
                const weights = ScoreCalculator.distributeWeightsEvenly(this.editingCriteria.length);
                this.editingCriteria.forEach((c, i) => {
                    c.weight = weights[i];
                });

                this.renderCriteriaList();
            });
        });
    }

    updateTotalWeight() {
        const total = this.editingCriteria.reduce((sum, c) => sum + c.weight, 0);
        const display = document.getElementById('totalWeight');
        if (display) {
            display.textContent = Math.round(total) + '%';
            display.style.color = Math.abs(total - 100) < 0.1 ? '#10b981' : '#ef4444';
        }
    }

    async saveTemplate() {
        const name = document.getElementById('templateName').value.trim();
        const description = document.getElementById('templateDesc').value.trim();

        if (!name) {
            this.showToast('Lütfen şablon adı girin', 'warning');
            return;
        }

        if (this.editingCriteria.length < 3 || this.editingCriteria.length > 5) {
            this.showToast('3-5 arası ölçüt tanımlamalısınız', 'warning');
            return;
        }

        if (this.editingCriteria.some(c => !c.name.trim())) {
            this.showToast('Tüm ölçütlerin adını girin', 'warning');
            return;
        }

        if (!ScoreCalculator.validateWeights(this.editingCriteria)) {
            this.showToast('Toplam ağırlık %100 olmalı', 'warning');
            return;
        }

        await db.addCriteriaTemplate({
            name,
            description,
            gradeLevel: document.getElementById('templateGradeLevel').value,
            criteria: this.editingCriteria
        });

        await this.loadTemplates();
        this.hideForm();
        this.showToast('Şablon kaydedildi', 'success');
    }

    editTemplate(id) {
        const template = this.templates.find(t => t.id === id);
        if (!template) return;

        document.getElementById('templateName').value = template.name;
        document.getElementById('templateGradeLevel').value = template.gradeLevel || 'all';
        document.getElementById('templateDesc').value = template.description || '';
        this.editingCriteria = JSON.parse(JSON.stringify(template.criteria)); // Deep copy

        document.getElementById('templateForm').classList.remove('hidden');
        this.renderCriteriaList();

        const saveBtn = document.getElementById('saveTemplateBtn');
        saveBtn.textContent = 'Güncelle';
        saveBtn.onclick = async () => {
            await db.updateCriteriaTemplate(id, {
                name: document.getElementById('templateName').value.trim(),
                description: document.getElementById('templateDesc').value.trim(),
                gradeLevel: document.getElementById('templateGradeLevel').value,
                criteria: this.editingCriteria
            });
            await this.loadTemplates();
            this.hideForm();
            this.showToast('Şablon güncellendi', 'success');
        };
    }

    hideForm() {
        document.getElementById('templateForm').classList.add('hidden');
        document.getElementById('templateName').value = '';
        document.getElementById('templateDesc').value = '';
        this.editingCriteria = [];

        const saveBtn = document.getElementById('saveTemplateBtn');
        saveBtn.textContent = 'Kaydet';
        saveBtn.onclick = () => this.saveTemplate();
    }

    showToast(message, type) {
        window.app.showToast(message, type);
    }
}

export default CriteriaManager;
