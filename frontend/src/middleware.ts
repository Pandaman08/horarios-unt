// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Mapa de roles permitidos por ruta
const rolePermissions: Record<string, string[]> = {
  "/dashboard/horarios/seleccion": ["docente"],
  "/dashboard/horarios/asignacion": ["operador_horarios", "administrador_sistema"],
  "/dashboard/docentes": ["administrador_sistema", "director_escuela"],
  "/dashboard/periodos": ["administrador_sistema", "coordinador_academico"],
  "/dashboard/ventanas": ["administrador_sistema", "coordinador_academico", "operador_horarios"],
  "/dashboard/reportes": ["administrador_sistema", "director_escuela", "coordinador_academico", "operador_horarios"],
  "/dashboard/configuracion": ["administrador_sistema"],
  "/dashboard/notificaciones": ["administrador_sistema", "operador_horarios", "director_escuela", "coordinador_academico", "docente"],
  "/dashboard": ["administrador_sistema", "operador_horarios", "docente", "director_escuela", "coordinador_academico"],
};

export default withAuth(
  function middleware(req: NextRequest & { nextauth?: { token?: any } }) {
    const token = req.nextauth?.token as any;
    const pathname = req.nextUrl.pathname;

    // Permitir rutas de auth y login sin redirección
    if (pathname.startsWith("/api/auth") || pathname.startsWith("/auth/login")) {
      return NextResponse.next();
    }

    // Si no hay token y la ruta no es login, redirigir a login
    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar permisos por rol
    for (const [route, allowedRoles] of Object.entries(rolePermissions)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(token?.rol)) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        break;
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acceso a rutas de NextAuth sin token
        const pathname = req.nextUrl.pathname;
        if (pathname.startsWith("/api/auth") || pathname.startsWith("/auth/login")) {
          return true;
        }
        // Para el resto, requerir token
        return !!token;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

// Configurar rutas (solo aplicar a dashboard y APIs protegidas)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/ciclos/:path*",
    "/api/cursos/:path*",
    "/api/docentes/:path*",
    "/api/grupos/:path*",
    "/api/horarios/:path*",
    "/api/notificaciones/admin/:path*",
    "/api/periodos/:path*",
    "/api/reportes/:path*",
    "/api/usuarios/:path*",
    "/api/ventanas/:path*",
  ],
};
