import { requireOnlineAdmin } from "@/lib/require-online-admin";
import { isContentType } from "@/lib/content-model";
import { checkAdminConnection, listRemoteContent, saveRemoteContent } from "@/lib/online-photo-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = await requireOnlineAdmin();
  if (unauthorized) return unauthorized;
  try {
    const requestedType = new URL(request.url).searchParams.get("type");
    if (requestedType && !isContentType(requestedType)) {
      return Response.json({ error: "内容类型无效" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const connection = await checkAdminConnection();
    const entries = connection.github.connected
      ? await listRemoteContent(requestedType && isContentType(requestedType) ? requestedType : undefined)
      : [];
    return Response.json({ entries, connection }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "读取内容失败" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireOnlineAdmin();
  if (unauthorized) return unauthorized;
  try {
    const result = await saveRemoteContent(await request.formData());
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "保存内容失败" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
