import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const simulaciones = await prisma.integracionSimulada.findMany({
      include: { docente: true },
      orderBy: { fecha: 'desc' },
      take: 100
    });
    return NextResponse.json(simulaciones);
  } catch (error) {
    console.error('Error getting simulaciones:', error);
    return NextResponse.json({ error: 'Error al cargar simulaciones' }, { status: 500 });
  }
}
