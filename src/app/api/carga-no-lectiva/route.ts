import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getMaxHorasActividadNoLectiva,
  getTrabajoLectivoSemanal,
  horasDesdeHorarios,
} from '@/lib/carga-no-lectiva/reglasHoras';

interface HorarioPayload {
  horaInicio?: string;
  horaFin?: string;
}

const calcularHorasSemanales = (horarios: HorarioPayload[]): number => {
  return horasDesdeHorarios(horarios);
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const carga = await prisma.cargaNoLectiva.create({
      data: {
        id_declaracion: data.id_declaracion,
        tipo: data.tipo,
        descripcion: data.descripcion || null,
        horas_semanales: data.horas_semanales,
        sedeId: data.sedeId || null,
        ambiente: data.ambiente || null,
        cargoId: data.cargoId || null
      }
    });
    return NextResponse.json(carga);
  } catch (error) {
    console.error('Error en POST /api/carga-no-lectiva:', error);
    return NextResponse.json({ error: 'Error al crear carga no lectiva' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id_declaracion, cargas } = data;

    if (!id_declaracion || !cargas) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const declaracion = await prisma.declaracionHoraria.findUnique({
      where: { id_declaracion },
      include: {
        docente: {
          select: { condicion: true, regimenDedicacion: true, tipoContrato: true },
        },
        cargas_lectivas: {
          select: { horas_semanales: true, grupos_asignados: true },
        },
      },
    });

    if (!declaracion) {
      return NextResponse.json({ error: 'Declaración no encontrada' }, { status: 404 });
    }

    const trabajoLectivo = getTrabajoLectivoSemanal(declaracion.cargas_lectivas);

    // Upsert each carga no lectiva
    for (const carga of cargas) {
      let cargaCreadaOActualizada;

      let horasSemanales = 0;
      if (carga.horarios && carga.horarios.length > 0) {
        horasSemanales = calcularHorasSemanales(carga.horarios);
      } else if (typeof carga.horas_semanales === 'number') {
        horasSemanales = carga.horas_semanales;
      }

      const maxHoras = getMaxHorasActividadNoLectiva(
        carga.tipo,
        declaracion.docente,
        trabajoLectivo
      );
      if (maxHoras !== null) {
        if (maxHoras === 0 && horasSemanales > 0) {
          return NextResponse.json(
            {
              error: `La actividad ${carga.tipo} no está permitida para el régimen del docente (Art. 12.4)`,
            },
            { status: 400 }
          );
        }
        if (horasSemanales > maxHoras) {
          return NextResponse.json(
            {
              error: `La actividad ${carga.tipo} excede el máximo permitido (${maxHoras}h semanales)`,
            },
            { status: 400 }
          );
        }
      }

      if (carga.id_carga_no_lectiva && typeof carga.id_carga_no_lectiva === 'number') {
        // Update existing
        cargaCreadaOActualizada = await prisma.cargaNoLectiva.update({
          where: { id_carga_no_lectiva: carga.id_carga_no_lectiva },
          data: {
            descripcion: carga.descripcion || null,
            horas_semanales: horasSemanales,
            sedeId: carga.sedeId || null,
            ambiente: carga.ambiente || null,
            cargoId: carga.cargoId || null
          }
        });
      } else {
        // Check if this type already exists for this declaration
        const existing = await prisma.cargaNoLectiva.findFirst({
          where: {
            id_declaracion: id_declaracion,
            tipo: carga.tipo
          }
        });

        if (existing) {
          // Update existing
          cargaCreadaOActualizada = await prisma.cargaNoLectiva.update({
            where: { id_carga_no_lectiva: existing.id_carga_no_lectiva },
            data: {
              descripcion: carga.descripcion || null,
              horas_semanales: horasSemanales,
              sedeId: carga.sedeId || null,
              ambiente: carga.ambiente || null,
              cargoId: carga.cargoId || null
            }
          });
        } else {
          // Create new
          cargaCreadaOActualizada = await prisma.cargaNoLectiva.create({
            data: {
              id_declaracion: id_declaracion,
              tipo: carga.tipo,
              descripcion: carga.descripcion || null,
              horas_semanales: horasSemanales,
              sedeId: carga.sedeId || null,
              ambiente: carga.ambiente || null,
              cargoId: carga.cargoId || null
            }
          });
        }
      }

      // Now handle horarios
      if (cargaCreadaOActualizada && carga.horarios) {
        // Delete old ones
        await prisma.horarioActividad.deleteMany({
          where: { cargaNoLectivaId: cargaCreadaOActualizada.id_carga_no_lectiva }
        });

        // Create new ones
        for (const horario of carga.horarios) {
          await prisma.horarioActividad.create({
            data: {
              cargaNoLectivaId: cargaCreadaOActualizada.id_carga_no_lectiva,
              dia: horario.dia,
              horaInicio: horario.horaInicio,
              horaFin: horario.horaFin
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en PUT /api/carga-no-lectiva:', error);
    return NextResponse.json({ error: 'Error al actualizar cargas no lectivas' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    await prisma.cargaNoLectiva.delete({ where: { id_carga_no_lectiva: Number.parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/carga-no-lectiva:', error);
    return NextResponse.json({ error: 'Error al eliminar carga no lectiva' }, { status: 500 });
  }
}
