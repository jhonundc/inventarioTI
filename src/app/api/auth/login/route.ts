import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { comparePassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario en la base de datos
    const userResult = await executeQuery(
      `SELECT u.*, r.NombreRol 
       FROM Usuarios u 
       INNER JOIN Roles r ON u.IdRol = r.IdRol 
       WHERE u.Usuario = @Usuario`,
      { Usuario: username }
    );
    const user = userResult.recordset[0];

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.Clave);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Verificar si el usuario está activo
    if (!user.Activo) {
      return NextResponse.json(
        { error: "Usuario inactivo" },
        { status: 403 }
      );
    }

    // Generar token
    const token = await signToken({
      id: user.IdUsuario,
      username: user.Usuario,
      role: user.NombreRol,
    });

    // Crear respuesta y setear cookie
    const response = NextResponse.json(
      { success: true, message: "Login exitoso" },
      { status: 200 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 horas
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

