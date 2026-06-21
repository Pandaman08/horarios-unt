import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departamentoId = searchParams.get('departamentoId');
    const facultadId = searchParams.get('facultadId');

    const where: any = { activo: true };
    if (departamentoId) {
      where.departamentoId = departamentoId;
    }
    if (facultadId) {
      where.OR = [
        { departamento: { facultadId } },
        { escuela: { facultadId } }
      ];
    }

    const cursos = await prisma.curso.findMany({
      where,
      include: {
        ciclo_rel: true,
        malla_rel: true,
        escuela: true,
        departamento: true,
        docente_cursos: {
          where: { activo: true }
        },
        curso_ambientes: {
          include: {
            ambiente: true
          }
        }
      },
      orderBy: { codigo: 'asc' }
    });
    return NextResponse.json(cursos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cursos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const curso = await prisma.curso.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        maximo_docentes: parseInt(data.maximo_docentes) || 1,
        creditos: parseInt(data.creditos) || 0,
        id_ciclo: data.id_ciclo ? parseInt(data.id_ciclo) : null,
        id_malla: data.id_malla ? parseInt(data.id_malla) : null,
        tipo_curso: data.tipo_curso || "linea_carrera",
        plan_estudios: data.plan_estudios,
        prerequisitos: data.prerequisitos,
        departamento_responsable: data.departamento_responsable,
        escuelaId: data.escuelaId || null,
        departamentoId: data.departamentoId || null,
        activo: true
      }
    });
    
    return NextResponse.json(curso);
  } catch (error) {
    console.error("Error al crear curso:", error);
    return NextResponse.json({ error: 'Error al crear curso' }, { status: 500 });
  }
}
