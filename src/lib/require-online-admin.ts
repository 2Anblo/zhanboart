import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/online-photo-admin";

export async function requireOnlineAdmin(): Promise<Response | null> {
  const cookieStore = await cookies();
  if (isValidAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) return null;
  return Response.json({ error: "请先登录" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}
