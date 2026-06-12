import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { executeQuery } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Query extra details from DB if needed, or return payload
    const userResult = await executeQuery(
      "SELECT IdUsuario, Usuario, Nombres, Activo FROM Usuarios WHERE IdUsuario = @Id",
      { Id: payload.id }
    );
    const user = userResult.recordset[0];

    if (!user || !user.Activo) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.IdUsuario,
        username: user.Usuario,
        name: user.Nombres,
        role: payload.role || "",
      },
    });
  } catch (error) {
    console.error("Error in session API:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
