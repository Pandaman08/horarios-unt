import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNumber = parseInt(id);
    const data = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar Usuario
      const usuario = await tx.usuario.update({
        where: { id_usuario: idNumber },
        data: {
          nombres: data.nombres,
          apellidos: data.apellidos,
          correo_electronico: data.correo_electronico,
          rol: data.rol,
          activo: data.activo,
          ...(data.contrasena ? { contrasena_hash: await bcrypt.hash(data.contrasena, 10) } : {})
        }
      });

      // 2. Si es docente, actualizar o crear registro de Docente
      if (data.rol === 'docente') {
        await tx.docente.upsert({
          where: { id_usuario: idNumber },
          update: {
            nombres: data.nombres,
            apellidos: data.apellidos,
            correo_electronico: data.correo_electronico,
            categoria: data.categoria,
            modalidad: data.modalidad,
            especialidad: data.especialidad,
            grado_academico: data.grado_academico,
            antiguedad: parseInt(data.antiguedad) || 0,
            activo: data.activo
          },
          create: {
            id_usuario: idNumber,
            codigo_docente: usuario.codigo,
            nombres: data.nombres,
            apellidos: data.apellidos,
            correo_electronico: data.correo_electronico,
            categoria: data.categoria || 'auxiliar',
            modalidad: data.modalidad || 'contratado',
            especialidad: data.especialidad || '',
            grado_academico: data.grado_academico || '',
            antiguedad: parseInt(data.antiguedad) || 0,
            activo: data.activo
          }
        });
      }

      return usuario;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNumber = parseInt(id);
    await prisma.usuario.delete({ where: { id_usuario: idNumber } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
