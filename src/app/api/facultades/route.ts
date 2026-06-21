import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const facultades = await prisma.facultad.findMany({
      include: {
        departamentos: true,
        escuelas: true,
      },
      orderBy: { codigo: 'asc' }
    });
    return NextResponse.json(facultades);
  } catch (error) {
    console.error("Error al obtener facultades:", error);
    return NextResponse.json({ error: 'Error al obtener facultades' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const facultad = await prisma.facultad.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        tipo: data.tipo,
      }
    });
    return NextResponse.json(facultad);
  } catch (error) {
    console.error("Error al crear facultad:", error);
    return NextResponse.json({ error: 'Error al crear facultad' }, { status: 500 });
  }
}
