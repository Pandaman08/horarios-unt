import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const docente = await prisma.docente.findUnique({
      where: { id_docente: id },
      include: {
        docente_cursos: {
          include: {
            curso: true
          }
        }
      }
    });
    if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
    return NextResponse.json(docente);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener docente' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const data = await request.json();

    // Iniciar transacción para actualizar Docente y Usuario
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Obtener docente actual para encontrar su usuario
      const docenteActual = await tx.docente.findUnique({
        where: { id_docente: id },
        select: { id_usuario: true }
      });

      if (!docenteActual) throw new Error("Docente no encontrado");

      // 2. Actualizar el Usuario si existe
      if (docenteActual.id_usuario) {
        const userData: any = {
          nombres: data.nombres,
          apellidos: data.apellidos,
          correo_electronico: data.correo_electronico,
          activo: data.activo
        };

        // Si se envió una nueva contraseña, hashearla
        if (data.nueva_contrasena) {
          userData.contrasena_hash = await bcrypt.hash(data.nueva_contrasena, 10);
        }

        await tx.usuario.update({
          where: { id_usuario: docenteActual.id_usuario },
          data: userData
        });
      }

      // 3. Actualizar el Docente
      const docente = await tx.docente.update({
        where: { id_docente: id },
        data: {
          nombres: data.nombres,
          apellidos: data.apellidos,
          modalidad: data.modalidad,
          categoria: data.categoria,
          dedicacion: data.dedicacion,
          fecha_ingreso: data.fecha_ingreso ? new Date(data.fecha_ingreso) : null,
          correo_electronico: data.correo_electronico,
          telefono: data.telefono,
          grado_academico: data.grado_academico,
          especialidad: data.especialidad,
          horas_maximas_semanales: parseInt(data.horas_maximas_semanales) || 40,
          activo: data.activo
        }
      });

      return docente;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Error al actualizar docente' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    // Verificar dependencias antes de eliminar
    const [cursos, asignaciones, selecciones, disponibilidad] = await Promise.all([
      prisma.docenteCurso.count({ where: { id_docente: id } }),
      prisma.horarioAsignado.count({ where: { id_docente: id } }),
      prisma.seleccionTemporalHorario.count({ where: { id_docente: id } }),
      prisma.disponibilidadDocente.count({ where: { id_docente: id } })
    ]);

    if (cursos > 0 || asignaciones > 0 || selecciones > 0 || disponibilidad > 0) {
      let mensaje = "No se puede eliminar el docente porque tiene dependencias:";
      if (cursos > 0) mensaje += ` ${cursos} cursos asignados.`;
      if (asignaciones > 0) mensaje += ` ${asignaciones} horarios asignados.`;
      if (selecciones > 0) mensaje += ` ${selecciones} selecciones temporales.`;
      if (disponibilidad > 0) mensaje += ` ${disponibilidad} registros de disponibilidad.`;
      
      return NextResponse.json({ error: mensaje }, { status: 400 });
    }

    // Soft delete
    await prisma.docente.update({
      where: { id_docente: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Docente eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar docente' }, { status: 500 });
  }
}
