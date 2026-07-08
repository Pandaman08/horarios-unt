import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DIA_MAP: Record<string, number> = {
  LU: 0,
  MA: 1,
  MI: 2,
  JU: 3,
  VI: 4,
  SA: 5,
  DO: 6,
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id_usuario) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periodoId = searchParams.get("periodoId");
    
    if (!periodoId) {
      return NextResponse.json(
        { error: "periodoId requerido" },
        { status: 400 }
      );
    }
    
    // VALIDAR QUE EL PERÍODO ESTÉ ACTIVO
    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: parseInt(periodoId) }
    });
    
    if (!periodo) {
      return NextResponse.json(
        { error: "Período no encontrado" },
        { status: 404 }
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
            horas_teoria: true,
            horas_practica: true,
            horas_laboratorio: true,
            ciclo_rel: true,
          },
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

    const cursosMap = new Map<string, {
      key: string;
      numero: number;
      codigo: string;
      nombre: string;
      ciclo: string;
      grupo: string;
      teoria: number;
      practica: number;
      laboratorio: number;
    }>();

    for (const h of horarios) {
      const key = `${h.id_curso}-${h.id_grupo}`;
      if (!cursosMap.has(key)) {
        cursosMap.set(key, {
          key,
          numero: cursosMap.size + 1,
          codigo: h.curso.codigo,
          nombre: h.curso.nombre,
          ciclo: h.curso.ciclo_rel
            ? (h.curso.ciclo_rel.nombre || `${h.curso.ciclo_rel.numero}°`)
            : "—",
          grupo: h.grupo.codigo_grupo,
          teoria: h.curso.horas_teoria ?? 0,
          practica: h.curso.horas_practica ?? 0,
          laboratorio: h.curso.horas_laboratorio ?? 0,
        });
      }
    }
    const cursosLeyenda = Array.from(cursosMap.values());

    // Formatear respuesta
    const horariosFormato = horarios.map((h: any) => ({
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
      ciclo_nombre: h.curso.ciclo_rel?.nombre || "",
      is_no_lectiva: false,
    }));

    const declaracion = await prisma.declaracionHoraria.findUnique({
      where: {
        id_docente_id_periodo: {
          id_docente: docente.id_docente,
          id_periodo: parseInt(periodoId)
        }
      },
      include: {
        cargas_no_lectivas: {
          include: { horarios: true }
        }
      }
    });

    const estadoDeclaracion = declaracion?.estado ?? null;
    const cargaAprobadaPorDecano = estadoDeclaracion === "APROBADO";

    const cargasNL = cargaAprobadaPorDecano
      ? (declaracion?.cargas_no_lectivas ?? [])
      : [];
    const noLectivasLeyenda = cargasNL.map((carga: (typeof cargasNL)[number], idx: number) => ({
      id_carga_no_lectiva: carga.id_carga_no_lectiva,
      numero: idx + 1,
      tipo: String(carga.tipo).replace(/_/g, " "),
      descripcion: carga.descripcion || String(carga.tipo).replace(/_/g, " "),
      horasSemanales: carga.horas_semanales ?? 0,
    }));

    if (cargasNL.length) {
      cargasNL.forEach((carga: any) => {
        (carga.horarios || []).forEach((horario: any) => {
          horariosFormato.push({
            id_carga_no_lectiva: carga.id_carga_no_lectiva,
            id_asignacion: undefined,
            id_curso: null,
            id_grupo: null,
            id_ambiente: null,
            curso_codigo: carga.tipo || "NOLECT",
            curso_nombre: carga.descripcion || carga.tipo || "Carga no lectiva",
            grupo_codigo: "",
            ambiente_codigo: carga.ambiente || "",
            ambiente_nombre: carga.ambiente || "",
            tipo_clase: "No lectiva",
            dia_semana: DIA_MAP[horario.dia?.toString().toUpperCase()] ?? 0,
            hora_inicio: horario.horaInicio,
            hora_fin: horario.horaFin,
            ciclo_nombre: String(carga.tipo).replace(/_/g, " "),
            is_no_lectiva: true,
          });
        });
      });
    }

    return NextResponse.json({
      horarios: horariosFormato,
      cursosLeyenda,
      noLectivasLeyenda,
      estadoDeclaracion,
      cargaAprobadaPorDecano,
    });
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    return NextResponse.json(
      { error: "Error al obtener horarios" },
      { status: 500 }
    );
  }
}
