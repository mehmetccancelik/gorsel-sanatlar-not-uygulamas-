// Class Manager Component
import db from '../database.js';

class ClassManager {
    constructor() {
        this.classes = [];
    }

    async render() {
        const mainContent = document.getElementById('mainContent');

        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Sınıflar</h2>
                    <button class="btn btn-primary" id="addClassBtn">+ Yeni Sınıf</button>
                </div>
                
                <div id="classForm" class="hidden">
                    <div class="form-group">
                        <label class="form-label">Sınıf Adı</label>
                        <input type="text" class="form-input" id="className" placeholder="örn: 9-A">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Yıl</label>
                        <input type="text" class="form-input" id="classYear" placeholder="örn: 2025-2026">
                    </div>
                    <div>
                        <button class="btn btn-success" id="saveClassBtn">Kaydet</button>
                        <button class="btn btn-secondary" id="cancelClassBtn">İptal</button>
                    </div>
                </div>
                
                <div id="classList"></div>
            </div>
        `;

        await this.loadClasses();
        this.attachEventListeners();
    }

    async loadClasses() {
        try {
            const result = await db.getClasses();
            this.classes = Array.isArray(result) ? result : [];
            console.log('Loaded classes:', this.classes);
        } catch (error) {
            console.error('Error loading classes:', error);
            this.classes = [];
        }
        this.renderClassList();
    }

    renderClassList() {
        const container = document.getElementById('classList');

        if (this.classes.length === 0) {
            container.innerHTML = '<p class="text-light">Henüz sınıf eklenmemiş.</p>';
            return;
        }

        container.innerHTML = `
            <ul class="list">
                ${this.classes.map(cls => `
                    <li class="list-item">
                        <div>
                            <strong>${cls.name}</strong>
                            <span class="text-light"> - ${cls.year}</span>
                        </div>
                        <div class="list-item-actions">
                            <button class="btn btn-sm btn-secondary" data-edit="${cls.id}">Düzenle</button>
                            <button class="btn btn-sm btn-danger" data-delete="${cls.id}">Sil</button>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;

        this.attachListEventListeners();
    }

    attachEventListeners() {
        document.getElementById('addClassBtn').addEventListener('click', () => {
            document.getElementById('classForm').classList.remove('hidden');
        });

        document.getElementById('saveClassBtn').addEventListener('click', () => {
            this.saveClass();
        });

        document.getElementById('cancelClassBtn').addEventListener('click', () => {
            this.hideForm();
        });
    }

    attachListEventListeners() {
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-delete');
                if (confirm('Bu sınıfı silmek istediğinizden emin misiniz?')) {
                    await db.deleteClass(id);
                    await this.loadClasses();
                    this.showToast('Sınıf silindi', 'success');
                }
            });
        });

        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-edit');
                this.editClass(id);
            });
        });
    }

    async saveClass() {
        const name = document.getElementById('className').value.trim();
        const year = document.getElementById('classYear').value.trim();

        if (!name || !year) {
            this.showToast('Lütfen tüm alanları doldurun', 'warning');
            return;
        }

        // Check for duplicate class (same name and year)
        const existingClass = this.classes.find(c => 
            c.name.toLowerCase() === name.toLowerCase() && 
            c.year === year
        );

        if (existingClass) {
            this.showToast('Bu sınıf zaten mevcut!', 'warning');
            return;
        }

        await db.addClass({ name, year });
        await this.loadClasses();
        this.hideForm();
        this.showToast('Sınıf eklendi', 'success');
    }

    editClass(id) {
        const cls = this.classes.find(c => c.id === id);
        if (!cls) return;

        document.getElementById('className').value = cls.name;
        document.getElementById('classYear').value = cls.year;
        document.getElementById('classForm').classList.remove('hidden');

        // Change save button to update
        const saveBtn = document.getElementById('saveClassBtn');
        saveBtn.textContent = 'Güncelle';

        // Remove old event listener and add new one
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);

        newBtn.addEventListener('click', async () => {
            await db.updateClass(id, {
                name: document.getElementById('className').value.trim(),
                year: document.getElementById('classYear').value.trim()
            });
            await this.loadClasses();
            this.hideForm();
            this.showToast('Sınıf güncellendi', 'success');
        });
    }

    hideForm() {
        document.getElementById('classForm').classList.add('hidden');
        document.getElementById('className').value = '';
        document.getElementById('classYear').value = '';

        // Reset save button
        const saveBtn = document.getElementById('saveClassBtn');
        saveBtn.textContent = 'Kaydet';

        // Remove old event listener and add new one
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);

        newBtn.addEventListener('click', () => this.saveClass());
    }

    showToast(message, type) {
        window.app.showToast(message, type);
    }
}

export default ClassManager;
