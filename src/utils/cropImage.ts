/**
 * Utility to crop an image using canvas and return a Blob.
 */
export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export default function getCroppedImg(imageSrc: string, cropArea: CropArea): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const size = 256; // output 256x256
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context unavailable'));

            ctx.drawImage(
                image,
                cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                0, 0, size, size
            );

            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas toBlob failed'));
                },
                'image/jpeg',
                0.9
            );
        };
        image.onerror = reject;
        image.src = imageSrc;
    });
}
