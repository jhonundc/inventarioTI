import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Sesión cerrada" },
    { status: 200 }
  );

  // Eliminar la cookie
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // Expira inmediatamente
    path: "/",
  });

  return response;
}
