import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facultadId = searchParams.get('facultadId');

    const where = facultadId ? { facultadId } : {};

    const escuelas = await prisma.escuelaProfesional.findMany({
      where,
      include: {
        facultad: true,
      },
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(escuelas);
  } catch (error) {
    console.error("Error al obtener escuelas:", error);
    return NextResponse.json({ error: 'Error al obtener escuelas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const escuela = await prisma.escuelaProfesional.create({
      data: {
        nombre: data.nombre,
        facultadId: data.facultadId,
      }
    });
    return NextResponse.json(escuela);
  } catch (error) {
    console.error("Error al crear escuela:", error);
    return NextResponse.json({ error: 'Error al crear escuela' }, { status: 500 });
  }
}
