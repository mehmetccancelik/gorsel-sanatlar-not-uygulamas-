// Firestore Database Layer
// Cloud storage with user-based data isolation

class FirestoreDB {
    constructor() {
        this.db = null;
        this.userId = null;
        this.initialized = false;
    }

    async init() {
        // Wait for Firebase to be ready
        if (!firebase.apps.length) {
            const firebaseConfig = {
                apiKey: "AIzaSyA88j_2_FUs4akPDD0p-7DobQiME0P_ue4",
                authDomain: "gorsel-sanatlar-app.firebaseapp.com",
                projectId: "gorsel-sanatlar-app",
                storageBucket: "gorsel-sanatlar-app.firebasestorage.app",
                messagingSenderId: "450683935388",
                appId: "1:450683935388:web:e187e42247fcb086aaeb59"
            };
            firebase.initializeApp(firebaseConfig);
        }

        this.db = firebase.firestore();

        // Get current user
        const user = firebase.auth().currentUser;
        if (user) {
            this.userId = user.uid;
        }

        this.initialized = true;
        console.log('Firestore initialized for user:', this.userId);
        return this.db;
    }

    // Helper to get user's collection path
    getUserPath() {
        if (!this.userId) {
            this.userId = firebase.auth().currentUser?.uid;
        }
        return `users/${this.userId}`;
    }

