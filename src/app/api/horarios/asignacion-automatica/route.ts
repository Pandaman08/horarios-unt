import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    console.log("🔄 Iniciando asignación automática REAL (sin conflictos):");
    console.log("Periodo:", id_periodo);
    console.log("Hora inicio:", hora_inicio);
    console.log("Intervalo:", intervalo_minutos);
    console.log("Modo:", modo);

    // Primero, borramos cualquier horario existente para empezar de nuevo
    console.log("🧹 Eliminando horarios antiguos...");
    await prisma.$transaction(async (tx) => {
      await tx.horarioAsignado.deleteMany({
        where: { id_periodo: parseInt(id_periodo) }
      });
      await tx.seleccionTemporalHorario.deleteMany({
        where: { id_periodo: parseInt(id_periodo) }
      });
    });

    // Paso 1: Obtener docentes con disponibilidad y cursos
    console.log("📋 Obteniendo docentes...");
    const docentes = await prisma.docente.findMany({
      where: { activo: true },
      include: {
        disponibilidad: {
          where: { id_periodo: parseInt(id_periodo), disponible: true }
        },
        docente_cursos: {
          where: { activo: true },
          include: { 
            curso: {
              include: {
                curso_ambientes: {
                  include: { ambiente: true }
                }
              }
            }
          }
        }
      }
    });

    console.log(`✅ Docentes encontrados: ${docentes.length}`);

    // Ordenar docentes por prioridades:
    // 1. Modalidad: Nombrado primero
    // 2. Categoría: Principal → Asociado → Auxiliar → Jefe de Práctica
    // 3. Antigüedad: Más antiguo primero (mayor antigüedad)
    const prioridadCategoria = ["jefe_practica", "auxiliar", "asociado", "principal"]; // Índice mayor = más prioridad
    const docentesOrdenados = [...docentes].sort((a, b) => {
      // 1. Priorizar Nombrado sobre Contratado
      if (a.modalidad === "nombrado" && b.modalidad !== "nombrado") return -1;
      if (b.modalidad === "nombrado" && a.modalidad !== "nombrado") return 1;
      
      // 2. Priorizar por categoría (mayor índice = más prioridad)
      const catA = prioridadCategoria.indexOf(a.categoria);
      const catB = prioridadCategoria.indexOf(b.categoria);
      if (catA !== catB) return catB - catA; // catB primero si tiene mayor índice
      
      // 3. Priorizar por antigüedad (más viejo primero)
      if (a.fecha_ingreso && b.fecha_ingreso) {
        return new Date(a.fecha_ingreso).getTime() - new Date(b.fecha_ingreso).getTime();
      }
      
      return 0;
    });
    
    // Mostrar el orden de prioridad
    console.log("\n📊 Orden de prioridad de docentes:");
    docentesOrdenados.forEach((doc, index) => {
      const antiguedad = doc.fecha_ingreso 
        ? new Date().getFullYear() - new Date(doc.fecha_ingreso).getFullYear()
        : 0;
      console.log(`  ${index + 1}. ${doc.nombres} ${doc.apellidos} - Modalidad: ${doc.modalidad} - Categoría: ${doc.categoria} - Antigüedad: ${antiguedad} años`);
    });

    // Variables para trackear qué horarios ya están ocupados
    const horariosOcupadosDocente = new Set<string>(); // Formato: "docenteId_dia_horaInicio"
    const horariosOcupadosAmbiente = new Set<string>(); // Formato: "ambienteId_dia_horaInicio"
    const horariosPorDiaHora = new Map<string, number>(); // Formato: "dia_horaInicio" -> count, max 4

    // Paso 2: Para cada docente, crear horarios basados en su disponibilidad (sin conflictos)
    let totalHorariosCreados = 0;

    for (const docente of docentesOrdenados) {
      console.log(`\n👉 Procesando docente: ${docente.nombres} ${docente.apellidos}`);
      
      // Por cada curso del docente
      for (const docenteCurso of docente.docente_cursos) {
        const curso = docenteCurso.curso;
        console.log(`  📚 Curso: ${curso.nombre} (${docenteCurso.tipo_clase})`);
        
        // Encontrar ambientes disponibles para este curso y tipo de clase
        const ambientesValidos = curso.curso_ambientes
          .filter(ca => ca.tipo_clase.toLowerCase() === docenteCurso.tipo_clase.toLowerCase())
          .map(ca => ca.ambiente);
          
        // Mezclar ambientes para distribución más dispersa
        const ambientesMezclados = [...ambientesValidos].sort(() => Math.random() - 0.5);
          
        console.log(`    📍 Ambientes disponibles: ${ambientesMezclados.length}`);
        
        if (ambientesMezclados.length === 0) {
          console.log(`    ⚠️ No hay ambientes para este tipo de clase, saltando...`);
          continue;
        }

        // Obtener los grupos del curso para este periodo
        const grupos = await prisma.grupo.findMany({
          where: { 
            id_curso: curso.id_curso, 
            id_periodo: parseInt(id_periodo),
            activo: true
          }
        });
        
        console.log(`    👥 Grupos: ${grupos.length}`);
        
        if (grupos.length === 0) {
          console.log(`    ⚠️ No hay grupos, saltando...`);
          continue;
        }

        // Obtener disponibilidad del docente
        const disponibilidadDocente = docente.disponibilidad;
        console.log(`    ⏰ Disponibilidad: ${disponibilidadDocente.length} bloques`);

        if (disponibilidadDocente.length === 0) {
          console.log(`    ⚠️ No hay disponibilidad, saltando...`);
          continue;
        }

        // Seleccionar un grupo y ambiente para este curso
        const grupoSeleccionado = grupos[0];

        // Verificar cuántas horas necesitamos para este curso
        const horasRequeridas = docenteCurso.tipo_clase === 'teoria' ? curso.horas_teoria :
                                 docenteCurso.tipo_clase === 'laboratorio' ? curso.horas_laboratorio :
                                 curso.horas_practica;

        console.log(`    ⏱️ Horas requeridas: ${horasRequeridas}`);
        
        // Ordenar disponibilidad: LUNES (día 0) primero, luego los demás días mezclados
        const disponibilidadLunes = disponibilidadDocente.filter(d => d.dia_semana === 0);
        const disponibilidadOtrosDias = disponibilidadDocente.filter(d => d.dia_semana !== 0);
        
        // Mezclar los otros días
        const otrosDiasMezclados = [...disponibilidadOtrosDias].sort(() => Math.random() - 0.5);
        
        // Combinar: Lunes primero, luego los demás días
        const disponibilidadOrdenada = [...disponibilidadLunes, ...otrosDiasMezclados];
        
        // Por cada bloque de disponibilidad (lunes primero), intentar crear un horario (sin conflictos)
        for (const disponibilidad of disponibilidadOrdenada) {
          // Verificar si ya tenemos suficientes horas para este curso
          const horasAsignadasYa = await prisma.horarioAsignado.count({
            where: {
              id_docente: docente.id_docente,
              id_curso: curso.id_curso,
              id_periodo: parseInt(id_periodo),
              tipo_clase: docenteCurso.tipo_clase
            }
          });

          // Si ya tenemos suficientes horas, parar
          if (horasAsignadasYa >= horasRequeridas) {
            console.log(`    ✅ Ya hay suficientes horas para este curso (${horasAsignadasYa}/${horasRequeridas})`);
            break;
          }

          // Generar claves únicas para verificar conflictos
          const claveDocente = `${docente.id_docente}_${disponibilidad.dia_semana}_${disponibilidad.hora_inicio}`;
          
          // Si el docente ya tiene un horario a esta hora, saltar
          if (horariosOcupadosDocente.has(claveDocente)) {
            console.log(`    ⏭️ Docente ya ocupado a esta hora (${disponibilidad.dia_semana} ${disponibilidad.hora_inicio}), saltando...`);
            continue;
          }
          
          // Verificar si esta día-hora ya tiene más de 4 horarios
          const claveDiaHora = `${disponibilidad.dia_semana}_${disponibilidad.hora_inicio}`;
          const horariosEnEstaHora = horariosPorDiaHora.get(claveDiaHora) || 0;
          
          if (horariosEnEstaHora >= 4) {
            console.log(`    ⏭️ Esta hora ya tiene ${horariosEnEstaHora} horarios (máx 4), saltando...`);
            continue;
          }

          // Buscar un ambiente disponible para esta hora (usando la lista mezclada)
          let ambienteSeleccionado = null;
          let claveAmbiente = null;
          
          for (const ambiente of ambientesMezclados) {
            const testClaveAmbiente = `${ambiente.id_ambiente}_${disponibilidad.dia_semana}_${disponibilidad.hora_inicio}`;
            if (!horariosOcupadosAmbiente.has(testClaveAmbiente)) {
              ambienteSeleccionado = ambiente;
              claveAmbiente = testClaveAmbiente;
              break;
            }
          }
          
          if (!ambienteSeleccionado) {
            console.log(`    ⏭️ No hay ambientes disponibles a esta hora (${disponibilidad.dia_semana} ${disponibilidad.hora_inicio}), saltando...`);
            continue;
          }

          console.log(`    🎯 Encontrado: Ambiente ${ambienteSeleccionado.codigo} disponible`);
          
          try {
            const nuevoHorario = await prisma.horarioAsignado.create({
              data: {
                id_docente: docente.id_docente,
                id_curso: curso.id_curso,
                id_grupo: grupoSeleccionado.id_grupo,
                tipo_clase: docenteCurso.tipo_clase,
                id_ambiente: ambienteSeleccionado.id_ambiente,
                dia_semana: disponibilidad.dia_semana,
                hora_inicio: disponibilidad.hora_inicio,
                hora_fin: disponibilidad.hora_fin,
                id_periodo: parseInt(id_periodo),
                estado: 'confirmado'
              },
              include: {
                docente: true,
                curso: true,
                grupo: true,
                ambiente: true
              }
            });
            
            // Marcar horarios como ocupados para evitar conflictos
            horariosOcupadosDocente.add(claveDocente);
            horariosOcupadosAmbiente.add(claveAmbiente!);
            
            // Incrementar contador de horarios por día-hora
            const claveDiaHoraCreado = `${disponibilidad.dia_semana}_${disponibilidad.hora_inicio}`;
            const currentCount = horariosPorDiaHora.get(claveDiaHoraCreado) || 0;
            horariosPorDiaHora.set(claveDiaHoraCreado, currentCount + 1);
            
            console.log(`    ✅ Horario creado: Día ${disponibilidad.dia_semana} ${disponibilidad.hora_inicio}-${disponibilidad.hora_fin} (Ambiente: ${ambienteSeleccionado.codigo})`);
            totalHorariosCreados++;
            
          } catch (error) {
            console.log(`    ⚠️ Error al crear horario:`, (error as any).message);
          }
        }
      }
    }

    console.log(`\n🎉 Total horarios creados (sin conflictos): ${totalHorariosCreados}`);

    // Diferencia entre modos
    let message = "";
    const ahora = new Date();
    let fechaFinIntervalo: Date | null = null;

    if (modo === "automatico") {
      message = `Asignación completamente automática completada! ${totalHorariosCreados} horarios creados exitosamente (sin conflictos).`;
    } else if (modo === "intervalo") {
      fechaFinIntervalo = new Date(ahora.getTime() + intervalo_minutos * 60000);
      message = `Asignación automática completada! ${totalHorariosCreados} horarios creados. Los docentes podrán realizar cambios hasta ${fechaFinIntervalo.toLocaleTimeString()}.`;
    }

    return NextResponse.json(
      { 
        message,
        docentes_count: docentesOrdenados.length,
        horarios_creados: totalHorariosCreados,
        modo,
        intervalo_minutos: modo === "intervalo" ? intervalo_minutos : null,
        fecha_inicio: ahora.toISOString(),
        fecha_fin_intervalo: fechaFinIntervalo?.toISOString() || null
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("❌ Error en asignación automática:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", message: error.message },
      { status: 500 }
    );
  }
}
