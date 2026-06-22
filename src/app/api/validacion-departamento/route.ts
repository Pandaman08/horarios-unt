import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idPeriodo = parseInt(searchParams.get('idPeriodo') || '0');
  if (!idPeriodo) {
    return NextResponse.json({ error: 'Falta idPeriodo' }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: session.user.id_usuario },
    include: { docente: { select: { departamentoId: true } } }
  });

  const departamentoId = usuario?.docente?.departamentoId;
  if (!departamentoId) {
    return NextResponse.json({ error: 'No tiene departamento asignado' }, { status: 400 });
  }

  const declaraciones = await prisma.declaracionHoraria.findMany({
    where: {
      id_periodo: idPeriodo,
      estado: 'ENVIADO',
      docente: { departamentoId }
    },
    include: {
      docente: {
        include: { departamento: true }
      },
      periodo: true,
      cargas_lectivas: {
        include: { curso: true }
      },
      cargas_no_lectivas: true
    },
    orderBy: { fecha_envio: 'desc' }
  });

  return NextResponse.json(declaraciones);
}
