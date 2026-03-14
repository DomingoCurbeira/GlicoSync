// src/lib/imageUtils.ts
export const convertToWebP = (file: File, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        
        // Aquí ocurre la magia: conversión a webp y ajuste de calidad
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Error al convertir a WebP'));
          },
          'image/webp',
          quality
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};
