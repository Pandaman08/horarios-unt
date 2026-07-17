import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, parse, addMinutes } from "date-fns";
import {
  getHorasMaximasSemanales,
  getEtiquetaRegimenHoras,
  validarDisponibilidadHoras,
} from "@/lib/disponibilidad/validarHoras";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id_usuario) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const periodoId = req.nextUrl.searchParams.get("periodoId");
    if (!periodoId) {
      return NextResponse.json(
        { error: "periodoId requerido" },
        { status: 400 }
      );
    }

    // Buscar el docente por el id_usuario de la sesión
    const docente = await prisma.docente.findUnique({
      where: { id_usuario: session.user.id_usuario }
    });

    if (!docente) {
      return NextResponse.json(
        { error: "Usuario no es docente" },
        { status: 403 }
      );
    }

    const disponibilidades = await prisma.disponibilidadDocente.findMany({
      where: {
        id_docente: docente.id_docente,
        id_periodo: parseInt(periodoId)
      }
    });

    // Generar todos los slots de horario (incluyendo 12:00) para todos los días,
    // usando los valores de la BD si existen, o false si no
    const DIAS = [0, 1, 2, 3, 4, 5]; // Lunes a Sábado
    const HORAS = [
      "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
      "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
    ];

    const disponibilidadesCompletas: any[] = [];
    for (const dia of DIAS) {
      for (const hora of HORAS) {
        const existing = disponibilidades.find(
          d => d.dia_semana === dia && d.hora_inicio === hora
        );
        disponibilidadesCompletas.push({
          id_disponibilidad: existing?.id_disponibilidad,
          id_docente: docente.id_docente,
          id_periodo: parseInt(periodoId),
          dia_semana: dia,
          hora_inicio: hora,
          hora_fin: existing?.hora_fin || 
            `${String(parseInt(hora.split(':')[0]) + 1).padStart(2, '0')}:00`,
          disponible: existing?.disponible ?? false,
        });
      }
    }

    const disponibilidadesFiltradas = disponibilidadesCompletas;

    return NextResponse.json({
      disponibilidades: disponibilidadesFiltradas,
      horasMaximas: getHorasMaximasSemanales(docente),
      etiquetaRegimen: getEtiquetaRegimenHoras(docente),
      docente: {
        condicion: docente.condicion,
        regimenDedicacion: docente.regimenDedicacion,
        tipoContrato: docente.tipoContrato,
      },
    });
  } catch (error) {
    console.error("Error al obtener disponibilidades:", error);
    return NextResponse.json(
      { error: "Error al obtener disponibilidades" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id_usuario) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    let { id_docente, id_periodo, disponibilidad, disponibilidades, periodoId } = body;

    // Handle both cases: admin (id_docente + id_periodo + disponibilidad) and docente (periodoId + disponibilidades)
    const docenteFromSession = await prisma.docente.findUnique({
      where: { id_usuario: session.user.id_usuario }
    });
    
    if (!id_docente) {
      if (!docenteFromSession) {
        return NextResponse.json({ error: "No es docente" }, { status: 403 });
      }
      id_docente = docenteFromSession.id_docente;
    }

    if (!id_periodo && periodoId) {
      id_periodo = periodoId;
    }

    const dataToSave = disponibilidad || disponibilidades;
    if (!id_docente || !id_periodo || !Array.isArray(dataToSave)) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const docente = await prisma.docente.findUnique({
      where: { id_docente: Number(id_docente) },
      select: {
        condicion: true,
        regimenDedicacion: true,
        tipoContrato: true,
        horas_maximas_semanales: true,
      },
    });

    if (!docente) {
      return NextResponse.json({ error: "Docente no encontrado" }, { status: 404 });
    }

    const validacion = validarDisponibilidadHoras(docente, dataToSave);
    if (!validacion.valido) {
      return NextResponse.json(
        {
          error: validacion.mensaje,
          horasDisponibles: validacion.horasDisponibles,
          horasMaximas: validacion.horasMaximas,
        },
        { status: 400 }
      );
    }

    // Usar una transacción para asegurar atomicidad
    await prisma.$transaction(async (tx: any) => {
      // 1. Eliminar disponibilidad anterior para este docente y periodo
      await tx.disponibilidadDocente.deleteMany({
        where: {
          id_docente: id_docente,
          id_periodo: id_periodo
        }
      });

      // 2. Crear nuevos registros
      if (dataToSave.length > 0) {
        await tx.disponibilidadDocente.createMany({
          data: dataToSave.map((d: any) => ({
            id_docente: id_docente,
            id_periodo: id_periodo,
            dia_semana: d.dia_semana,
            hora_inicio: d.hora_inicio,
            hora_fin: d.hora_fin || format(addMinutes(parse(d.hora_inicio, "HH:mm", new Date()), 60), "HH:mm"),
            disponible: d.disponible
          }))
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al guardar disponibilidad:", error);
    return NextResponse.json(
      { error: "Error al guardar disponibilidad" },
      { status: 500 }
    );
  }
}

