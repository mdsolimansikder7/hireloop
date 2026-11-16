export interface ImgbbUploadResult {
  url: string;
  displayUrl: string;
  deleteUrl?: string;
}

export async function uploadImageToImgbb(file: File): Promise<ImgbbUploadResult> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_IMGBB_API_KEY. Add it to your frontend environment.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      body: formData,
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        success?: boolean;
        data?: { url?: string; display_url?: string; delete_url?: string };
        error?: { message?: string };
      }
    | null;

  if (!response.ok || !payload?.success || !payload.data?.url) {
    const message =
      payload?.error?.message ||
      `Image upload failed${response.status ? ` (${response.status})` : ""}.`;
    throw new Error(message);
  }

  return {
    url: payload.data.url,
    displayUrl: payload.data.display_url ?? payload.data.url,
    deleteUrl: payload.data.delete_url,
  };
}