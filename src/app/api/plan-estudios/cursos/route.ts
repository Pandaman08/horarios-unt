import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['administrador', 'secretaria', 'administrador_sistema', 'operador_horarios'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const data = await request.json();

    // Get prerequisite course IDs from codes
    const prerequisiteCourses = data.prerequisitos ? await prisma.curso.findMany({
      where: { codigo: { in: data.prerequisitos } },
      select: { id_curso: true }
    }) : [];

    const curso = await prisma.curso.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        maximo_docentes: parseInt(data.maximo_docentes) || 1,
        creditos: parseInt(data.creditos) || 0,
        id_ciclo: data.id_ciclo ? parseInt(data.id_ciclo) : null,
        id_malla: data.id_malla ? parseInt(data.id_malla) : null,
        departamentoId: data.departamentoId || null,
        tipo_curso: data.tipo_curso || "linea_carrera",
        horas_teoria: parseInt(data.horas_teoria) || 0,
        horas_practica: parseInt(data.horas_practica) || 0,
        horas_laboratorio: parseInt(data.horas_laboratorio) || 0,
        departamento_responsable: data.departamento_responsable,
        activo: data.activo !== undefined ? data.activo : true,
        prerequisitos_rel: {
          create: prerequisiteCourses.map((pc: { id_curso: number }) => ({
            id_prerequisito_curso: pc.id_curso
          }))
        }
      },
      include: {
        prerequisitos_rel: {
          include: { prerequisito: true }
        },
        malla_rel: true,
        departamento: true
      }
    });

    return NextResponse.json(curso);
  } catch (error) {
    console.error("Error al crear curso:", error);
    return NextResponse.json({ error: 'Error al crear curso' }, { status: 500 });
  }
}