    // ==================== Classes ====================
    async getClasses() {
        const snapshot = await this.db.collection(`${this.getUserPath()}/classes`).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addClass(classData) {
        const id = classData.id || `class_${Date.now()}`;
        const data = { ...classData, id, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        await this.db.collection(`${this.getUserPath()}/classes`).doc(id).set(data);
        return id;
    }

    async updateClass(id, classData) {
        await this.db.collection(`${this.getUserPath()}/classes`).doc(id).update(classData);
    }

    async deleteClass(id) {
        await this.db.collection(`${this.getUserPath()}/classes`).doc(id).delete();
    }

    async getClassById(id) {
        const doc = await this.db.collection(`${this.getUserPath()}/classes`).doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    // ==================== Students ====================
    async getStudents() {
        const snapshot = await this.db.collection(`${this.getUserPath()}/students`).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getStudentsByClass(classId) {
        const snapshot = await this.db.collection(`${this.getUserPath()}/students`)
            .where('classId', '==', classId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addStudent(studentData) {
        const id = studentData.id || `student_${Date.now()}`;
        const data = { ...studentData, id, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        await this.db.collection(`${this.getUserPath()}/students`).doc(id).set(data);
        return id;
    }

    async updateStudent(id, studentData) {
        await this.db.collection(`${this.getUserPath()}/students`).doc(id).update(studentData);
    }

    async deleteStudent(id) {
        await this.db.collection(`${this.getUserPath()}/students`).doc(id).delete();
    }

    async getStudentById(id) {
        const doc = await this.db.collection(`${this.getUserPath()}/students`).doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    // ==================== Criteria Templates ====================
    async getCriteriaTemplates() {
        const snapshot = await this.db.collection(`${this.getUserPath()}/criteriaTemplates`).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addCriteriaTemplate(templateData) {
        const id = templateData.id || `template_${Date.now()}`;
        const data = { ...templateData, id, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        await this.db.collection(`${this.getUserPath()}/criteriaTemplates`).doc(id).set(data);
        return id;
    }

    async updateCriteriaTemplate(id, templateData) {
        await this.db.collection(`${this.getUserPath()}/criteriaTemplates`).doc(id).update(templateData);
    }

    async deleteCriteriaTemplate(id) {
        await this.db.collection(`${this.getUserPath()}/criteriaTemplates`).doc(id).delete();
    }

    // ==================== Artworks ====================
    async getArtworks() {
        const snapshot = await this.db.collection(`${this.getUserPath()}/artworks`).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getArtworksByStudent(studentId) {
        const snapshot = await this.db.collection(`${this.getUserPath()}/artworks`)
            .where('studentId', '==', studentId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addArtwork(artworkData) {
        const id = artworkData.id || `artwork_${Date.now()}`;
        const data = { ...artworkData, id, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        await this.db.collection(`${this.getUserPath()}/artworks`).doc(id).set(data);
        return id;
    }

    async updateArtwork(id, artworkData) {
        await this.db.collection(`${this.getUserPath()}/artworks`).doc(id).update(artworkData);
    }

    async deleteArtwork(id) {
        await this.db.collection(`${this.getUserPath()}/artworks`).doc(id).delete();
    }

    // ==================== Progress Photos ====================
    async getProgressPhotos() {
        const snapshot = await this.db.collection(`${this.getUserPath()}/progressPhotos`).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getProgressPhotosByArtwork(artworkId) {
        const snapshot = await this.db.collection(`${this.getUserPath()}/progressPhotos`)
            .where('artworkId', '==', artworkId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addProgressPhoto(photoData) {
        const id = photoData.id || `photo_${Date.now()}`;
        const data = { ...photoData, id, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        await this.db.collection(`${this.getUserPath()}/progressPhotos`).doc(id).set(data);
        return id;
    }

    async deleteProgressPhoto(id) {
        await this.db.collection(`${this.getUserPath()}/progressPhotos`).doc(id).delete();
    }

    // ==================== Assessments ====================
    async getAssessments() {
        const snapshot = await this.db.collection(`${this.getUserPath()}/assessments`).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getAssessmentsByArtwork(artworkId) {
        const snapshot = await this.db.collection(`${this.getUserPath()}/assessments`)
            .where('artworkId', '==', artworkId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addAssessment(assessmentData) {
        const id = assessmentData.id || `assessment_${Date.now()}`;
        const data = { ...assessmentData, id, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        await this.db.collection(`${this.getUserPath()}/assessments`).doc(id).set(data);
        return id;
    }

    async updateAssessment(id, assessmentData) {
        await this.db.collection(`${this.getUserPath()}/assessments`).doc(id).update(assessmentData);
    }

    // ==================== Semester Grades ====================
    async getSemesterGrades() {
        const snapshot = await this.db.collection(`${this.getUserPath()}/semesterGrades`).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getSemesterGradesByStudent(studentId) {
        const snapshot = await this.db.collection(`${this.getUserPath()}/semesterGrades`)
            .where('studentId', '==', studentId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addSemesterGrade(gradeData) {
        const id = gradeData.id || `grade_${Date.now()}`;
        const data = { ...gradeData, id, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        await this.db.collection(`${this.getUserPath()}/semesterGrades`).doc(id).set(data);
        return id;
    }

    async updateSemesterGrade(id, gradeData) {
        await this.db.collection(`${this.getUserPath()}/semesterGrades`).doc(id).update(gradeData);
    }

    async deleteSemesterGrade(id) {
        await this.db.collection(`${this.getUserPath()}/semesterGrades`).doc(id).delete();
    }

    // ==================== Schools ====================
    async getSchools() {
        const snapshot = await this.db.collection(`${this.getUserPath()}/schools`).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addSchool(schoolData) {
        const id = schoolData.id || `school_${Date.now()}`;
        const data = { ...schoolData, id, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        await this.db.collection(`${this.getUserPath()}/schools`).doc(id).set(data);
        return id;
    }

    async updateSchool(id, schoolData) {
        await this.db.collection(`${this.getUserPath()}/schools`).doc(id).update(schoolData);
    }

    async deleteSchool(id) {
        await this.db.collection(`${this.getUserPath()}/schools`).doc(id).delete();
    }

    // ==================== Academic Years ====================
    async getAcademicYears() {
        const snapshot = await this.db.collection(`${this.getUserPath()}/academicYears`).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getAcademicYearsBySchool(schoolId) {
        const snapshot = await this.db.collection(`${this.getUserPath()}/academicYears`)
            .where('schoolId', '==', schoolId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addAcademicYear(yearData) {
        const id = yearData.id || `year_${Date.now()}`;
        const data = { ...yearData, id, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        await this.db.collection(`${this.getUserPath()}/academicYears`).doc(id).set(data);
        return id;
    }

    async updateAcademicYear(id, yearData) {
        await this.db.collection(`${this.getUserPath()}/academicYears`).doc(id).update(yearData);
    }

    async deleteAcademicYear(id) {
        await this.db.collection(`${this.getUserPath()}/academicYears`).doc(id).delete();
    }

    // ==================== Bulk Operations ====================
    async addStudentsBulk(students) {
        const batch = this.db.batch();
        const results = [];

        for (const student of students) {
            const id = student.id || `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const data = { ...student, id, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
            const ref = this.db.collection(`${this.getUserPath()}/students`).doc(id);
            batch.set(ref, data);
            results.push(id);
        }

        await batch.commit();
        return results;
    }

    // Check for duplicate student
    async checkDuplicateStudent(classId, studentNo) {
        const snapshot = await this.db.collection(`${this.getUserPath()}/students`)
            .where('classId', '==', classId)
            .where('studentNo', '==', studentNo)
            .get();
        return !snapshot.empty;
    }
}

// Create global instance
const db = new FirestoreDB();
export default db;
