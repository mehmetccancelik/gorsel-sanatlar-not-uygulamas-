// Student Manager Component
import db from '../database.js';

class StudentManager {
    constructor() {
        this.students = [];
        this.classes = [];
    }

    async render() {
        const mainContent = document.getElementById('mainContent');

        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Öğrenciler</h2>
                    <div>
                        <button class="btn btn-primary" id="addStudentBtn">+ Yeni Öğrenci</button>
                        <button class="btn btn-success" id="importExcelBtn">📊 Excel'den Aktar</button>
                        <input type="file" id="excelFileInput" accept=".xlsx,.xls,.csv" class="hidden">
                    </div>
                </div>
                
                <div id="studentForm" class="hidden">
                    <div class="form-group">
                        <label class="form-label">Öğrenci Adı</label>
                        <input type="text" class="form-input" id="studentName" placeholder="Ad Soyad">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Öğrenci No</label>
                        <input type="text" class="form-input" id="studentNumber" placeholder="Öğrenci numarası">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Sınıf</label>
                        <select class="form-select" id="studentClass">
                            <option value="">Sınıf seçin...</option>
                        </select>
                    </div>
                    <div>
                        <button class="btn btn-success" id="saveStudentBtn">Kaydet</button>
                        <button class="btn btn-secondary" id="cancelStudentBtn">İptal</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Sınıfa Göre Filtrele</label>
                    <select class="form-select" id="filterClass">
                        <option value="">Tüm Sınıflar</option>
                    </select>
                </div>
                
                <div id="studentList"></div>
            </div>
        `;

        await this.loadData();
        this.attachEventListeners();
    }

    async loadData() {
        try {
            const classesResult = await db.getClasses();
            const studentsResult = await db.getStudents();
            this.classes = Array.isArray(classesResult) ? classesResult : [];
            this.students = Array.isArray(studentsResult) ? studentsResult : [];
            console.log('Loaded data - Classes:', this.classes.length, 'Students:', this.students.length);
        } catch (error) {
            console.error('Error loading data:', error);
            this.classes = [];
            this.students = [];
        }
        this.populateClassDropdowns();
        this.renderStudentList();
    }

    populateClassDropdowns() {
        const studentClassSelect = document.getElementById('studentClass');
        const filterClassSelect = document.getElementById('filterClass');

        const options = this.classes.map(cls =>
            `<option value="${cls.id}">${cls.name}</option>`
        ).join('');

        studentClassSelect.innerHTML = '<option value="">Sınıf seçin...</option>' + options;
        filterClassSelect.innerHTML = '<option value="">Tüm Sınıflar</option>' + options;
    }

    renderStudentList(filterClassId = '') {
        const container = document.getElementById('studentList');

        let filteredStudents = this.students;
        if (filterClassId) {
            filteredStudents = this.students.filter(s => s.classId === filterClassId);
        }

        if (filteredStudents.length === 0) {
            container.innerHTML = '<p class="text-light">Öğrenci bulunamadı.</p>';
            return;
        }

        container.innerHTML = `
            <div class="bulk-actions" style="margin-bottom: 1rem; display: flex; gap: 0.5rem; align-items: center;">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                    <input type="checkbox" id="selectAllStudents">
                    <span>Tümünü Seç</span>
                </label>
                <button class="btn btn-sm btn-danger" id="bulkDeleteBtn" disabled>Seçilenleri Sil</button>
                <span id="selectedCount" class="text-light" style="margin-left: 0.5rem;"></span>
            </div>
            <ul class="list">
                ${filteredStudents.map(student => {
            const studentClass = this.classes.find(c => c.id === student.classId);
            return `
                        <li class="list-item">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <input type="checkbox" class="student-checkbox" data-id="${student.id}">
                                <div>
                                    <strong>${student.name}</strong>
                                    <span class="text-light"> - ${student.studentNumber}</span>
                                    <br>
                                    <small class="text-light">Sınıf: ${studentClass?.name || 'Belirtilmemiş'}</small>
                                </div>
                            </div>
                            <div class="list-item-actions">
                                <button class="btn btn-sm btn-secondary" data-edit="${student.id}">Düzenle</button>
                                <button class="btn btn-sm btn-danger" data-delete="${student.id}">Sil</button>
                            </div>
                        </li>
                    `;
        }).join('')}
            </ul>
        `;

        this.attachListEventListeners();
        this.attachBulkActionListeners();
    }

    attachBulkActionListeners() {
        const selectAllCheckbox = document.getElementById('selectAllStudents');
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        const selectedCountSpan = document.getElementById('selectedCount');

        const updateBulkState = () => {
            const checkboxes = document.querySelectorAll('.student-checkbox');
            const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
            const checkedCount = checkedBoxes.length;

            bulkDeleteBtn.disabled = checkedCount === 0;
            selectedCountSpan.textContent = checkedCount > 0 ? `${checkedCount} seçili` : '';
            selectAllCheckbox.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
            selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
        };

        selectAllCheckbox?.addEventListener('change', (e) => {
            document.querySelectorAll('.student-checkbox').forEach(cb => {
                cb.checked = e.target.checked;
            });
            updateBulkState();
        });

        document.querySelectorAll('.student-checkbox').forEach(cb => {
            cb.addEventListener('change', updateBulkState);
        });

        bulkDeleteBtn?.addEventListener('click', async () => {
            const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
            const ids = Array.from(checkedBoxes).map(cb => cb.dataset.id);

            if (ids.length === 0) return;

            if (confirm(`${ids.length} öğrenciyi silmek istediğinizden emin misiniz?`)) {
                for (const id of ids) {
                    await db.deleteStudent(id);
                }
                await this.loadData();
                this.showToast(`${ids.length} öğrenci silindi`, 'success');
            }
        });
    }

    attachEventListeners() {
        document.getElementById('addStudentBtn').addEventListener('click', () => {
            document.getElementById('studentForm').classList.remove('hidden');
        });

        document.getElementById('saveStudentBtn').addEventListener('click', () => {
            this.saveStudent();
        });

        document.getElementById('cancelStudentBtn').addEventListener('click', () => {
            this.hideForm();
        });

        document.getElementById('filterClass').addEventListener('change', (e) => {
            this.renderStudentList(e.target.value);
        });

        // Excel import
        document.getElementById('importExcelBtn').addEventListener('click', () => {
            document.getElementById('excelFileInput').click();
        });

        document.getElementById('excelFileInput').addEventListener('change', (e) => {
            this.handleExcelImport(e);
        });
    }

    attachListEventListeners() {
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-delete');
                if (confirm('Bu öğrenciyi silmek istediğinizden emin misiniz?')) {
                    await db.deleteStudent(id);
                    await this.loadData();
                    this.showToast('Öğrenci silindi', 'success');
                }
            });
        });

        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-edit');
                this.editStudent(id);
            });
        });
    }

    async saveStudent() {
        const name = document.getElementById('studentName').value.trim();
        const studentNumber = document.getElementById('studentNumber').value.trim();
        const classId = document.getElementById('studentClass').value;

        if (!name || !studentNumber || !classId) {
            this.showToast('Lütfen tüm alanları doldurun', 'warning');
            return;
        }

        await db.addStudent({ name, studentNumber, classId });
        await this.loadData();
        this.hideForm();
        this.showToast('Öğrenci eklendi', 'success');
    }

    async handleExcelImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            let students = [];

            if (fileExtension === 'csv') {
                students = await this.parseCSV(file);
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                students = await this.parseExcel(file);
            } else {
                this.showToast('Desteklenmeyen dosya formatı. CSV veya Excel kullanın.', 'error');
                return;
            }

            if (students.length === 0) {
                this.showToast('Dosyada öğrenci bulunamadı', 'warning');
                return;
            }

            // Show import preview
            await this.showImportPreview(students);

        } catch (error) {
            console.error('Excel import error:', error);
            this.showToast('Dosya okuma hatası: ' + error.message, 'error');
        }

        // Reset file input
        event.target.value = '';
    }

    async parseCSV(file) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            throw new Error('CSV dosyası boş veya geçersiz');
        }

        // Skip header row
        const dataLines = lines.slice(1);
        const students = [];

        for (const line of dataLines) {
            // Split by comma or semicolon
            const parts = line.split(/[,;]/).map(p => p.trim().replace(/^"|"$/g, ''));

            if (parts.length >= 2) {
                students.push({
                    name: parts[0],
                    studentNumber: parts[1],
                    classId: null // Will be assigned during import
                });
            }
        }

        return students;
    }

    async parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get first sheet
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];

                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                    if (jsonData.length < 2) {
                        reject(new Error('Excel dosyası boş veya geçersiz'));
                        return;
                    }

                    // Find column indexes (smart detection for E-Okul format)
                    const headerRow = jsonData[0].map(h => String(h).toLowerCase().trim());

                    // Look for column names in Turkish and English
                    let noIndex = -1;
                    let adIndex = -1;
                    let soyadIndex = -1;
                    let adSoyadIndex = -1;

                    // Column name variations
                    const noVariants = ['no', 'öğrenci no', 'ogrenci no', 'numara', 'sıra no', 'sira no', 'öğrenci numarası', 'ogrenci numarasi'];
                    const adVariants = ['ad', 'adı', 'adi', 'öğrenci adı', 'ogrenci adi', 'first name'];
                    const soyadVariants = ['soyad', 'soyadı', 'soyadi', 'surname', 'last name'];
                    const adSoyadVariants = ['ad soyad', 'adsoyad', 'ad-soyad', 'adı soyadı', 'adi soyadi', 'öğrenci', 'ogrenci', 'full name', 'isim'];

                    headerRow.forEach((header, index) => {
                        if (noVariants.some(v => header.includes(v))) noIndex = index;
                        if (adVariants.some(v => header === v || header.includes(v))) adIndex = index;
                        if (soyadVariants.some(v => header === v || header.includes(v))) soyadIndex = index;
                        if (adSoyadVariants.some(v => header === v || header.includes(v))) adSoyadIndex = index;
                    });

                    console.log('Detected columns:', { noIndex, adIndex, soyadIndex, adSoyadIndex });

                    const students = [];

                    // Skip header row, process data rows
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!row || row.length === 0) continue;

                        let name = '';
                        let studentNo = '';

                        // Get student number
                        if (noIndex >= 0 && row[noIndex]) {
                            studentNo = String(row[noIndex]).trim();
                        } else if (row[0]) {
                            // If no column found, use first column as number
                            studentNo = String(row[0]).trim();
                        }

                        // Get student name (use first matching method only)
                        if (adIndex >= 0 && soyadIndex >= 0 && adIndex !== soyadIndex) {
                            // Separate Ad and Soyad columns (E-Okul format)
                            const ad = String(row[adIndex] || '').trim();
                            const soyad = String(row[soyadIndex] || '').trim();
                            name = `${ad} ${soyad}`.trim();
                        } else if (adSoyadIndex >= 0 && row[adSoyadIndex]) {
                            // Combined Ad Soyad column
                            name = String(row[adSoyadIndex]).trim();
                        } else {
                            // Fallback: try to find name in columns
                            // Look for text columns (not numbers)
                            for (let col = 1; col < Math.min(row.length, 5); col++) {
                                const val = row[col];
                                if (val && typeof val === 'string' && val.trim().length > 1 && !val.match(/^\d+$/)) {
                                    if (!name) {
                                        name = val.trim();
                                    } else if (name !== val.trim()) {
                                        // If next column is also text and different, it might be surname
                                        name = `${name} ${val.trim()}`;
                                        break;
                                    }
                                }
                            }
                        }

                        // Skip if no valid data
                        if (!name || name.length < 2) continue;

                        // Generate student number if not found
                        if (!studentNo) {
                            studentNo = String(i);
                        }

                        students.push({
                            name: name,
                            studentNumber: studentNo,
                            classId: null
                        });
                    }

                    console.log(`Parsed ${students.length} students from Excel`);
                    resolve(students);

                } catch (error) {
                    console.error('Excel parsing error:', error);
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Dosya okunamadı'));
            reader.readAsArrayBuffer(file);
        });
    }

    async showImportPreview(students) {
        const mainContent = document.getElementById('mainContent');

        mainContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Excel İçe Aktarma Önizleme</h2>
                </div>
                
                <p><strong>${students.length}</strong> öğrenci bulundu.</p>
                
                <div class="form-group">
                    <label class="form-label">Bu öğrencileri hangi sınıfa eklemek istiyorsunuz?</label>
                    <select class="form-select" id="importClassSelect">
                        <option value="">Sınıf seçin...</option>
                        ${this.classes.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join('')}
                    </select>
                </div>
                
                <h4>Öğrenci Listesi:</h4>
                <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: var(--bg); position: sticky; top: 0;">
                                <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid var(--border);">#</th>
                                <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid var(--border);">Ad Soyad</th>
                                <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid var(--border);">Öğrenci No</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map((student, index) => `
                                <tr style="border-bottom: 1px solid var(--border);">
                                    <td style="padding: 0.5rem;">${index + 1}</td>
                                    <td style="padding: 0.5rem;">${student.name}</td>
                                    <td style="padding: 0.5rem;">${student.studentNumber}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 1.5rem;">
                    <button class="btn btn-success" id="confirmImportBtn">✓ İçe Aktar</button>
                    <button class="btn btn-secondary" id="cancelImportBtn">İptal</button>
                </div>
            </div>
        `;

        // Store students temporarily
        this.pendingImport = students;

        // Attach event listeners
        document.getElementById('confirmImportBtn').addEventListener('click', async () => {
            const classId = document.getElementById('importClassSelect').value;
            if (!classId) {
                this.showToast('Lütfen bir sınıf seçin', 'warning');
                return;
            }
            await this.confirmImport(classId);
        });

        document.getElementById('cancelImportBtn').addEventListener('click', () => {
            this.pendingImport = null;
            this.render();
        });
    }

    async confirmImport(classId) {
        if (!this.pendingImport || this.pendingImport.length === 0) return;

        // Get existing students to check for duplicates
        const existingStudents = await db.getStudents();
        const existingNumbers = new Set(existingStudents.map(s => s.studentNumber));

        let successCount = 0;
        let errorCount = 0;
        let duplicateCount = 0;

        for (const student of this.pendingImport) {
            try {
                // Check if student number already exists
                if (existingNumbers.has(student.studentNumber)) {
                    console.log(`Duplicate student number: ${student.studentNumber}`);
                    duplicateCount++;
                    continue;
                }

                await db.addStudent({
                    name: student.name,
                    studentNumber: student.studentNumber,
                    classId: classId
                });

                // Add to existing numbers set to prevent duplicates within same import
                existingNumbers.add(student.studentNumber);
                successCount++;
            } catch (error) {
                console.error('Error adding student:', error);
                errorCount++;
            }
        }

        this.pendingImport = null;

        let message = `${successCount} öğrenci eklendi`;
        if (duplicateCount > 0) message += `, ${duplicateCount} tekrar (atlandı)`;
        if (errorCount > 0) message += `, ${errorCount} hata`;

        this.showToast(message, 'success');

        // Return to normal view
        await this.render();
    }

    editStudent(id) {
        const student = this.students.find(s => s.id === id);
        if (!student) return;

        document.getElementById('studentName').value = student.name;
        document.getElementById('studentNumber').value = student.studentNumber;
        document.getElementById('studentClass').value = student.classId;
        document.getElementById('studentForm').classList.remove('hidden');

        const saveBtn = document.getElementById('saveStudentBtn');
        saveBtn.textContent = 'Güncelle';
        saveBtn.onclick = async () => {
            await db.updateStudent(id, {
                name: document.getElementById('studentName').value.trim(),
                studentNumber: document.getElementById('studentNumber').value.trim(),
                classId: document.getElementById('studentClass').value
            });
            await this.loadData();
            this.hideForm();
            this.showToast('Öğrenci güncellendi', 'success');
        };
    }

    hideForm() {
        document.getElementById('studentForm').classList.add('hidden');
        document.getElementById('studentName').value = '';
        document.getElementById('studentNumber').value = '';
        document.getElementById('studentClass').value = '';

        const saveBtn = document.getElementById('saveStudentBtn');
        saveBtn.textContent = 'Kaydet';
        saveBtn.onclick = () => this.saveStudent();
    }

    showToast(message, type) {
        window.app.showToast(message, type);
    }
}

export default StudentManager;
