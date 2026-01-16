// Excel export utility using SheetJS
export class ExcelExporter {
    /**
     * Export all data to Excel
     * @param {Object} data - {classes, students, artworks, assessments}
     * @param {string} filterClassId - Optional class ID to filter by
     * @returns {Promise<void>}
     */
    static async exportToExcel(data, filterClassId = '') {
        const { classes, students, artworks, assessments } = data;

        // Filter artworks by class if specified
        let filteredArtworks = artworks;
        if (filterClassId) {
            const classStudents = students.filter(s => s.classId === filterClassId);
            const studentIds = classStudents.map(s => s.id);
            filteredArtworks = artworks.filter(a => studentIds.includes(a.studentId));
        }

        // Create CSV content with semicolon separator for Excel
        let csv = 'Sınıf;Öğrenci No;Öğrenci Adı;Çalışma;Tarih;Toplam Puan;Durum\n';

        // Sort by class name, then student name
        const sortedArtworks = filteredArtworks.sort((a, b) => {
            const studentA = students.find(s => s.id === a.studentId);
            const studentB = students.find(s => s.id === b.studentId);
            const classA = classes.find(c => c.id === studentA?.classId);
            const classB = classes.find(c => c.id === studentB?.classId);

            const classCompare = (classA?.name || '').localeCompare(classB?.name || '');
            if (classCompare !== 0) return classCompare;

            return (studentA?.name || '').localeCompare(studentB?.name || '');
        });

        for (const artwork of sortedArtworks) {
            const student = students.find(s => s.id === artwork.studentId);
            const studentClass = classes.find(c => c.id === student?.classId);

            csv += `${studentClass?.name || ''};`;
            csv += `${student?.studentNumber || ''};`;
            csv += `${student?.name || ''};`;
            csv += `${artwork.title};`;
            csv += `${new Date(artwork.createdAt).toLocaleDateString('tr-TR')};`;
            csv += `${artwork.totalScore};`;
            csv += `${artwork.status === 'completed' ? 'Tamamlandı' : 'Devam Ediyor'}\n`;
        }

        this.downloadCSV(csv, 'sanat-degerlendirme.csv');
    }

    /**
     * Export detailed report with criteria scores
     * @param {Object} data
     * @param {string} filterClassId - Optional class ID to filter by
     * @returns {Promise<void>}
     */
    static async exportDetailedReport(data, filterClassId = '') {
        const { classes, students, artworks, assessments, criteriaTemplates } = data;

        // Filter artworks by class if specified
        let filteredArtworks = artworks;
        if (filterClassId) {
            const classStudents = students.filter(s => s.classId === filterClassId);
            const studentIds = classStudents.map(s => s.id);
            filteredArtworks = artworks.filter(a => studentIds.includes(a.studentId));
        }

        let csv = 'Sınıf;Öğrenci;Çalışma;Tarih;';

        // Add criteria headers
        const firstArtwork = filteredArtworks[0];
        if (firstArtwork) {
            const template = criteriaTemplates.find(t => t.id === firstArtwork.templateId);
            if (template) {
                template.criteria.forEach(c => {
                    csv += `${c.name} (%${c.weight});`;
                });
            }
        }

        csv += 'Toplam Puan\n';

        // Sort by class name, then student name
        const sortedArtworks = filteredArtworks.sort((a, b) => {
            const studentA = students.find(s => s.id === a.studentId);
            const studentB = students.find(s => s.id === b.studentId);
            const classA = classes.find(c => c.id === studentA?.classId);
            const classB = classes.find(c => c.id === studentB?.classId);

            const classCompare = (classA?.name || '').localeCompare(classB?.name || '');
            if (classCompare !== 0) return classCompare;

            return (studentA?.name || '').localeCompare(studentB?.name || '');
        });

        // Add data rows
        for (const artwork of sortedArtworks) {
            const student = students.find(s => s.id === artwork.studentId);
            const studentClass = classes.find(c => c.id === student?.classId);
            const artworkAssessments = assessments.filter(a => a.artworkId === artwork.id);

            csv += `${studentClass?.name || ''};`;
            csv += `${student?.name || ''};`;
            csv += `${artwork.title};`;
            csv += `${new Date(artwork.createdAt).toLocaleDateString('tr-TR')};`;

            // Add scores for each criterion
            artworkAssessments.forEach(a => {
                csv += `${a.score.toFixed(1)};`;
            });

            csv += `${artwork.totalScore.toFixed(1)}\n`;
        }

        this.downloadCSV(csv, 'detayli-rapor.csv');
    }

    /**
     * Download CSV file
     * @param {string} content
     * @param {string} filename
     */
    static downloadCSV(content, filename) {
        const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export default ExcelExporter;
