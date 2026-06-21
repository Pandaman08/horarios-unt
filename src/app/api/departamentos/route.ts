import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facultadId = searchParams.get('facultadId');

    const where = facultadId ? { facultadId } : {};

    const departamentos = await prisma.departamentoAcademico.findMany({
      where,
      include: {
        facultad: true,
      },
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(departamentos);
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    return NextResponse.json({ error: 'Error al obtener departamentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const departamento = await prisma.departamentoAcademico.create({
      data: {
        nombre: data.nombre,
        facultadId: data.facultadId,
      }
    });
    return NextResponse.json(departamento);
  } catch (error) {
    console.error("Error al crear departamento:", error);
    return NextResponse.json({ error: 'Error al crear departamento' }, { status: 500 });
  }
}
