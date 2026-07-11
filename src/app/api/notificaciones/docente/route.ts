import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { correo_electronico: session.user.email }
    });

    if (!usuario?.docente) {
      return NextResponse.json({ error: 'No es un docente' }, { status: 403 });
    }

    const idDocente = usuario.docente;

    // Obtener notificaciones de la cola (pendientes) y del historial (enviadas)
    const cola = await prisma.colaNotificaciones.findMany({
      where: { id_docente: idDocente },
      orderBy: { fecha_programada: 'desc' },
      take: 20
    });

    const historial = await prisma.historialNotificaciones.findMany({
      where: { id_docente: idDocente },
      orderBy: { fecha_envio: 'desc' },
      take: 20
    });

    return NextResponse.json({
      cola: cola,
      historial: historial
    });

  } catch (error) {
    console.error('[API Notificaciones Docente] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}