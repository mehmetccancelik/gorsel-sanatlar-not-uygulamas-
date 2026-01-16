// Storage utility for managing photos (base64 for now, can be upgraded to Firebase Storage)
export class Storage {
    /**
     * Save photo to storage
     * @param {Blob} blob - Photo blob
     * @param {string} artworkId - Associated artwork ID
     * @returns {Promise<string>} - Photo URL (base64 data URL)
     */
    static async savePhoto(blob, artworkId) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const dataUrl = e.target.result;
                // For now, store as base64. In production, upload to Firebase Storage
                resolve(dataUrl);
            };

            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Delete photo from storage
     * @param {string} photoUrl
     * @returns {Promise<void>}
     */
    static async deletePhoto(photoUrl) {
        // For base64, nothing to delete
        // In production with Firebase Storage, delete from cloud
        return Promise.resolve();
    }

    /**
     * Get photo URL
     * @param {string} photoUrl
     * @returns {string}
     */
    static getPhotoUrl(photoUrl) {
        return photoUrl; // Already a data URL
    }
}

export default Storage;
