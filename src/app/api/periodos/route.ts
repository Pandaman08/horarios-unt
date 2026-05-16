import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const periodos = await prisma.periodoAcademico.findMany({
      where: { activo: true },
      orderBy: { codigo: 'desc' }
    });
    return NextResponse.json(periodos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener periodos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const periodo = await prisma.periodoAcademico.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        anio: parseInt(data.anio),
        semestre: parseInt(data.semestre),
        fecha_inicio: new Date(data.fecha_inicio),
        fecha_fin: new Date(data.fecha_fin),
        fecha_inicio_clases: data.fecha_inicio_clases ? new Date(data.fecha_inicio_clases) : null,
        fecha_fin_clases: data.fecha_fin_clases ? new Date(data.fecha_fin_clases) : null,
        estado: data.estado || 'planificacion',
        activo: true
      }
    });
    return NextResponse.json(periodo);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear periodo' }, { status: 500 });
  }
}
