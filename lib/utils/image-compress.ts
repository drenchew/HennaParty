import { PHOTO_COMPRESS_TARGET_BYTES } from "@/lib/constants/media-limits";

const DEFAULT_MAX_EDGE = 1920;
const DEFAULT_QUALITY = 0.82;

export class PhotoPrepareError extends Error {
  readonly code: "TOO_LARGE" | "INVALID";

  constructor(code: PhotoPrepareError["code"], message?: string) {
    super(message ?? code);
    this.name = "PhotoPrepareError";
    this.code = code;
  }
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg";
}

/**
 * Client-side image compression via canvas.
 * Resizes to fit within max edge and re-encodes as WebP (fallback JPEG).
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_EDGE;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_EDGE;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const targetMime =
    options.mimeType ??
    (typeof document !== "undefined" &&
    document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp")
      ? "image/webp"
      : "image/jpeg");

  if (!file.type.startsWith("image/")) {
    throw new PhotoPrepareError("INVALID", "Not an image file");
  }

  const bitmap = await loadImageSource(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxWidth, maxHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoPrepareError("INVALID", "Canvas not supported");

  ctx.drawImage(bitmap, 0, 0, width, height);
  if ("close" in bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }

  const blob = await canvasToBlob(canvas, targetMime, quality);
  const ext = targetMime === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";

  return new File([blob], `${baseName}.${ext}`, {
    type: targetMime,
    lastModified: Date.now(),
  });
}

/** Always compress and shrink until the photo is at most 3 MB. */
export async function preparePhotoForUpload(file: File): Promise<File> {
  let quality = DEFAULT_QUALITY;
  let maxEdge = DEFAULT_MAX_EDGE;
  let result = await compressImage(file, {
    quality,
    maxWidth: maxEdge,
    maxHeight: maxEdge,
  });

  while (result.size > PHOTO_COMPRESS_TARGET_BYTES && quality > 0.45) {
    quality -= 0.1;
    result = await compressImage(file, {
      quality,
      maxWidth: maxEdge,
      maxHeight: maxEdge,
    });
  }

  while (result.size > PHOTO_COMPRESS_TARGET_BYTES && maxEdge > 800) {
    maxEdge = Math.round(maxEdge * 0.75);
    quality = 0.72;
    result = await compressImage(file, {
      quality,
      maxWidth: maxEdge,
      maxHeight: maxEdge,
    });
  }

  if (result.size > PHOTO_COMPRESS_TARGET_BYTES) {
    throw new PhotoPrepareError("TOO_LARGE", "Photo still too large after compression");
  }

  return result;
}

async function loadImageSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall through to HTMLImageElement */
    }
  }

  return loadHtmlImage(file);
}

function loadHtmlImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new PhotoPrepareError("INVALID", "Could not decode image"));
    };
    img.src = url;
  });
}

function fitWithin(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new PhotoPrepareError("INVALID", "Compression failed"));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}
