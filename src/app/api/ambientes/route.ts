import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const ambientes = await prisma.ambiente.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(ambientes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener ambientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const ambiente = await prisma.ambiente.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        tipo: data.tipo,
        capacidad: parseInt(data.capacidad),
        piso: data.piso,
        pabellon: data.pabellon,
        equipamiento: data.equipamiento,
        caracteristicas: data.caracteristicas || {},
        activo: true
      }
    });
    return NextResponse.json(ambiente);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear ambiente' }, { status: 500 });
  }
}
