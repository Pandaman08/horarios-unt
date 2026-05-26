import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { id_usuario: 'desc' },
      include: {
        docente: true
      }
    });
    return NextResponse.json(usuarios);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const contrasena_hash = await bcrypt.hash(data.contrasena, 10);

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Crear Usuario
      const usuario = await tx.usuario.create({
        data: {
          codigo: data.dni || data.codigo,
          dni: data.dni,
          nombres: data.nombres,
          apellidos: data.apellidos,
          correo_electronico: data.correo_electronico,
          contrasena_hash,
          rol: data.rol,
          activo: true
        }
      });

      // 2. Si el rol es docente, crear registro en tabla Docente
      if (data.rol === 'docente') {
        await tx.docente.create({
          data: {
            id_usuario: usuario.id_usuario,
            codigo_docente: `${data.nombres.charAt(0).toLowerCase()}${data.dni}`,
            nombres: data.nombres,
            apellidos: data.apellidos,
            dni: data.dni,
            correo_electronico: data.correo_electronico,
            categoria: data.categoria || 'auxiliar',
            modalidad: data.modalidad || 'contratado',
            especialidad: data.especialidad || '',
            grado_academico: data.grado_academico || '',
            fecha_ingreso: data.fecha_ingreso ? new Date(data.fecha_ingreso) : null,
            activo: true
          }
        });
      }

      return usuario;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El código o correo ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
