import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, parse, addMinutes } from "date-fns";

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

    // Obtener disponibilidades
    const disponibilidades = await prisma.disponibilidadDocente.findMany({
      where: {
        id_docente: docente.id_docente,
        id_periodo: parseInt(periodoId)
      }
    });

    return NextResponse.json(disponibilidades);
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

    // Usar una transacción para asegurar atomicidad
    await prisma.$transaction(async (tx) => {
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

