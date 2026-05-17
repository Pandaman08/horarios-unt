import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GestorVentanasAtencion } from '@/services/ventanas/GestorVentanasAtencion';
import { ServicioNotificador } from '@/services/notificaciones/ServicioNotificador';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id_periodo = searchParams.get('id_periodo');
  const stats = searchParams.get('stats');

  try {
    if (stats === 'true') {
      const estadisticas = await GestorVentanasAtencion.obtenerEstadisticasDocentes();
      return NextResponse.json(estadisticas);
    }

    if (!id_periodo || isNaN(parseInt(id_periodo))) {
      // Si no hay periodo o es inválido, devolvemos una lista vacía
      return NextResponse.json([]);
    }

    const ventanas = await prisma.ventanaAtencion.findMany({
      where: {
        id_periodo: parseInt(id_periodo),
        activo: true
      },
      orderBy: [
        { fecha: 'asc' },
        { hora_inicio: 'asc' }
      ]
    });

    return NextResponse.json(ventanas);
  } catch (error) {
    console.error('Error en GET /api/ventanas:', error);
    return NextResponse.json({ error: 'Error al obtener ventanas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Si se solicita programación automática
    if (data.programacion_automatica) {
      // Ajustar fecha de inicio para evitar desfase
      const fechaInicio = new Date(data.fecha_inicio + 'T12:00:00Z');
      
      const ventanas = await GestorVentanasAtencion.programarVentanasAutomaticas({
        id_periodo: parseInt(data.id_periodo),
        fecha_inicio: fechaInicio,
        hora_inicio_jornada: data.hora_inicio_jornada || "08:00",
        hora_fin_jornada: data.hora_fin_jornada || "18:00",
        intervalo_por_docente: parseInt(data.intervalo_por_docente) || 15
      });

      // Programar notificaciones para cada ventana creada
      for (const v of ventanas) {
        try {
          await ServicioNotificador.programarNotificacionesVentana(v.id_ventana);
        } catch (notifError) {
          console.error(`Error al programar notificaciones para ventana ${v.id_ventana}:`, notifError);
          // Continuamos con la siguiente ventana aunque falle la notificación
        }
      }

      return NextResponse.json({ message: 'Ventanas programadas correctamente', count: ventanas.length });
    }

    const ventana = await prisma.ventanaAtencion.create({
      data: {
        id_periodo: parseInt(data.id_periodo),
        fecha: new Date(data.fecha + 'T12:00:00Z'), // Forzar mediodía UTC para evitar desfase de zona horaria
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        modalidad: data.modalidad,
        categoria: data.categoria,
        orden_prioridad: parseInt(data.orden_prioridad) || 1,
        intervalo_minutos: parseInt(data.intervalo_minutos) || 15,
        activo: true
      }
    });

    // Programar notificaciones para la ventana manual
    try {
      await ServicioNotificador.programarNotificacionesVentana(ventana.id_ventana);
    } catch (notifError) {
      console.error(`Error al programar notificaciones para ventana manual:`, notifError);
    }

    return NextResponse.json(ventana);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
