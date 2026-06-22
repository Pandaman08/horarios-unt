import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cargos = await prisma.cargoAcademicoAdministrativo.findMany({
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(cargos);
  } catch (error) {
    console.error('Error al obtener cargos:', error);
    return NextResponse.json({ error: 'Error al obtener cargos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.roles?.includes('ADMINISTRADOR_SISTEMA')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const cargo = await prisma.cargoAcademicoAdministrativo.create({
      data: {
        nombre: data.nombre,
        chlm: parseInt(data.chlm),
        chnlpe: parseInt(data.chnlpe),
        chnla: parseInt(data.chnla),
      }
    });
    return NextResponse.json(cargo);
  } catch (error) {
    console.error('Error al crear cargo:', error);
    return NextResponse.json({ error: 'Error al crear cargo' }, { status: 500 });
  }
}
