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

    const { id_periodo, id_docente } = await request.json();
    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    let targetDocenteId: number;
    const userRol = session.user.rol;
    const isOperador = ['administrador_sistema', 'operador_horarios', 'director_escuela', 'coordinador_academico'].includes(userRol);

    if (id_docente && isOperador) {
      // El operador confirma para un docente específico
      targetDocenteId = Number(id_docente);
    } else {
      // El docente confirma para sí mismo
      const docente = await prisma.docente.findFirst({
        where: { id_usuario: Number(session.user.id_usuario) }
      });

      if (!docente) return NextResponse.json({ error: 'Perfil de docente no encontrado' }, { status: 404 });
      targetDocenteId = docente.id_docente;
    }

    const asignaciones = await GestorSeleccionTemporal.confirmarTodo(
      targetDocenteId,
      Number(id_periodo),
      Number(session.user.id_usuario)
    );

    // Programar notificaciones para cada asignación confirmada (no bloquear la respuesta)
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

    return NextResponse.json({ success: true, count: asignaciones.length });
  } catch (error: any) {
    console.error('Error en confirmar-seleccion:', error);
    return NextResponse.json({ error: error.message || 'Error al confirmar' }, { status: 500 });
  }
}
