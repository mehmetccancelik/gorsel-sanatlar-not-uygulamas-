// Database Layer - IndexedDB for offline storage
// This provides local storage that syncs with Firebase when online

class Database {
    constructor() {
        this.dbName = 'VisualArtsDB';
        this.version = 3; // Upgraded for schools, academicYears
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Classes store
                if (!db.objectStoreNames.contains('classes')) {
                    const classStore = db.createObjectStore('classes', { keyPath: 'id' });
                    classStore.createIndex('year', 'year', { unique: false });
                }

                // Students store
                if (!db.objectStoreNames.contains('students')) {
                    const studentStore = db.createObjectStore('students', { keyPath: 'id' });
                    studentStore.createIndex('classId', 'classId', { unique: false });
                }

                // Criteria Templates store
                if (!db.objectStoreNames.contains('criteriaTemplates')) {
                    db.createObjectStore('criteriaTemplates', { keyPath: 'id' });
                }

                // Artworks store
                if (!db.objectStoreNames.contains('artworks')) {
                    const artworkStore = db.createObjectStore('artworks', { keyPath: 'id' });
                    artworkStore.createIndex('studentId', 'studentId', { unique: false });
                    artworkStore.createIndex('status', 'status', { unique: false });
                }

                // Progress Photos store
                if (!db.objectStoreNames.contains('progressPhotos')) {
                    const photoStore = db.createObjectStore('progressPhotos', { keyPath: 'id' });
                    photoStore.createIndex('artworkId', 'artworkId', { unique: false });
                }

                // Assessments store
                if (!db.objectStoreNames.contains('assessments')) {
                    const assessmentStore = db.createObjectStore('assessments', { keyPath: 'id' });
                    assessmentStore.createIndex('artworkId', 'artworkId', { unique: false });
                }

                // Semester Grades store
                if (!db.objectStoreNames.contains('semesterGrades')) {
                    const gradeStore = db.createObjectStore('semesterGrades', { keyPath: 'id' });
                    gradeStore.createIndex('studentId', 'studentId', { unique: false });
                    gradeStore.createIndex('semester', 'semester', { unique: false });
                }

                // Schools store
                if (!db.objectStoreNames.contains('schools')) {
                    db.createObjectStore('schools', { keyPath: 'id' });
                }

                // Academic Years store
                if (!db.objectStoreNames.contains('academicYears')) {
                    const yearStore = db.createObjectStore('academicYears', { keyPath: 'id' });
                    yearStore.createIndex('schoolId', 'schoolId', { unique: false });
                }
            };
        });
    }

    // Generic CRUD operations
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Specific methods for the app

    // Classes
    async addClass(classData) {
        const id = 'class_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const data = {
            id,
            ...classData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await this.add('classes', data);
        return data;
    }

    async getClasses() {
        return this.getAll('classes');
    }

    async updateClass(id, updates) {
        const existing = await this.get('classes', id);
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await this.put('classes', updated);
        return updated;
    }

    async deleteClass(id) {
        return this.delete('classes', id);
    }

    // Students
    async addStudent(studentData) {
        const id = 'student_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const data = {
            id,
            ...studentData,
            createdAt: new Date().toISOString()
        };
        await this.add('students', data);
        return data;
    }

    async getStudents() {
        return this.getAll('students');
    }

    async getStudentsByClass(classId) {
        return this.getByIndex('students', 'classId', classId);
    }

    async updateStudent(id, updates) {
        const existing = await this.get('students', id);
        const updated = { ...existing, ...updates };
        await this.put('students', updated);
        return updated;
    }

    async deleteStudent(id) {
        return this.delete('students', id);
    }

    // Criteria Templates
    async addCriteriaTemplate(templateData) {
        const id = 'template_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const data = {
            id,
            ...templateData,
            createdAt: new Date().toISOString()
        };
        await this.add('criteriaTemplates', data);
        return data;
    }

    async getCriteriaTemplates() {
        return this.getAll('criteriaTemplates');
    }

    async updateCriteriaTemplate(id, updates) {
        const existing = await this.get('criteriaTemplates', id);
        const updated = { ...existing, ...updates };
        await this.put('criteriaTemplates', updated);
        return updated;
    }

    async deleteCriteriaTemplate(id) {
        return this.delete('criteriaTemplates', id);
    }

    // Artworks
    async addArtwork(artworkData) {
        const id = 'artwork_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const data = {
            id,
            ...artworkData,
            status: 'in-progress',
            totalScore: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await this.add('artworks', data);
        return data;
    }

    async getArtworks() {
        return this.getAll('artworks');
    }

    async getArtworksByStudent(studentId) {
        return this.getByIndex('artworks', 'studentId', studentId);
    }

    async updateArtwork(id, updates) {
        const existing = await this.get('artworks', id);
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await this.put('artworks', updated);
        return updated;
    }

    async deleteArtwork(id) {
        return this.delete('artworks', id);
    }

    // Progress Photos
    async addProgressPhoto(photoData) {
        const id = 'photo_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const data = {
            id,
            ...photoData,
            capturedAt: new Date().toISOString()
        };
        await this.add('progressPhotos', data);
        return data;
    }

    async getProgressPhotos(artworkId) {
        return this.getByIndex('progressPhotos', 'artworkId', artworkId);
    }

    async deleteProgressPhoto(id) {
        return this.delete('progressPhotos', id);
    }

    // Assessments
    async addAssessment(assessmentData) {
        const id = 'assessment_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const data = {
            id,
            ...assessmentData,
            assessedAt: new Date().toISOString()
        };
        await this.add('assessments', data);
        return data;
    }

    async getAssessmentsByArtwork(artworkId) {
        return this.getByIndex('assessments', 'artworkId', artworkId);
    }

    async updateAssessment(id, updates) {
        const existing = await this.get('assessments', id);
        const updated = { ...existing, ...updates };
        await this.put('assessments', updated);
        return updated;
    }

    async deleteAssessment(id) {
        return this.delete('assessments', id);
    }

    async getAssessments() {
        return this.getAll('assessments');
    }

    // Semester Grades
    async addSemesterGrade(gradeData) {
        const id = 'grade_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const data = {
            id,
            ...gradeData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await this.add('semesterGrades', data);
        return data;
    }

    async getSemesterGrades() {
        return this.getAll('semesterGrades');
    }

    async getSemesterGradesByStudent(studentId) {
        return this.getByIndex('semesterGrades', 'studentId', studentId);
    }

    async getSemesterGradesBySemester(semester) {
        return this.getByIndex('semesterGrades', 'semester', semester);
    }

    async updateSemesterGrade(id, updates) {
        const existing = await this.get('semesterGrades', id);
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await this.put('semesterGrades', updated);
        return updated;
    }

    async deleteSemesterGrade(id) {
        return this.delete('semesterGrades', id);
    }

    async getOrCreateSemesterGrade(studentId, semester, year) {
        const grades = await this.getSemesterGradesByStudent(studentId);
        let grade = grades.find(g => g.semester === semester && g.year === year);

        if (!grade) {
            grade = await this.addSemesterGrade({
                studentId,
                semester,
                year,
                exam1: null,
                oral1: null,
                exam2: null,
                oral2: null,
                selectedArtworks1: [],
                selectedArtworks2: []
            });
        }

        return grade;
    }

    // Schools
    async addSchool(schoolData) {
        const id = 'school_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const data = {
            id,
            ...schoolData,
            createdAt: new Date().toISOString()
        };
        await this.add('schools', data);
        return data;
    }

    async getSchools() {
        return this.getAll('schools');
    }

    async updateSchool(id, updates) {
        const existing = await this.get('schools', id);
        const updated = { ...existing, ...updates };
        await this.put('schools', updated);
        return updated;
    }

    async deleteSchool(id) {
        return this.delete('schools', id);
    }

    // Academic Years
    async addAcademicYear(yearData) {
        const id = 'year_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const data = {
            id,
            ...yearData,
            createdAt: new Date().toISOString()
        };
        await this.add('academicYears', data);
        return data;
    }

    async getAcademicYears() {
        return this.getAll('academicYears');
    }

    async getAcademicYearsBySchool(schoolId) {
        return this.getByIndex('academicYears', 'schoolId', schoolId);
    }

    async updateAcademicYear(id, updates) {
        const existing = await this.get('academicYears', id);
        const updated = { ...existing, ...updates };
        await this.put('academicYears', updated);
        return updated;
    }

    async deleteAcademicYear(id) {
        return this.delete('academicYears', id);
    }
}

// Create and export singleton instance
const db = new Database();
export default db;
