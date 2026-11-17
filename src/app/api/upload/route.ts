import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getAdmin } from "@/auth/current-admin";
import { IMAGE_MAX_BYTES, IMAGE_TYPES, imageUploadsEnabled } from "@/lib/images";

/**
 * Issues short-lived Vercel Blob upload tokens so admins can upload topic images straight from
 * the browser (no 4.5 MB function body limit). Only signed-in admins; images only, ≤ 5 MB.
 */
export async function POST(request: Request): Promise<Response> {
  if (!imageUploadsEnabled()) {
    return Response.json({ error: "image uploads are not configured" }, { status: 503 });
  }
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        if (!(await getAdmin())) throw new Error("unauthorized");
        return {
          allowedContentTypes: [...IMAGE_TYPES],
          maximumSizeInBytes: IMAGE_MAX_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "upload failed";
    return Response.json({ error: message }, { status: message === "unauthorized" ? 401 : 400 });
  }
}
