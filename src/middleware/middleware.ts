// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/auth/login", "/api/auth"];

// Mapa de roles permitidos por ruta (opcional)
const rolePermissions: Record<string, string[]> = {
  "/dashboard/horarios/seleccion": ["docente"],
  "/dashboard/horarios/asignacion": ["operador_horarios", "administrador_sistema"],
  "/dashboard/docentes": ["administrador_sistema", "director_escuela"],
  "/dashboard/periodos": ["administrador_sistema", "coordinador_academico"],
  "/dashboard/ventanas": ["administrador_sistema", "coordinador_academico", "operador_horarios"],
  "/dashboard/reportes": ["administrador_sistema", "director_escuela", "coordinador_academico", "operador_horarios"],
  "/dashboard/configuracion": ["administrador_sistema"],
  "/dashboard": ["administrador_sistema", "operador_horarios", "docente", "director_escuela", "coordinador_academico"],
};

export default withAuth(
  function middleware(req: NextRequest & { nextauth?: { token?: any } }) {
    const token = req.nextauth?.token as any;
    const pathname = req.nextUrl.pathname;

    // Si no hay token y la ruta no es pública, redirigir a login
    if (!token && !publicRoutes.some(route => pathname.startsWith(route))) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar permisos por rol si la ruta está restringida
    for (const [route, allowedRoles] of Object.entries(rolePermissions)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(token?.rol)) {
          // Redirigir a dashboard o mostrar página de no autorizado
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        break;
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Permitir acceso a rutas públicas siempre
        return !!token;
      },
    },
  }
);

// Configurar rutas en las que se ejecutará el middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
    "/auth/:path*",
  ],
};