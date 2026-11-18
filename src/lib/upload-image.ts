import { upload } from "@vercel/blob/client";

/** Uploads one admin-picked image straight from the browser to the public Blob store. */
export async function uploadImage(file: File): Promise<string> {
  const blob = await upload(`faq/${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
  });
  return blob.url;
}
