import { cookies } from "next/headers";
import { ADMIN_COOKIE, createAdminSession, isValidAdminSession, verifyAdminPassword } from "@/lib/online-photo-admin";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  return Response.json({ authenticated: isValidAdminSession(cookieStore.get(ADMIN_COOKIE)?.value) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { password?: string };
    if (!verifyAdminPassword(String(payload.password || ""))) {
      return Response.json({ error: "密码不正确" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const response = Response.json({ authenticated: true }, { headers: { "Cache-Control": "no-store" } });
    response.headers.append("Set-Cookie", `${ADMIN_COOKIE}=${createAdminSession()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    return response;
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "登录失败" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = Response.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
  response.headers.append("Set-Cookie", `${ADMIN_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return response;
}
