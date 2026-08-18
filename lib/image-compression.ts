import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 2, // Reducir a máximo 2 MB
    maxWidthOrHeight: 1920, // Máximo 1920px de ancho/alto
    useWebWorker: true,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Image compression error:", error);
    // Si falla la compresión, devolver el archivo original
    return file;
  }
}
