import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function restarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number);
  let totalMinutos = h * 60 + m - minutos;
  if (totalMinutos < 0) totalMinutos = 0;
  const newH = Math.floor(totalMinutos / 60);
  const newM = totalMinutos % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRol = session.user.rol;
    if (!['secretaria', 'administrador_sistema', 'operador_horarios'].includes(userRol)) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    const { id_periodo } = await request.json();
    if (!id_periodo) {
      return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });
    }

    const periodoId = parseInt(id_periodo);

    const ventanas = await prisma.ventanaAtencion.findMany({
      where: { id_periodo: periodoId, activo: true, completado: false },
      orderBy: { orden_prioridad: 'asc' }
    });

    if (ventanas.length === 0) {
      return NextResponse.json({ error: 'No hay ventanas activas' }, { status: 404 });
    }

    const currentVentana = ventanas[0];

    await prisma.ventanaAtencion.update({
      where: { id_ventana: currentVentana.id_ventana },
      data: { completado: true }
    });

    const intervalo = currentVentana.intervalo_minutos || 15;

    const ventanasActualizadas = [];
    for (const ventana of ventanas.slice(1)) {
      const newInicio = restarMinutos(ventana.hora_inicio, intervalo);
      const newFin = restarMinutos(ventana.hora_fin, intervalo);
      const updated = await prisma.ventanaAtencion.update({
        where: { id_ventana: ventana.id_ventana },
        data: { hora_inicio: newInicio, hora_fin: newFin }
      });
      ventanasActualizadas.push({
        id_ventana: updated.id_ventana,
        orden_prioridad: updated.orden_prioridad,
        hora_inicio: updated.hora_inicio,
        hora_fin: updated.hora_fin,
      });
    }

    return NextResponse.json({
      success: true,
      ventanaCompletada: {
        id_ventana: currentVentana.id_ventana,
        hora_inicio: currentVentana.hora_inicio,
        hora_fin: currentVentana.hora_fin,
      },
      ventanasActualizadas,
    });
  } catch (error) {
    console.error('Error en saltar-intervalo:', error);
    return NextResponse.json({ error: 'Error al saltar intervalo' }, { status: 500 });
  }
}
