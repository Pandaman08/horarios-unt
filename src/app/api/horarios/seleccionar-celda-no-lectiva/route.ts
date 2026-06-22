import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { id_docente, id_periodo, id_carga_no_lectiva, dia_semana, hora_inicio, hora_fin } = body;

    // Validar datos obligatorios
    if (!id_docente || !id_periodo || !id_carga_no_lectiva || dia_semana === undefined || !hora_inicio || !hora_fin) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Mapear día numérico a código de día (0=LU, 1=MA, 2=MI, 3=JU, 4=VI, 5=SA)
    const diasMap = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
    const dia = diasMap[dia_semana];
    if (!dia) {
      return NextResponse.json({ error: "Día inválido" }, { status: 400 });
    }

    // 1. Verificar que la actividad no lectiva existe y pertenece al docente
    const actividad = await prisma.cargaNoLectiva.findFirst({
      where: {
        id_carga_no_lectiva: id_carga_no_lectiva,
        declaracion: {
          id_docente: id_docente,
          id_periodo: id_periodo,
          estado: 'APROBADO'
        }
      }
    });

    if (!actividad) {
      return NextResponse.json({ error: "Actividad no encontrada o no aprobada" }, { status: 404 });
    }

    // 2. Verificar que el bloque no esté ocupado (lectiva o no lectiva)
    // Verificar en HorarioAsignado (carga lectiva)
    const horarioLectivo = await prisma.horarioAsignado.findFirst({
      where: {
        id_docente: id_docente,
        id_periodo: id_periodo,
        dia_semana: dia_semana,
        hora_inicio: { lte: hora_inicio },
        hora_fin: { gte: hora_fin }
      }
    });

    if (horarioLectivo) {
      return NextResponse.json({ error: "El bloque ya está ocupado por carga lectiva" }, { status: 409 });
    }

    // Verificar en HorarioActividad (carga no lectiva)
    const horarioNoLectivo = await prisma.horarioActividad.findFirst({
      where: {
        cargaNoLectiva: {
          declaracion: {
            id_docente: id_docente,
            id_periodo: id_periodo
          }
        },
        dia: dia,
        horaInicio: { lte: hora_inicio },
        horaFin: { gte: hora_fin }
      }
    });

    if (horarioNoLectivo) {
      return NextResponse.json({ error: "El bloque ya está ocupado por otra actividad no lectiva" }, { status: 409 });
    }

    // 3. Verificar que el docente tenga disponibilidad (opcional)
    // Si existe DisponibilidadDocente, validar que esté disponible
    const disponibilidad = await prisma.disponibilidadDocente.findFirst({
      where: {
        id_docente: id_docente,
        id_periodo: id_periodo,
        dia_semana: dia_semana,
        hora_inicio: { lte: hora_inicio },
        hora_fin: { gte: hora_fin }
      }
    });

    if (disponibilidad && !disponibilidad.disponible) {
      return NextResponse.json({ error: "No disponible según restricción del docente" }, { status: 409 });
    }

    // 4. Guardar en HorarioActividad
    const nuevoHorario = await prisma.horarioActividad.create({
      data: {
        cargaNoLectivaId: id_carga_no_lectiva,
        dia: dia,
        horaInicio: hora_inicio,
        horaFin: hora_fin,
      }
    });

    return NextResponse.json({ 
      success: true, 
      horario: nuevoHorario 
    });

  } catch (error) {
    console.error("Error al guardar horario no lectivo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}