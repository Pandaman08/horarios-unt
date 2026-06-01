import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes } from "date-fns";

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
    
    // VALIDAR QUE EL PERÍODO ESTÉ ACTIVO ANTES DE CONTINUAR
    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: parseInt(id_periodo) }
    });
    
    if (!periodo) {
      return NextResponse.json(
        { error: "Período no encontrado" },
        { status: 404 }
      );
    }
    
    if (!periodo.activo) {
      return NextResponse.json(
        { error: "Este período ya está cerrado o finalizado. No se puede realizar la asignación." },
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
    await prisma.$transaction(async (tx: any) => {
      await tx.horarioAsignado.deleteMany({
        where: { id_periodo: parseInt(id_periodo) }
      });
      await tx.ventanaAtencion.deleteMany({
        where: { id_periodo: parseInt(id_periodo) }
      });
    });

    // Paso 1: Obtener docentes con disponibilidad y cursos, y TODOS los ambientes
    console.log("📋 Obteniendo docentes y ambientes...");
    const [docentes, ambientes] = await Promise.all([
      prisma.docente.findMany({
        where: { 
          activo: true,
          docente_cursos: {
            some: {
              activo: true,
              curso: {
                grupos: {
                  some: {
                    id_periodo: parseInt(id_periodo)
                  }
                }
              }
            }
          }
        },
        include: {
          disponibilidad: {
            where: { id_periodo: parseInt(id_periodo), disponible: true }
          },
          docente_cursos: {
            where: { 
              activo: true,
              curso: {
                grupos: {
                  some: {
                    id_periodo: parseInt(id_periodo)
                  }
                }
              }
            },
            include: { curso: true }
          }
        }
      }),
      prisma.ambiente.findMany({ where: { activo: true } })
    ]);

    console.log(`✅ Docentes encontrados: ${docentes.length}`);

    // Fecha actual para cálculos de intervalo
    const ahora = new Date();

    // Ordenar docentes por prioridades:
    const prioridadCategoria = ["jefe_practica", "auxiliar", "asociado", "principal"];
    const docentesOrdenados = [...docentes].sort((a, b) => {
      if (a.modalidad === "nombrado" && b.modalidad !== "nombrado") return -1;
      if (b.modalidad === "nombrado" && a.modalidad !== "nombrado") return 1;
      
      const catA = prioridadCategoria.indexOf(a.categoria);
      const catB = prioridadCategoria.indexOf(b.categoria);
      if (catA !== catB) return catB - catA;
      
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
    const horariosOcupadosDocente = new Set<string>();
    const horariosOcupadosAmbiente = new Set<string>();
    const horariosPorDiaHora = new Map<string, number>();

    // Paso 2: Si es MODO INTERVALO, creamos VENTANAS DE TIEMPO POR DOCENTE
    let ventanasCreadas: any[] = [];
    
    if (modo === "intervalo") {
      console.log("\n⏰ Creando ventanas de tiempo por docente...");
      
      let horaActualVentana = hora_inicio || "08:00";
      let fechaActualVentana = new Date(ahora);
      
      // Parsear hora de inicio
      const [horas, minutos] = horaActualVentana.split(':').map(Number);
      fechaActualVentana.setHours(horas, minutos, 0, 0);
      
      for (let i = 0; i < docentesOrdenados.length; i++) {
        const docente = docentesOrdenados[i];
        
        // Calcular hora de fin
        const horaInicioVentana = `${String(fechaActualVentana.getHours()).padStart(2, '0')}:${String(fechaActualVentana.getMinutes()).padStart(2, '0')}`;
        const fechaFinVentana = addMinutes(fechaActualVentana, intervalo_minutos || 15);
        const horaFinVentana = `${String(fechaFinVentana.getHours()).padStart(2, '0')}:${String(fechaFinVentana.getMinutes()).padStart(2, '0')}`;
        
        // Crear ventana
        const ventana = await prisma.ventanaAtencion.create({
          data: {
            id_periodo: parseInt(id_periodo),
            fecha: new Date(fechaActualVentana),
            hora_inicio: horaInicioVentana,
            hora_fin: horaFinVentana,
            modalidad: docente.modalidad,
            categoria: docente.categoria,
            orden_prioridad: i + 1,
            intervalo_minutos: intervalo_minutos || 15,
            cantidad_docentes: 1,
            activo: true
          }
        });
        
        ventanasCreadas.push({
          ...ventana,
          docente: {
            id_docente: docente.id_docente,
            nombres: docente.nombres,
            apellidos: docente.apellidos
          }
        });
        
        console.log(`  ✅ Ventana ${i + 1}: ${docente.nombres} ${docente.apellidos} - ${horaInicioVentana} a ${horaFinVentana}`);
        
        // Actualizar para el siguiente docente
        fechaActualVentana = fechaFinVentana;
      }
      
      console.log(`\n✅ Total ventanas creadas: ${ventanasCreadas.length}`);
    }

    // Paso 3: SOLO CREAR HORARIOS EN MODO AUTOMATICO
    // En modo INTERVALO, NO CREAMOS NINGÚN HORARIO - cada docente crea el suyo durante su ventana
    let totalHorariosCreados = 0;

    if (modo === "automatico") {
      console.log("\n🔄 Modo AUTOMÁTICO: creando horarios para todos los docentes...");
      
      for (const docente of docentesOrdenados) {
        console.log(`\n👉 Procesando docente: ${docente.nombres} ${docente.apellidos}`);
        
        for (const docenteCurso of docente.docente_cursos) {
          const curso = docenteCurso.curso;
          console.log(`  📚 Curso: ${curso.nombre} (${docenteCurso.tipo_clase})`);
          
          // Obtener todos los ambientes del tipo apropiado (aula para teoría, laboratorio para laboratorio)
          const ambientesValidos = ambientes.filter((a: any) => {
            if (docenteCurso.tipo_clase.toLowerCase() === 'teoria') {
              return a.tipo === 'aula' || a.tipo === 'auditorio';
            } else if (docenteCurso.tipo_clase.toLowerCase() === 'laboratorio') {
              return a.tipo === 'laboratorio';
            } else { // practica
              return a.tipo === 'aula' || a.tipo === 'laboratorio' || a.tipo === 'auditorio';
            }
          });
            
          const ambientesMezclados = [...ambientesValidos].sort(() => Math.random() - 0.5);
            
          console.log(`    📍 Ambientes disponibles: ${ambientesMezclados.length}`);
          
          if (ambientesMezclados.length === 0) {
            console.log(`    ⚠️ No hay ambientes para este tipo de clase, saltando...`);
            continue;
          }

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

          const disponibilidadDocente = docente.disponibilidad;
          console.log(`    ⏰ Disponibilidad: ${disponibilidadDocente.length} bloques`);

          if (disponibilidadDocente.length === 0) {
            console.log(`    ⚠️ No hay disponibilidad, saltando...`);
            continue;
          }

          const grupoSeleccionado = grupos[0];

          const horasRequeridas = docenteCurso.tipo_clase === 'teoria' ? curso.horas_teoria :
                                   docenteCurso.tipo_clase === 'laboratorio' ? curso.horas_laboratorio :
                                   curso.horas_practica;

          console.log(`    ⏱️ Horas requeridas: ${horasRequeridas}`);
          
          const disponibilidadOrdenada = [...disponibilidadDocente].sort(() => Math.random() - 0.5);
          
          for (const disponibilidad of disponibilidadOrdenada) {
            const horasAsignadasYa = await prisma.horarioAsignado.count({
              where: {
                id_docente: docente.id_docente,
                id_curso: curso.id_curso,
                id_periodo: parseInt(id_periodo),
                tipo_clase: docenteCurso.tipo_clase
              }
            });

            if (horasAsignadasYa >= horasRequeridas) {
              console.log(`    ✅ Ya hay suficientes horas para este curso (${horasAsignadasYa}/${horasRequeridas})`);
              break;
            }

            const claveDocente = `${docente.id_docente}_${disponibilidad.dia_semana}_${disponibilidad.hora_inicio}`;
            
            if (horariosOcupadosDocente.has(claveDocente)) {
              console.log(`    ⏭️ Docente ya ocupado a esta hora (${disponibilidad.dia_semana} ${disponibilidad.hora_inicio}), saltando...`);
              continue;
            }
            
            const claveDiaHora = `${disponibilidad.dia_semana}_${disponibilidad.hora_inicio}`;
            const horariosEnEstaHora = horariosPorDiaHora.get(claveDiaHora) || 0;
            
            if (horariosEnEstaHora >= 4) {
              console.log(`    ⏭️ Esta hora ya tiene ${horariosEnEstaHora} horarios (máx 4), saltando...`);
              continue;
            }

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
              const estadoHorario = 'confirmado';
              
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
                  estado: estadoHorario
                },
                include: {
                  docente: true,
                  curso: true,
                  grupo: true,
                  ambiente: true
                }
              });
              
              horariosOcupadosDocente.add(claveDocente);
              horariosOcupadosAmbiente.add(claveAmbiente!);
              
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

      console.log(`\n🎉 Total horarios creados en modo automático: ${totalHorariosCreados}`);
    } else if (modo === "intervalo") {
      console.log("\n⏰ Modo INTERVALO: NO se crean horarios automáticamente. Cada docente creará su horario durante su ventana.");
    }

    let message = "";
    let fechaFinIntervalo: Date | null = null;

    if (modo === "automatico") {
      message = `Asignación completamente automática completada! ${totalHorariosCreados} horarios creados exitosamente (sin conflictos).`;
    } else if (modo === "intervalo") {
      fechaFinIntervalo = new Date(ahora.getTime() + (intervalo_minutos || 15) * docentesOrdenados.length * 60000);
      message = `Modo intervalo configurado! ${ventanasCreadas.length} ventanas de tiempo creadas. Cada docente creará su propio horario durante su turno.`;
    }

    return NextResponse.json(
      { 
        message,
        docentes_count: docentesOrdenados.length,
        horarios_creados: totalHorariosCreados,
        ventanas_creadas: ventanasCreadas,
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
