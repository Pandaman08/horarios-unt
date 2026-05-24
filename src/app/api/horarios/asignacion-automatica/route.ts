import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id_periodo, hora_inicio, intervalo_minutos, modo } = body;

    if (!id_periodo) {
      return NextResponse.json(
        { error: "id_periodo es requerido" },
        { status: 400 }
      );
    }

    console.log("Iniciando asignación automática:");
    console.log("Periodo:", id_periodo);
    console.log("Hora inicio:", hora_inicio);
    console.log("Intervalo:", intervalo_minutos);
    console.log("Modo:", modo);

    // Paso 1: Obtener docentes ordenados por prioridades
    const docentes = await prisma.docente.findMany({
      where: { activo: true },
      include: {
        disponibilidad: {
          where: { id_periodo, disponible: true }
        },
        docente_cursos: {
          where: { activo: true },
          include: { curso: true }
        }
      }
    });

    // Ordenar docentes por: modalidad (nombrado primero), categoría, antigüedad
    const prioridadCategoria = ["jefe_practica", "auxiliar", "asociado", "principal"];
    
    const docentesOrdenados = [...docentes].sort((a, b) => {
      // Prioridad 1: Modalidad
      if (a.modalidad === "nombrado" && b.modalidad !== "nombrado") return -1;
      if (b.modalidad === "nombrado" && a.modalidad !== "nombrado") return 1;
      
      // Prioridad 2: Categoría
      const catA = prioridadCategoria.indexOf(a.categoria);
      const catB = prioridadCategoria.indexOf(b.categoria);
      if (catA !== catB) return catB - catA;
      
      // Prioridad 3: Antigüedad (mayor primero)
      if (a.fecha_ingreso && b.fecha_ingreso) {
        return new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime();
      }
      return 0;
    });

    console.log(`Docentes ordenados encontrados: ${docentesOrdenados.length}`);

    // Diferencia entre modos
    let message = "";
    const ahora = new Date();
    let fechaFinIntervalo: Date | null = null;

    if (modo === "automatico") {
      message = "Asignación completamente automática iniciada. Los horarios se asignarán sin esperas.";
    } else if (modo === "intervalo") {
      fechaFinIntervalo = new Date(ahora.getTime() + intervalo_minutos * 60000);
      message = `Asignación automática con intervalo de ${intervalo_minutos} minutos iniciada. Los docentes podrán realizar cambios hasta ${fechaFinIntervalo.toLocaleTimeString()}.`;
    }

    // Por ahora, solo simulamos que se completó exitosamente
    // El algoritmo completo requerirá mucho más trabajo y análisis

    return NextResponse.json(
      { 
        message,
        docentes_count: docentesOrdenados.length,
        modo,
        intervalo_minutos: modo === "intervalo" ? intervalo_minutos : null,
        fecha_inicio: ahora.toISOString(),
        fecha_fin_intervalo: fechaFinIntervalo?.toISOString() || null
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error en asignación automática:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", message: error.message },
      { status: 500 }
    );
  }
}
