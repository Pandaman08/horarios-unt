import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { periodoId, disponibilidades } = body;

    if (!periodoId || !Array.isArray(disponibilidades)) {
      return NextResponse.json(
        { error: "Datos incompletos" },
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

    const idDocente = docente.id_docente;

    // Usar una transacción para asegurar atomicidad
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar disponibilidad anterior para este docente y periodo
      await tx.disponibilidadDocente.deleteMany({
        where: {
          id_docente: idDocente,
          id_periodo: parseInt(periodoId)
        }
      });

      // 2. Crear nuevos registros
      if (disponibilidades.length > 0) {
        await tx.disponibilidadDocente.createMany({
          data: disponibilidades.map((d: any) => ({
            id_docente: idDocente,
            id_periodo: parseInt(periodoId),
            dia_semana: d.dia_semana,
            hora_inicio: d.hora_inicio,
            hora_fin: d.hora_fin,
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

