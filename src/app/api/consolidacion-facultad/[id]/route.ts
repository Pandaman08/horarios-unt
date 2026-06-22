import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;
  const idNum = parseInt(id);
  const { accion, observaciones } = await request.json();

  try {
    if (accion === 'aprobar') {
      const declaracion = await prisma.declaracionHoraria.update({
        where: { id_declaracion: idNum },
        data: {
          estado: 'APROBADO',
          fecha_aprobacion: new Date()
        }
      });
      return NextResponse.json(declaracion);
    } else if (accion === 'rechazar') {
      const declaracion = await prisma.declaracionHoraria.update({
        where: { id_declaracion: idNum },
        data: {
          estado: 'RECHAZADO',
          etapaRechazo: 'FACULTAD',
          observaciones
        }
      });
      return NextResponse.json(declaracion);
    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al actualizar la declaración' }, { status: 500 });
  }
}
