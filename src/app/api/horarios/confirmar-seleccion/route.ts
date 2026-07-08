import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GestorSeleccionTemporal } from '@/services/horarios/GestorSeleccionTemporal';
import { ServicioNotificador } from '@/services/notificaciones/ServicioNotificador';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id_periodo, id_docente, solo_lectiva } = await request.json();
    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    let targetDocenteId: number;
    const userRol = session.user.rol;
    const isOperador = ['administrador_sistema', 'operador_horarios', 'director_escuela', 'coordinador_academico', 'secretaria'].includes(userRol);

    if (id_docente && isOperador) {
      targetDocenteId = Number(id_docente);
    } else {
      const docente = await prisma.docente.findFirst({
        where: { id_usuario: Number(session.user.id_usuario) }
      });
      if (!docente) return NextResponse.json({ error: 'Perfil de docente no encontrado' }, { status: 404 });
      targetDocenteId = docente.id_docente;
    }

    // Confirmar horarios temporales
    const asignaciones = await GestorSeleccionTemporal.confirmarTodo(
      targetDocenteId,
      Number(id_periodo),
      Number(session.user.id_usuario)
    );

    // === NUEVO: Actualizar o crear declaración con estado LECTIVA_CONFIRMADA ===
    const declaracionExistente = await prisma.declaracionHoraria.findUnique({
      where: {
        id_docente_id_periodo: {
          id_docente: targetDocenteId,
          id_periodo: Number(id_periodo)
        }
      }
    });

    const docente = await prisma.docente.findUnique({
      where: { id_docente: targetDocenteId }
    });

    if (!docente) {
      return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
    }

    // Obtener o crear declaración
    let declaracion = declaracionExistente;

    if (!declaracion) {
      // Crear declaración con estado LECTIVA_CONFIRMADA
      const horasDedicacion = docente.regimenDedicacion === 'DE' || docente.regimenDedicacion === 'TC' ? 40 :
                             docente.regimenDedicacion === 'TP1' ? 20 :
                             docente.regimenDedicacion === 'TP2' ? 10 :
                             docente.regimenDedicacion === 'TP3' ? 8 : 0;

      declaracion = await prisma.declaracionHoraria.create({
        data: {
          id_docente: targetDocenteId,
          id_periodo: Number(id_periodo),
          ibm: docente.codigo_docente || '',
          condicion: docente.condicion || '',
          categoria: docente.categoriaDocente || '',
          dedicacion: docente.regimenDedicacion || '',
          horas_dedicacion: horasDedicacion,
          estado: 'LECTIVA_CONFIRMADA'
        }
      });
    } else {
      // Actualizar estado a LECTIVA_CONFIRMADA si estaba en BORRADOR o sin estado
      if (declaracion.estado === 'BORRADOR' || declaracion.estado === 'ENVIADO') {
        await prisma.declaracionHoraria.update({
          where: { id_declaracion: declaracion.id_declaracion },
          data: { estado: 'LECTIVA_CONFIRMADA' }
        });
      }
    }

    // Guardar cargas lectivas (si no existen)
    // Obtener los horarios confirmados para crear cargas lectivas
    const horariosConfirmados = await prisma.horarioAsignado.findMany({
      where: {
        id_docente: targetDocenteId,
        id_periodo: Number(id_periodo)
      },
      include: { curso: true, grupo: true }
    });

    // Si no hay cargas lectivas en la declaración, crearlas desde los horarios
    const cargasExistentes = await prisma.cargaLectiva.count({
      where: { id_declaracion: declaracion.id_declaracion }
    });

    if (cargasExistentes === 0 && horariosConfirmados.length > 0) {
      // Agrupar por curso y tipo para no duplicar
      const cursosMap = new Map();
      for (const h of horariosConfirmados) {
        const key = `${h.id_curso}-${h.tipo_clase}`;
        if (!cursosMap.has(key)) {
          cursosMap.set(key, {
            id_curso: h.id_curso,
            tipo_clase: h.tipo_clase,
            id_grupo: h.id_grupo,
            horas_semanales: 0,
            grupos_asignados: 0
          });
        }
        // Sumar horas (cada bloque es una hora en la matriz)
        const inicio = h.hora_inicio?.split(':')?.map(Number) || [0,0];
        const fin = h.hora_fin?.split(':')?.map(Number) || [0,0];
        const horas = (fin[0] + fin[1]/60) - (inicio[0] + inicio[1]/60);
        const entry = cursosMap.get(key);
        entry.horas_semanales += horas;
        if (h.tipo_clase === 'laboratorio') {
          entry.grupos_asignados = (entry.grupos_asignados || 0) + 1;
        }
      }

      for (const [key, data] of cursosMap) {
        await prisma.cargaLectiva.create({
          data: {
            id_declaracion: declaracion.id_declaracion,
            id_curso: data.id_curso,
            id_grupo: data.id_grupo || null,
            tipo_clase: data.tipo_clase || 'teoria',
            horas_semanales: Math.round(data.horas_semanales),
            grupos_asignados: data.grupos_asignados || 0
          }
        });
      }
    }

    // Programar notificaciones para cada asignación confirmada
    (async () => {
      try {
        for (const asg of asignaciones) {
          const idHorario = (asg as any).id_horario || (asg as any).id || (asg as any).id_horario_asignado;
          if (!idHorario) continue;

          const horarioCompleto = await prisma.horarioAsignado.findUnique({
            where: { id_horario: idHorario },
            include: { docente: true, curso: true, grupo: true, ambiente: true, periodo: true }
          });

          if (horarioCompleto) {
            try {
              await ServicioNotificador.programarNotificacionesHorarioConfirmado(horarioCompleto, false);
            } catch (innerErr) {
              console.error('Error al programar notificacion para horario', idHorario, innerErr);
            }
          }
        }
      } catch (err) {
        console.error('Error programando notificaciones tras confirmar asignaciones:', err);
      }
    })();

    return NextResponse.json({ 
      success: true, 
      count: asignaciones.length,
      declaracionId: declaracion.id_declaracion,
      estado: declaracion.estado
    });
  } catch (error: any) {
    console.error('Error en confirmar-seleccion:', error);
    return NextResponse.json({ error: error.message || 'Error al confirmar' }, { status: 500 });
  }
}