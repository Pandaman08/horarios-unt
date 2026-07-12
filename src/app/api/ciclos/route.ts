import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const ciclos = await prisma.ciclo.findMany({
      where: { activo: true },
      orderBy: { numero: 'asc' }
    });
    return NextResponse.json(ciclos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener ciclos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const ciclo = await prisma.ciclo.create({
      data: {
        numero: parseInt(data.numero.toString()),
        nombre: data.nombre,
        activo: true
      }
    });
    return NextResponse.json(ciclo);
  } catch (error) {
    console.error("Error al crear ciclo:", error);
    return NextResponse.json({ error: 'Error al crear ciclo' }, { status: 500 });
  }
}
