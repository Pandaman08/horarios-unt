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

    // Obtener horarios asignados con información completa
    const horarios = await prisma.horarioAsignado.findMany({
      where: {
        id_docente: docente.id_docente,
        id_periodo: parseInt(periodoId)
      },
      include: {
        curso: {
          select: {
            id_curso: true,
            codigo: true,
            nombre: true,
            creditos: true,
            ciclo_rel: true
          }
        },
        grupo: {
          select: {
            id_grupo: true,
            codigo_grupo: true
          }
        },
        ambiente: {
          select: {
            id_ambiente: true,
            codigo: true,
            nombre: true,
            capacidad: true
          }
        }
      },
      orderBy: [
        { dia_semana: "asc" },
        { hora_inicio: "asc" }
      ]
    });

    // Formatear respuesta
    const horariosFormato = horarios.map((h) => ({
      id_asignacion: h.id_asignacion,
      id_curso: h.id_curso,
      id_grupo: h.id_grupo,
      id_ambiente: h.id_ambiente,
      curso_codigo: h.curso.codigo,
      curso_nombre: h.curso.nombre,
      grupo_codigo: h.grupo.codigo_grupo,
      ambiente_codigo: h.ambiente.codigo,
      ambiente_nombre: h.ambiente.nombre,
      tipo_clase: h.tipo_clase,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      ciclo_nombre: h.curso.ciclo_rel?.nombre || ""
    }));

    return NextResponse.json(horariosFormato);
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    return NextResponse.json(
      { error: "Error al obtener horarios" },
      { status: 500 }
    );
  }
}
