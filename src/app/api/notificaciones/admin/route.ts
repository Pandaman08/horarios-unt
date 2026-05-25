import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ServicioNotificador } from '@/services/notificaciones/ServicioNotificador';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !['administrador_sistema', 'director_escuela', 'operador_horarios', 'coordinador_academico'].includes(session.user.rol)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'stats';

  try {
    if (type === 'stats') {
      const colaPendiente = await prisma.colaNotificaciones.count({ where: { estado: 'pendiente' } });
      const colaFallida = await prisma.colaNotificaciones.count({ where: { estado: 'fallido' } });
      const historialExito = await prisma.historialNotificaciones.count({ where: { estado_envio: 'enviado' } });
      
      const ultimasNotificaciones = await prisma.historialNotificaciones.findMany({
        take: 10,
        orderBy: { fecha_envio: 'desc' },
        include: { docente: true }
      });

      return NextResponse.json({
        stats: { colaPendiente, colaFallida, historialExito },
        recientes: ultimasNotificaciones
      });
    }

    if (type === 'cola') {
      const cola = await prisma.colaNotificaciones.findMany({
        orderBy: { fecha_programada: 'asc' },
        include: { docente: true },
        take: 50
      });
      return NextResponse.json(cola);
    }

    return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
  } catch (error) {
    console.error('Error en API Admin Notificaciones:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !['administrador_sistema'].includes(session.user.rol)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { action } = await request.json();

    if (action === 'procesar_cola') {
      await ServicioNotificador.procesarCola();
      return NextResponse.json({ message: 'Cola procesada manualmente' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error procesando acción:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
