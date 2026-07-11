import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facultadId = searchParams.get('facultadId');
    const departamentoId = searchParams.get('departamentoId');

    const where: any = { activo: true };
    if (departamentoId) {
      const depto = await prisma.departamentoAcademico.findUnique({
        where: { id: departamentoId },
        select: { id: true, facultadId: true },
      });
      if (depto) {
        where.OR = [
          { departamentoId },
          { facultadId: depto.facultadId },
        ];
      } else {
        where.departamentoId = departamentoId;
      }
    } else if (facultadId) {
      where.facultadId = facultadId;
    }

    const ambientes = await prisma.ambiente.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: { facultad: true, departamento: true }
    });
    return NextResponse.json(ambientes);
  } catch (error) {
    console.error('Error al obtener ambientes:', error);
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
        activo: true,
        facultadId: data.facultadId || null,
        departamentoId: data.departamentoId || null
      }
    });
    return NextResponse.json(ambiente);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear ambiente' }, { status: 500 });
  }
}
