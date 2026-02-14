import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const expected = process.env.APP_PASSWORD || "";

  if (!expected) {
    return new NextResponse("Server is missing APP_PASSWORD env var.", { status: 500 });
  }
  if (!password || password !== expected) {
    return new NextResponse("Incorrect password", { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  // Simple cookie gate (httpOnly)
  res.cookies.set("rt_auth", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
