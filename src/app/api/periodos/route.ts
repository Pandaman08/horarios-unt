import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // OBTENER SOLO LOS PERÍODOS ACTIVOS Y EN ESTADO CORRECTO
    const periodos = await prisma.periodoAcademico.findMany({
      where: { 
        activo: true 
      },
      orderBy: { 
        id_periodo: 'desc' 
      }
    });
    return NextResponse.json(periodos);
  } catch (error) {
    console.error('Error en GET /api/periodos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ 
      error: 'Error al obtener periodos',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    }, { status: 500 });
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
        fecha_inicio: new Date(data.fecha_inicio + 'T00:00:00'),
        fecha_fin: new Date(data.fecha_fin + 'T23:59:59'),
        fecha_inicio_clases: data.fecha_inicio_clases ? new Date(data.fecha_inicio_clases + 'T00:00:00') : null,
        fecha_fin_clases: data.fecha_fin_clases ? new Date(data.fecha_fin_clases + 'T23:59:59') : null,
        estado: data.estado || 'planificacion',
        activo: true
      }
    });
    return NextResponse.json(periodo);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear periodo' }, { status: 500 });
  }
}
