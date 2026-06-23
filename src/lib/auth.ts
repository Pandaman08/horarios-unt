// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { iniciarCronOnce } from "@/lib/cronStarter";
import { RolUsuario } from "@prisma/client";

// Esquema de validación para login
const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Extender tipos de NextAuth para incluir rol
declare module "next-auth" {
  interface User {
    rol: RolUsuario;
    id_usuario: number;
    id_docente?: number;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      rol: RolUsuario;
      id_usuario: number;
      id_docente?: number;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Faltan credenciales");
        }

        // Validar formato
        const validation = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
        });
        if (!validation.success) {
          throw new Error("Formato de credenciales inválido");
        }

        // Buscar usuario en la base de datos
        const usuario = await prisma.usuario.findUnique({
          where: { correo_electronico: credentials.email },
          include: { docente: true }, // para obtener id_docente si existe
        });

        if (!usuario) {
          throw new Error("Usuario no encontrado");
        }

        // Verificar contraseña (asumiendo que está hasheada con bcrypt)
        const passwordValida = await bcrypt.compare(
          credentials.password,
          usuario.contrasena_hash
        );
        if (!passwordValida) {
          throw new Error("Contraseña incorrecta");
        }

        if (!usuario.activo) {
          throw new Error("Usuario desactivado");
        }

        // Actualizar último acceso
        await prisma.usuario.update({
          where: { id_usuario: usuario.id_usuario },
          data: { ultimo_acceso: new Date() },
        });

        // Iniciar servicios en segundo plano una sola vez al primer login
        iniciarCronOnce();

        // Devolver objeto de usuario para la sesión
        return {
          id: String(usuario.id_usuario),
          email: usuario.correo_electronico,
          name: `${usuario.nombres} ${usuario.apellidos}`,
          rol: usuario.rol,
          id_usuario: usuario.id_usuario,
          id_docente: usuario.docente?.id_docente,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Al iniciar sesión, agregar datos del usuario al token
      if (user) {
        token.rol = user.rol;
        token.id_usuario = user.id_usuario;
        token.id_docente = user.id_docente;
      }
      return token;
    },
    async session({ session, token }) {
      // Transferir datos del token a la sesión
      if (session.user) {
        session.user.rol = token.rol as RolUsuario;
        session.user.id_usuario = token.id_usuario as number;
        session.user.id_docente = token.id_docente as number | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login", // Redirigir a login si hay error
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};