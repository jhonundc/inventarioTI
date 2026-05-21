import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");

  // Si es una ruta de API de auth, permitir siempre
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Si no hay token y no está en la página de login, redirigir a login
  if (!token && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si hay token, verificarlo
  if (token) {
    const payload = await verifyToken(token);

    // Si el token no es válido y no está en login, redirigir a login
    if (!payload && !isAuthPage) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }

    // Si el token es válido y está en login, redirigir a dashboard (home)
    if (payload && isAuthPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// Configurar las rutas que deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> Except /api/auth which is handled inside
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
