import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departamentoId = searchParams.get('departamentoId');

    const where: any = {};
    if (departamentoId) {
      where.departamentoId = departamentoId;
    }

    const personalApoyo = await prisma.personalApoyo.findMany({
      where,
      include: { departamento: true },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(personalApoyo);
  } catch (error) {
    console.error('Error al obtener personal de apoyo:', error);
    return NextResponse.json({ error: 'Error al obtener personal de apoyo' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const personalApoyo = await prisma.personalApoyo.create({
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        modalidad: data.modalidad,
        departamentoId: data.departamentoId || null,
      },
    });

    return NextResponse.json(personalApoyo);
  } catch (error) {
    console.error('Error al crear personal de apoyo:', error);
    return NextResponse.json({ error: 'Error al crear personal de apoyo' }, { status: 500 });
  }
}
