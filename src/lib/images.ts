/** Topic image uploads (Vercel Blob, public store). */
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** On when the project is connected to a Blob store (token or OIDC store id). */
export function imageUploadsEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}
