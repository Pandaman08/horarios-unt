import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodoId = searchParams.get("periodoId");
    const search = searchParams.get("search") || "";
    const categoria = searchParams.get("categoria") || "todos";
    const modalidad = searchParams.get("modalidad") || "todos";
    const orden = searchParams.get("orden") || "antiguedad_desc";

    if (!periodoId) {
      return NextResponse.json({ error: "periodoId es obligatorio" }, { status: 400 });
    }

    const idPeriodo = parseInt(periodoId);

    // Obtener docentes con su disponibilidad para el periodo
    const docentes = await prisma.docente.findMany({
      where: {
        activo: true,
        AND: [
          search ? {
            OR: [
              { nombres: { contains: search, mode: 'insensitive' } },
              { apellidos: { contains: search, mode: 'insensitive' } },
              { dni: { contains: search } },
              { codigo_docente: { contains: search } },
            ]
          } : {},
          categoria !== "todos" ? { 
            categoria: {
              equals: categoria,
              mode: 'insensitive'
            }
          } : {},
          modalidad !== "todos" ? { 
            modalidad: {
              equals: modalidad,
              mode: 'insensitive'
            }
          } : {},
        ]
      },
      include: {
        disponibilidad: {
          where: { id_periodo: idPeriodo },
          take: 1
        }
      }
    });

    // Calcular antigüedad y formatear respuesta
    const docentesFormateados = docentes.map((d: any) => {
      let antiguedad = 0;
      if (d.fecha_ingreso) {
        const hoy = new Date();
        const ingreso = new Date(d.fecha_ingreso);
        antiguedad = hoy.getFullYear() - ingreso.getFullYear();
        if (hoy.getMonth() < ingreso.getMonth() || (hoy.getMonth() === ingreso.getMonth() && hoy.getDate() < ingreso.getDate())) {
          antiguedad--;
        }
      }

      return {
        id_docente: d.id_docente,
        codigo_docente: d.codigo_docente,
        nombres: d.nombres,
        apellidos: d.apellidos,
        dni: d.dni,
        categoria: d.categoria,
        modalidad: d.modalidad,
        antiguedad: d.fecha_ingreso ? antiguedad : null,
        tiene_disponibilidad: d.disponibilidad.length > 0
      };
    });

    // Ordenar por antigüedad
    docentesFormateados.sort((a: any, b: any) => {
      if (a.antiguedad === null) return 1;
      if (b.antiguedad === null) return -1;
      return orden === "antiguedad_asc" ? a.antiguedad - b.antiguedad : b.antiguedad - a.antiguedad;
    });

    return NextResponse.json(docentesFormateados);
  } catch (error) {
    console.error("Error al listar docentes:", error);
    return NextResponse.json({ error: "Error al listar docentes" }, { status: 500 });
  }
}
