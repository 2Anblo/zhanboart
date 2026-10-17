import { requireOnlineAdmin } from "@/lib/require-online-admin";
import { discardActivityUpload, startActivityUpload, writeActivityChunk } from "@/lib/online-photo-admin";

export const runtime = "nodejs";
export const maxDuration = 300;

async function handle(request: Request) {
  const unauthorized = await requireOnlineAdmin();
  if (unauthorized) return unauthorized;
  try {
    if (request.method === "POST") {
      const { name, mime, size } = await request.json();
      return Response.json({ token: startActivityUpload(String(name), String(mime), Number(size)) });
    }
    if (request.method === "DELETE") {
      const { token } = await request.json();
      await discardActivityUpload(String(token));
    } else {
      const form = await request.formData();
      const chunk = form.get("chunk");
      if (!(chunk instanceof File)) throw new Error("缺少图片分块");
      await writeActivityChunk(String(form.get("token")), Number(form.get("index")), chunk);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "上传失败，请重试" }, { status: 400 });
  }
}

export { handle as POST, handle as PUT, handle as DELETE };
