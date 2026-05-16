import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GestorVentanasAtencion } from '@/services/ventanas/GestorVentanasAtencion';
import { ServicioNotificador } from '@/services/notificaciones/ServicioNotificador';

export async function GET(request: Request) {
  // ... (sin cambios)
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Si se solicita programación automática
    if (data.programacion_automatica) {
      const ventanas = await GestorVentanasAtencion.programarVentanasAutomaticas({
        id_periodo: parseInt(data.id_periodo),
        fecha_inicio: new Date(data.fecha_inicio),
        hora_inicio_jornada: data.hora_inicio_jornada || "08:00",
        hora_fin_jornada: data.hora_fin_jornada || "18:00",
        intervalo_por_docente: parseInt(data.intervalo_por_docente) || 15
      });

      // Programar notificaciones para cada ventana creada
      for (const v of ventanas) {
        await ServicioNotificador.programarNotificacionesVentana(v.id_ventana);
      }

      return NextResponse.json({ message: 'Ventanas programadas y notificaciones en cola', count: ventanas.length });
    }

    const ventana = await prisma.ventanaAtencion.create({
      data: {
        id_periodo: parseInt(data.id_periodo),
        fecha: new Date(data.fecha),
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
    await ServicioNotificador.programarNotificacionesVentana(ventana.id_ventana);

    return NextResponse.json(ventana);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
