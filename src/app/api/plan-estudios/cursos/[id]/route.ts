import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['administrador', 'secretaria', 'administrador_sistema', 'operador_horarios'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const data = await request.json();

    // Get prerequisite course IDs from codes
    const prerequisiteCourses = data.prerequisitos ? await prisma.curso.findMany({
      where: { codigo: { in: data.prerequisitos } },
      select: { id_curso: true }
    }) : [];

    const curso = await prisma.$transaction(async (tx: Parameters<typeof prisma.$transaction>[0]) => {
      // Update course
      const updatedCurso = await (tx as typeof prisma).curso.update({
        where: { id_curso: id },
        data: {
          codigo: data.codigo,
          nombre: data.nombre,
          maximo_docentes: parseInt(data.maximo_docentes) || 1,
          creditos: parseInt(data.creditos) || 0,
          id_ciclo: data.id_ciclo ? parseInt(data.id_ciclo) : null,
          tipo_curso: data.tipo_curso || "linea_carrera",
          horas_teoria: parseInt(data.horas_teoria) || 0,
          horas_practica: parseInt(data.horas_practica) || 0,
          horas_laboratorio: parseInt(data.horas_laboratorio) || 0,
          activo: data.activo !== undefined ? data.activo : true
        }
      });

      // Delete old prerequisites
      await (tx as typeof prisma).prerequisito.deleteMany({
        where: { id_curso: id }
      });

      // Create new prerequisites
      if (prerequisiteCourses.length > 0) {
        await (tx as typeof prisma).prerequisito.createMany({
          data: prerequisiteCourses.map((pc: { id_curso: number }) => ({
            id_curso: id,
            id_prerequisito_curso: pc.id_curso
          }))
        });
      }

      // Return updated course with prerequisites
      return (tx as typeof prisma).curso.findUnique({
        where: { id_curso: id },
        include: {
          prerequisitos_rel: {
            include: { prerequisito: true }
          }
        }
      });
    });

    return NextResponse.json(curso);
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    return NextResponse.json({ error: 'Error al actualizar curso' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['administrador', 'secretaria', 'administrador_sistema', 'operador_horarios'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    // Check if course is a prerequisite for other courses
    const dependencies = await prisma.prerequisito.findMany({
      where: { id_prerequisito_curso: id },
      include: {
        curso: {
          select: {
            id_curso: true,
            codigo: true,
            nombre: true
          }
        }
      }
    });

    if (dependencies.length > 0) {
      return NextResponse.json({
        error: 'No se puede eliminar el curso porque es prerequisito de otros cursos.',
        dependencias: dependencies.map((d: { curso: { codigo: string; nombre: string } }) => ({
          codigo: d.curso.codigo,
          nombre: d.curso.nombre
        }))
      }, { status: 409 });
    }

    // Delete the course and its prerequisites
    await prisma.$transaction(async (tx: Parameters<typeof prisma.$transaction>[0]) => {
      // Delete prerequisites where this course is the one requiring them
      await (tx as typeof prisma).prerequisito.deleteMany({
        where: { id_curso: id }
      });

      // Delete the course
      await (tx as typeof prisma).curso.delete({
        where: { id_curso: id }
      });
    });

    return NextResponse.json({ message: 'Curso eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    return NextResponse.json({ error: 'Error al eliminar curso' }, { status: 500 });
  }
}
