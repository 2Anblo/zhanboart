import { requireOnlineAdmin } from "@/lib/require-online-admin";
import { checkRemoteConfig, createRemotePhoto, listRemotePhotos } from "@/lib/online-photo-admin";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireOnlineAdmin();
  if (unauthorized) return unauthorized;
  try {
    const [photos, connection] = await Promise.all([listRemotePhotos(), checkRemoteConfig()]);
    return Response.json({ photos, connection }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取照片失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireOnlineAdmin();
  if (unauthorized) return unauthorized;
  try {
    const form = await request.formData();
    const result = await createRemotePhoto(form);
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "上传失败" }, { status: 500 });
  }
}
