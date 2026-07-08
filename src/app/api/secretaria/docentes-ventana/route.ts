import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const prioridadCategoria = ['AUXILIAR', 'ASOCIADO', 'PRINCIPAL'];
const prioridadCondicion = ['ORDINARIO', 'CONTRATADO', 'EXTRAORDINARIO'];

function ordenarDocentes(docentes: any[]) {
  return [...docentes].sort((a, b) => {
    const condA = a.condicion || 'ORDINARIO';
    const condB = b.condicion || 'ORDINARIO';
    const idxA = prioridadCondicion.indexOf(condA);
    const idxB = prioridadCondicion.indexOf(condB);
    if (idxA !== idxB) return idxA - idxB;

    const catA = a.categoriaDocente || 'AUXILIAR';
    const catB = b.categoriaDocente || 'AUXILIAR';
    const idxCatA = prioridadCategoria.indexOf(catA);
    const idxCatB = prioridadCategoria.indexOf(catB);
    if (idxCatA !== idxCatB) return idxCatB - idxCatA;

    if (a.fecha_ingreso && b.fecha_ingreso) {
      return new Date(a.fecha_ingreso).getTime() - new Date(b.fecha_ingreso).getTime();
    }
    return 0;
  });
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');

    if (!id_periodo) {
      return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });
    }

    const periodoId = parseInt(id_periodo);

    const [docentes, ventanas] = await Promise.all([
      prisma.docente.findMany({
        where: {
          activo: true,
          declaraciones_horarias: {
            some: {
              id_periodo: periodoId,
              estado: 'BORRADOR',
              cargas_lectivas: { some: {} }
            }
          }
        },
        include: {
          usuario: true,
          departamento: true,
        }
      }),
      prisma.ventanaAtencion.findMany({
        where: { id_periodo: periodoId, activo: true },
        orderBy: { orden_prioridad: 'asc' }
      }),
    ]);

    const docentesOrdenados = ordenarDocentes(docentes);

    const docentesConEstado = docentesOrdenados.map((docente: any, index: number) => {
      const ventana = ventanas[index] || null;
      const ahora = new Date();
      const hoyLocal = ahora.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });

      let estadoVentana: string;
      let tiempoRestante: number | null = null;

      if (!ventana) {
        estadoVentana = 'sin_ventana';
      } else if (ventana.completado) {
        estadoVentana = 'completado';
      } else {
        const fechaVentana = new Date(ventana.fecha).toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
        if (fechaVentana < hoyLocal) {
          estadoVentana = 'vencido';
        } else if (fechaVentana > hoyLocal) {
          estadoVentana = 'pendiente';
        } else {
          const horaActual = ahora.toLocaleTimeString('en-GB', { timeZone: 'America/Lima', hour12: false, hour: '2-digit', minute: '2-digit' });
          const ahoraMin = parseInt(horaActual.split(':')[0]) * 60 + parseInt(horaActual.split(':')[1]);
          const inicioMin = parseInt(ventana.hora_inicio.split(':')[0]) * 60 + parseInt(ventana.hora_inicio.split(':')[1]);
          const finMin = parseInt(ventana.hora_fin.split(':')[0]) * 60 + parseInt(ventana.hora_fin.split(':')[1]);

          if (ahoraMin < inicioMin) {
            estadoVentana = 'pendiente';
          } else if (ahoraMin >= inicioMin && ahoraMin < finMin) {
            estadoVentana = 'activo';
            tiempoRestante = (finMin - ahoraMin) * 60 - ahora.getSeconds();
          } else {
            estadoVentana = 'vencido';
          }
        }
      }

      return {
        id_docente: docente.id_docente,
        nombres: docente.nombres,
        apellidos: docente.apellidos,
        codigo_docente: docente.codigo_docente,
        condicion: docente.condicion,
        categoriaDocente: docente.categoriaDocente,
        departamento: docente.departamento?.nombre || '',
        fecha_ingreso: docente.fecha_ingreso,
        ventana: ventana ? {
          id_ventana: ventana.id_ventana,
          orden_prioridad: ventana.orden_prioridad,
          fecha: ventana.fecha,
          hora_inicio: ventana.hora_inicio,
          hora_fin: ventana.hora_fin,
          intervalo_minutos: ventana.intervalo_minutos,
          completado: ventana.completado,
        } : null,
        estadoVentana,
        tiempoRestante,
      };
    });

    const resumen = {
      total: docentesOrdenados.length,
      pendientes: docentesConEstado.filter((d: any) => d.estadoVentana === 'pendiente' || d.estadoVentana === 'activo').length,
      completados: docentesConEstado.filter((d: any) => d.estadoVentana === 'completado').length,
      vencidos: docentesConEstado.filter((d: any) => d.estadoVentana === 'vencido').length,
    };

    return NextResponse.json({ docentes: docentesConEstado, resumen });
  } catch (error) {
    console.error('Error en docentes-ventana:', error);
    return NextResponse.json({ error: 'Error al obtener docentes' }, { status: 500 });
  }
}
