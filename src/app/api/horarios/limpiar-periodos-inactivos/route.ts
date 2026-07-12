import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Borrar TODOS los horarios de períodos INACTIVOS
    const periodosInactivos = await prisma.periodoAcademico.findMany({
      where: { activo: false }
    });

    console.log("Períodos inactivos encontrados:", periodosInactivos.map((p: any) => ({ id: p.id_periodo, nombre: p.nombre })));

    let horariosBorrados = 0;
    let ventanasBorradas = 0;
    let seleccionesBorradas = 0;

    for (const periodo of periodosInactivos) {
      // Borrar horarios asignados del período inactivo
      const resultHorarios = await prisma.horarioAsignado.deleteMany({
        where: { id_periodo: periodo.id_periodo }
      });
      
      // Borrar ventanas de atención del período inactivo
      const resultVentanas = await prisma.ventanaAtencion.deleteMany({
        where: { id_periodo: periodo.id_periodo }
      });

      // Borrar selecciones temporales del período inactivo
      const resultSelecciones = await prisma.seleccionTemporalHorario.deleteMany({
        where: { id_periodo: periodo.id_periodo }
      });

      horariosBorrados += resultHorarios.count;
      ventanasBorradas += resultVentanas.count;
      seleccionesBorradas += resultSelecciones.count;

      console.log(`- Borrado ${resultHorarios.count} horarios, ${resultVentanas.count} ventanas y ${resultSelecciones.count} selecciones del período ${periodo.nombre}`);
    }

    return NextResponse.json({
      message: "Limpieza completada",
      periodos_limpiados: periodosInactivos.length,
      horarios_borrados: horariosBorrados,
      ventanas_borradas: ventanasBorradas,
      selecciones_borradas: seleccionesBorradas
    });
  } catch (error) {
    console.error("Error al limpiar períodos inactivos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: String(error) },
      { status: 500 }
    );
  }
}
