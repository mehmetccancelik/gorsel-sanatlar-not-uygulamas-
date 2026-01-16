// Camera utility for capturing photos
export class Camera {
    constructor() {
        this.stream = null;
        this.video = null;
    }

    /**
     * Start camera stream
     * @param {HTMLVideoElement} videoElement
     * @returns {Promise<MediaStream>}
     */
    async start(videoElement) {
        try {
            this.video = videoElement;
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Use back camera on mobile
                audio: false
            });

            this.video.srcObject = this.stream;
            await this.video.play();

            return this.stream;
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw new Error('Kameraya erişilemedi. Lütfen kamera izinlerini kontrol edin.');
        }
    }

    /**
     * Capture photo from video stream
     * @returns {Promise<Blob>} - Photo as blob
     */
    async capture() {
        if (!this.video || !this.stream) {
            throw new Error('Kamera başlatılmadı');
        }

        const canvas = document.createElement('canvas');
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;

        const context = canvas.getContext('2d');
        context.drawImage(this.video, 0, 0, canvas.width, canvas.height);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.8); // 80% quality
        });
    }

    /**
     * Stop camera stream
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.video) {
            this.video.srcObject = null;
        }
    }

    /**
     * Capture photo from file input
     * @param {File} file
     * @returns {Promise<string>} - Base64 data URL
     */
    static async captureFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;

            reader.readAsDataURL(file);
        });
    }

    /**
     * Compress image
     * @param {Blob} blob
     * @param {number} maxWidth
     * @returns {Promise<Blob>}
     */
    static async compressImage(blob, maxWidth = 1200) {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((compressedBlob) => {
                    URL.revokeObjectURL(url);
                    resolve(compressedBlob);
                }, 'image/jpeg', 0.8);
            };

            img.src = url;
        });
    }
}

export default Camera;
