import { requireOnlineAdmin } from "@/lib/require-online-admin";
import { createSiteAsset, listSiteAssets } from "@/lib/online-photo-admin";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireOnlineAdmin();
  if (unauthorized) return unauthorized;
  try {
    return Response.json({ assets: await listSiteAssets() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取站点资源失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireOnlineAdmin();
  if (unauthorized) return unauthorized;
  try {
    const result = await createSiteAsset(await request.formData());
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "上传站点资源失败" }, { status: 500 });
  }
}
