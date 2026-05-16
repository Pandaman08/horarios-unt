import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const docentes = await prisma.docente.findMany({
      where: { activo: true },
      include: {
        docente_cursos: {
          include: {
            curso: true
          }
        }
      },
      orderBy: [
        { modalidad: 'asc' }, // nombrado < contratado (depende del orden alfabético, ajustar si es necesario)
        { categoria: 'asc' }, // principal < asociado < auxiliar < jefe_practica
        { antiguedad: 'desc' }
      ]
    });
    return NextResponse.json(docentes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener docentes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const docente = await prisma.docente.create({
      data: {
        codigo_docente: data.codigo_docente,
        nombres: data.nombres,
        apellidos: data.apellidos,
        modalidad: data.modalidad,
        categoria: data.categoria,
        dedicacion: data.dedicacion,
        antiguedad: parseInt(data.antiguedad) || 0,
        fecha_ingreso: data.fecha_ingreso ? new Date(data.fecha_ingreso) : null,
        correo_electronico: data.correo_electronico,
        telefono: data.telefono,
        grado_academico: data.grado_academico,
        especialidad: data.especialidad,
        horas_maximas_semanales: parseInt(data.horas_maximas_semanales) || 40,
        activo: true
      }
    });
    return NextResponse.json(docente);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear docente' }, { status: 500 });
  }
}
