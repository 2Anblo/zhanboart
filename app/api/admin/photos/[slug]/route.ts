import { requireOnlineAdmin } from "@/lib/require-online-admin";
import { deleteRemotePhoto } from "@/lib/online-photo-admin";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireOnlineAdmin();
  if (unauthorized) return unauthorized;
  const { slug } = await context.params;
  if (!/^[a-z0-9-]+$/.test(slug)) return Response.json({ error: "照片标识无效" }, { status: 400 });
  try {
    await deleteRemotePhoto(slug);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "删除失败" }, { status: 500 });
  }
}
