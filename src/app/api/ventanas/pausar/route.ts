import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ROLES_VENTANAS = ['administrador_sistema', 'operador_horarios'];

function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ROLES_VENTANAS.includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id_periodo, pausado, segundos_pausados } = await request.json();

    if (!id_periodo) {
      return NextResponse.json({ error: 'id_periodo es requerido' }, { status: 400 });
    }

    const idPeriodoNum = parseInt(id_periodo);
    const nuevoEstado = pausado === true;

    if (nuevoEstado) {
      // Solo pausar
      await prisma.ventanaAtencion.updateMany({
        where: { id_periodo: idPeriodoNum, activo: true },
        data: { pausado: true },
      });
    } else {
      // Reanudar: posiblemente desplazar tiempos
      const minutosADesplazar = segundos_pausados ? Math.ceil(segundos_pausados / 60) : 0;

      if (minutosADesplazar > 0) {
        const ventanas = await prisma.ventanaAtencion.findMany({
          where: { id_periodo: idPeriodoNum, activo: true, pausado: true },
          orderBy: { orden_prioridad: 'asc' },
        });

        for (const v of ventanas) {
          const nuevaInicio = sumarMinutos(v.hora_inicio, minutosADesplazar);
          const nuevaFin = sumarMinutos(v.hora_fin, minutosADesplazar);

          const [hi, mi] = v.hora_inicio.split(':').map(Number);
          const [hni, mni] = nuevaInicio.split(':').map(Number);
          let diasExtra = 0;
          if (hni < hi || (hni === hi && mni < mi)) {
            diasExtra = 1;
          }

          let fecha = new Date(v.fecha);
          if (diasExtra > 0) {
            fecha.setDate(fecha.getDate() + diasExtra);
          }

          await prisma.ventanaAtencion.update({
            where: { id_ventana: v.id_ventana },
            data: {
              hora_inicio: nuevaInicio,
              hora_fin: nuevaFin,
              fecha: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
              pausado: false,
            },
          });
        }
      } else {
        await prisma.ventanaAtencion.updateMany({
          where: { id_periodo: idPeriodoNum, activo: true },
          data: { pausado: false },
        });
      }
    }

    return NextResponse.json({
      message: nuevoEstado
        ? 'Ventanas pausadas correctamente'
        : 'Ventanas reanudadas correctamente',
      pausado: nuevoEstado,
    });
  } catch (error: any) {
    console.error('Error al pausar/reanudar ventanas:', error);
    return NextResponse.json(
      { error: 'Error al pausar/reanudar ventanas', message: error.message },
      { status: 500 }
    );
  }
}
