import { apiClient } from "@/lib/api-client";

interface CloudinarySignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
}

/**
 * Step 1 — Ask the backend to generate a signed upload signature.
 * The backend uses api_secret server-side; it is never sent to the browser.
 */
async function fetchSignature(folder: string): Promise<CloudinarySignature> {
  const { data } = await apiClient.post<CloudinarySignature>(
    `/cloudinary/sign?folder=${encodeURIComponent(folder)}`,
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
 * @returns            - The Cloudinary secure_url
 */
export async function uploadToCloudinary(
  file: File,
  resourceType: "image" | "video" = "image",
  folder = "taste-tapestry",
): Promise<string> {
  // 1. Get a fresh signed token from the backend (JWT-protected).
  const sig = await fetchSignature(folder);

  // 2. Build the FormData exactly as Cloudinary expects for a signed upload.
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.api_key);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  // 3. POST directly to Cloudinary — the Next.js server is NOT involved.
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${resourceType}/upload`;
  const res = await fetch(cloudinaryUrl, { method: "POST", body: form });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ??
        "Cloudinary upload failed",
    );
  }

  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}
