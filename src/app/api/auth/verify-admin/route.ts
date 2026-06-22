import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { RolUsuario } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Por simplicidad, buscamos el primer administrador o comparamos con una variable de entorno
    // En un sistema real, usaríamos la sesión del usuario logueado
    const admin = await prisma.usuario.findFirst({
      where: { rol: RolUsuario.administrador_sistema, activo: true }
    });

    if (!admin) {
      return NextResponse.json({ error: 'No se encontró administrador' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(password, admin.contrasena_hash);

    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 });
  }
}
