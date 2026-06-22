import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ValidadorHorario } from '@/services/horarios/ValidadorHorario';
import { GestorSeleccionTemporal } from '@/services/horarios/GestorSeleccionTemporal';
import { obtenerMensajeErrorValidacion } from '@/lib/horarios/mensajesValidacion';

function respuestaRechazo(validacion: Awaited<ReturnType<typeof ValidadorHorario.validarAsignacion>>) {
  return NextResponse.json(
    {
      ...validacion,
      error: obtenerMensajeErrorValidacion(validacion),
    },
    { status: 400 }
  );
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 1. Validar (Mapear snake_case a camelCase para el ValidadorHorario)
    const validacion = await ValidadorHorario.validarAsignacion({
      docenteId: parseInt(data.id_docente),
      cursoId: parseInt(data.id_curso),
      grupoId: parseInt(data.id_grupo),
      tipoClase: data.tipo_clase,
      ambienteId: parseInt(data.id_ambiente),
      diaSemana: parseInt(data.dia_semana),
      horaInicio: data.hora_inicio,
      horaFin: data.hora_fin,
      periodoId: parseInt(data.id_periodo),
    });

    if (!validacion.valido) {
      // Si el error es un CRUCE_DOCENTE con el mismo docente, podemos permitir el "reemplazo"
      const cruceConmigo = validacion.conflictos.find(c => 
        c.tipo === 'CRUCE_DOCENTE' && 
        (c.detalle?.id_seleccion || c.detalle?.id_asignacion)
      );

      if (cruceConmigo) {
        // Procederemos a eliminar el anterior antes de crear el nuevo
        if (cruceConmigo.detalle?.id_asignacion) {
          await prisma.horarioAsignado.delete({ where: { id_asignacion: cruceConmigo.detalle.id_asignacion } });
        } else if (cruceConmigo.detalle?.id_seleccion) {
          await GestorSeleccionTemporal.eliminarSeleccion(cruceConmigo.detalle.id_seleccion);
        }
      } else {
        return respuestaRechazo(validacion);
      }
    }

    // 2. Crear selección temporal (Permite edición antes de confirmar)
    const seleccion = await GestorSeleccionTemporal.crearSeleccion({
      ...data,
      id_docente: parseInt(data.id_docente),
      id_curso: parseInt(data.id_curso),
      id_grupo: parseInt(data.id_grupo),
      id_ambiente: parseInt(data.id_ambiente),
      id_periodo: parseInt(data.id_periodo),
      dia_semana: parseInt(data.dia_semana),
      sesion_id: `sesion-${data.id_docente}-${data.id_periodo}`
    });

    return NextResponse.json({ valido: true, seleccion });
  } catch (error: any) {
    console.error('Error en seleccionar-celda:', error);
    return NextResponse.json({ 
      valido: false, 
      error: error.message || 'Error al seleccionar celda',
      conflictos: [{
        tipo: 'ERROR_SISTEMA',
        mensaje: error.message || 'Error interno del servidor',
        severidad: 'ERROR'
      }]
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_asignacion = searchParams.get('id_asignacion');
    const id_seleccion = searchParams.get('id_seleccion');

    if (id_asignacion) {
      await prisma.horarioAsignado.delete({
        where: { id_asignacion: parseInt(id_asignacion) }
      });
    } else if (id_seleccion) {
      await GestorSeleccionTemporal.eliminarSeleccion(parseInt(id_seleccion));
    } else {
      return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error en eliminar-asignacion:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
