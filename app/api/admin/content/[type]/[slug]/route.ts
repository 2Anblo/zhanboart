import { requireOnlineAdmin } from "@/lib/require-online-admin";
import { isContentType } from "@/lib/content-model";
import { deleteRemoteContent, saveRemoteContent } from "@/lib/online-photo-admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ type: string; slug: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const unauthorized = await requireOnlineAdmin();
  if (unauthorized) return unauthorized;
  const { type, slug } = await context.params;
  if (!isContentType(type)) {
    return Response.json({ error: "内容类型无效" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const result = await saveRemoteContent(await request.formData(), { type, slug });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "更新内容失败" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireOnlineAdmin();
  if (unauthorized) return unauthorized;
  const { type, slug } = await context.params;
  if (!isContentType(type)) {
    return Response.json({ error: "内容类型无效" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const result = await deleteRemoteContent(type, slug);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "删除内容失败" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
