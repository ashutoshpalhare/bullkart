import { supabase } from "@/integrations/supabase/client";

export const BUCKETS = {
  productImages: "product-images",
  sellerMedia: "seller-media",
  avatars: "avatars",
  reviewImages: "review-images",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const SIGNED_URL_TTL = 60 * 60; // 1 hour

export type UploadResult = { path: string; signedUrl: string };

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type === "image/png" ? "png" : "jpg";
}

/**
 * Validates and uploads an image, returning its storage path plus a signed URL.
 * Buckets are private, so always persist the *path* and sign on read.
 */
export async function uploadImage(
  bucket: BucketName,
  file: File,
  folder: string,
): Promise<UploadResult> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, WEBP or AVIF image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Images need to be smaller than 5 MB.");
  }
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "");
  const path = `${safeFolder}/${crypto.randomUUID()}.${extensionFor(file)}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw error;

  return { path, signedUrl: await signedUrl(bucket, path) };
}

export async function signedUrl(bucket: BucketName, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) throw error;
  return data.signedUrl;
}

export async function signedUrls(bucket: BucketName, paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, SIGNED_URL_TTL);
  if (error) throw error;
  return Object.fromEntries(
    (data ?? []).flatMap((entry) => (entry.signedUrl && entry.path ? [[entry.path, entry.signedUrl]] : [])),
  );
}

export async function removeImage(bucket: BucketName, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/** Absolute http(s) URLs pass through; storage paths get signed on demand. */
export function isStoragePath(value: string): boolean {
  return !/^https?:\/\//i.test(value) && !value.startsWith("data:");
}
