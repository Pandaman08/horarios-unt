import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');

    if (!id_periodo) {
      return NextResponse.json(
        { error: 'id_periodo es requerido' },
        { status: 400 }
      );
    }

    // Obtener ventanas de la BD
    const ventanas = await prisma.ventanaAtencion.findMany({
      where: { id_periodo: parseInt(id_periodo), activo: true },
      orderBy: { orden_prioridad: 'asc' }
    });

    // Obtener docentes para asociar con las ventanas
    const docentes = await prisma.docente.findMany({
      where: { activo: true },
      orderBy: [
        { modalidad: 'desc' }, // Nombrado primero
        { categoria: 'desc' }, // Principal primero
        { fecha_ingreso: 'asc' } // Más viejo primero
      ]
    });

    // Asociar cada ventana con un docente
    const ventanasConDocentes = ventanas.map((ventana, index) => ({
      ...ventana,
      docente: docentes[index] || null
    }));

    return NextResponse.json({ ventanas: ventanasConDocentes });

  } catch (error: any) {
    console.error('Error al obtener ventanas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      id_periodo, 
      fecha_inicio, 
      hora_inicio_jornada, 
      hora_fin_jornada, 
      intervalo_por_docente,
      programacion_automatica 
    } = data;

    if (!id_periodo) {
      return NextResponse.json({ error: 'id_periodo es requerido' }, { status: 400 });
    }

    // Obtener docentes activos
    const docentes = await prisma.docente.findMany({
      where: { activo: true },
      orderBy: [
        { modalidad: 'desc' },
        { categoria: 'desc' },
        { fecha_ingreso: 'asc' }
      ]
    });

    if (docentes.length === 0) {
      return NextResponse.json({ error: 'No hay docentes activos' }, { status: 400 });
    }

    // Eliminar ventanas anteriores del mismo período
    await prisma.ventanaAtencion.updateMany({
      where: { id_periodo: parseInt(id_periodo) },
      data: { activo: false }
    });

    // Generar nuevas ventanas
    const fechaInicio = new Date(fecha_inicio);
    let horaActual = hora_inicio_jornada;

    const nuevasVentanas = [];

    for (let i = 0; i < docentes.length; i++) {
      const docente = docentes[i];
      
      // Calcular hora fin
      const [h, m] = horaActual.split(':').map(Number);
      const fechaHora = new Date();
      fechaHora.setHours(h, m);
      fechaHora.setMinutes(fechaHora.getMinutes() + parseInt(intervalo_por_docente || 15));
      
      const horaFin = `${String(fechaHora.getHours()).padStart(2, '0')}:${String(fechaHora.getMinutes()).padStart(2, '0')}`;

      // Crear ventana
      const ventana = await prisma.ventanaAtencion.create({
        data: {
          id_periodo: parseInt(id_periodo),
          fecha: fechaInicio,
          hora_inicio: horaActual,
          hora_fin: horaFin,
          modalidad: docente.modalidad,
          categoria: docente.categoria,
          cantidad_docentes: 1,
          completado: false,
          activo: true,
          orden_prioridad: i + 1
        }
      });

      nuevasVentanas.push({
        ...ventana,
        docente
      });

      // Actualizar hora para la próxima ventana
      horaActual = horaFin;

      // Si pasa la hora fin de jornada, pasar al siguiente día
      if (horaActual > hora_fin_jornada) {
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        horaActual = hora_inicio_jornada;
      }
    }

    return NextResponse.json({ 
      message: 'Ventanas creadas exitosamente', 
      ventanas: nuevasVentanas 
    });

  } catch (error: any) {
    console.error('Error al crear ventanas:', error);
    return NextResponse.json(
      { error: 'Error al crear ventanas', message: error.message },
      { status: 500 }
    );
  }
}
