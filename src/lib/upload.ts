import { apiClient } from "@/lib/api-client";

interface CloudinarySignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
  eager?: string;
}

export interface MediaMetadata {
  original_url: string;
  optimized_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  file_size: number;
  duration?: number;
  resource_type: "image" | "video";
  blur_data_url?: string;
}

/**
 * Step 1 — Ask the backend to generate a signed upload signature.
 * The backend uses api_secret server-side; it is never sent to the browser.
 */
async function fetchSignature(folder: string, resourceType: string): Promise<CloudinarySignature> {
  const { data } = await apiClient.post<CloudinarySignature>(
    `/cloudinary/sign?folder=${encodeURIComponent(folder)}&resourceType=${encodeURIComponent(resourceType)}`,
  );
  return data;
}

/**
 * Upload a file directly from the browser to Cloudinary.
 *
 * Security:  api_secret never touches the frontend.
 *            The backend signs the request; the browser uploads straight to Cloudinary.
 *
 * @param file         - The File object chosen by the user
 * @param resourceType - "image" | "video"
 * @param folder       - Cloudinary sub-folder (default: "taste-tapestry")
 * @returns            - The rich MediaMetadata object
 */
export async function uploadToCloudinary(
  file: File,
  resourceType: "image" | "video" = "image",
  folder = "taste-tapestry",
): Promise<MediaMetadata> {
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

  if (resourceType === "image" && file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image exceeds the maximum allowed size of 10MB.");
  }
  if (resourceType === "video" && file.size > MAX_VIDEO_SIZE) {
    throw new Error("Video exceeds the maximum allowed size of 100MB.");
  }

  const sig = await fetchSignature(folder, resourceType);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.api_key);
  form.append("timestamp", String(sig.timestamp));
  if (sig.eager) {
    form.append("eager", sig.eager);
  }
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${resourceType}/upload`;
  const res = await fetch(cloudinaryUrl, { method: "POST", body: form });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ??
        "Cloudinary upload failed",
    );
  }

  const data = await res.json() as any;
  const originalUrl = data.secure_url;
  const uploadPathPattern = /\/upload\//;

  let optimized_url = originalUrl;
  let thumbnail_url = originalUrl;
  let blur_data_url: string | undefined = undefined;

  if (resourceType === "image") {
    optimized_url = originalUrl.replace(uploadPathPattern, "/upload/w_2048,f_auto,q_auto/");
    thumbnail_url = originalUrl.replace(uploadPathPattern, "/upload/c_fill,w_300,h_300,f_auto,q_auto/");
    blur_data_url = originalUrl.replace(uploadPathPattern, "/upload/w_50,e_blur:1000,f_auto,q_auto/");
  } else if (resourceType === "video") {
    // For video, we generate an HLS stream address (.m3u8) using streaming profiles
    const webVideoUrl = originalUrl.replace(/\.[^/.]+$/, ".m3u8");
    optimized_url = webVideoUrl.replace(uploadPathPattern, "/upload/sp_auto/");
    
    // Generate an automatic thumbnail from the video
    const thumbnailUrlRaw = originalUrl.replace(/\.[^/.]+$/, ".jpg");
    thumbnail_url = thumbnailUrlRaw.replace(uploadPathPattern, "/upload/so_auto,w_300,c_fill/");
  }

  return {
    original_url: originalUrl,
    optimized_url,
    thumbnail_url,
    width: data.width,
    height: data.height,
    file_size: data.bytes,
    duration: data.duration,
    resource_type: resourceType,
    blur_data_url,
  };
}
