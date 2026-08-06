import { requireOnlineAdmin } from "@/lib/require-online-admin";
import { deleteSiteAsset } from "@/lib/online-photo-admin";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const unauthorized = await requireOnlineAdmin();
  if (unauthorized) return unauthorized;
  const { path } = await context.params;
  try {
    await deleteSiteAsset(path.join("/"));
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "删除站点资源失败" }, { status: 500 });
  }
}
