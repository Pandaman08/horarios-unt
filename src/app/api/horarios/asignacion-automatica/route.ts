import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMinutes } from "date-fns";
import { GestorVentanasAtencion } from "@/services/ventanas/GestorVentanasAtencion";

const ROLES_VENTANAS = ['administrador_sistema', 'operador_horarios'];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ROLES_VENTANAS.includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { id_periodo, hora_inicio, intervalo_minutos, modo, regenerar_ventanas = false } = body;

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

    // Borrar horarios existentes; las ventanas solo si se solicita regeneración completa
    console.log("🧹 Eliminando horarios antiguos...");
    await prisma.$transaction(async (tx: any) => {
      await tx.horarioAsignado.deleteMany({
        where: { id_periodo: parseInt(id_periodo) }
      });
      if (regenerar_ventanas) {
        await tx.ventanaAtencion.deleteMany({
          where: { id_periodo: parseInt(id_periodo) }
        });
      }
    });

    // Paso 1: Obtener docentes con carga horaria aprobada
    console.log("📋 Obteniendo docentes y ambientes...");
    const [docentesOrdenados, ambientes, ventanasExistentes] = await Promise.all([
      GestorVentanasAtencion.obtenerDocentesAprobadosOrdenados(parseInt(id_periodo)),
      prisma.ambiente.findMany({ where: { activo: true } }),
      prisma.ventanaAtencion.findMany({
        where: { id_periodo: parseInt(id_periodo), activo: true },
        orderBy: { orden_prioridad: 'asc' }
      })
    ]);

    if (docentesOrdenados.length === 0) {
      return NextResponse.json(
        { error: 'No hay docentes con carga horaria aprobada para este período' },
        { status: 400 }
      );
    }

    const docentes = await prisma.docente.findMany({
      where: {
        id_docente: { in: docentesOrdenados.map((d) => d.id_docente) }
      },
      include: {
        disponibilidad: {
          where: { id_periodo: parseInt(id_periodo), disponible: true }
        },
        declaraciones_horarias: {
          where: { id_periodo: parseInt(id_periodo), estado: "APROBADO" },
          include: {
            cargas_lectivas: {
              include: { curso: true }
            }
          }
        }
      }
    });

    const docentesMap = new Map(docentes.map((d: { id_docente: number }) => [d.id_docente, d]));
    const docentesConDatos = docentesOrdenados
      .map((d: { id_docente: number }) => docentesMap.get(d.id_docente))
      .filter(Boolean) as typeof docentes;

    // Mostrar el orden de prioridad
    console.log(`✅ Docentes encontrados: ${docentesConDatos.length}`);
    console.log("\n📊 Orden de prioridad de docentes:");
    docentesConDatos.forEach((doc: typeof docentes[number], index: number) => {
      const antiguedad = doc.fecha_ingreso 
        ? new Date().getFullYear() - new Date(doc.fecha_ingreso).getFullYear()
        : 0;
      console.log(`  ${index + 1}. ${doc.nombres} ${doc.apellidos} - Condición: ${doc.condicion} - Categoría: ${doc.categoriaDocente} - Antigüedad: ${antiguedad} años`);
    });

    // Variables para trackear qué horarios ya están ocupados
    const horariosOcupadosDocente = new Set<string>();
    const horariosOcupadosAmbiente = new Set<string>();
    const horariosPorDiaHora = new Map<string, number>();

    // Paso 2: Crear ventanas solo para docentes aprobados que aún no tienen ventana
    let ventanasCreadas: any[] = [];
    
    if (modo === "intervalo" || modo === "automatico") {
      console.log("\n⏰ Creando ventanas de tiempo por docente...");
      
      const ahora = new Date();
      const docentesSinVentana = docentesConDatos.slice(
        regenerar_ventanas ? 0 : ventanasExistentes.length
      );

      let fechaActualVentana = new Date(ahora);
      let horaActualVentana = hora_inicio || "08:00";
      let ordenPrioridad = regenerar_ventanas
        ? 1
        : (ventanasExistentes[ventanasExistentes.length - 1]?.orden_prioridad || 0) + 1;

      if (!regenerar_ventanas && ventanasExistentes.length > 0) {
        const ultima = ventanasExistentes[ventanasExistentes.length - 1];
        fechaActualVentana = new Date(ultima.fecha);
        horaActualVentana = ultima.hora_fin;
      } else {
        const [horas, minutos] = horaActualVentana.split(':').map(Number);
        fechaActualVentana.setHours(horas, minutos, 0, 0);
      }

      for (let i = 0; i < docentesSinVentana.length; i++) {
        const docente = docentesSinVentana[i];
        
        const horaInicioVentana = `${String(fechaActualVentana.getHours()).padStart(2, '0')}:${String(fechaActualVentana.getMinutes()).padStart(2, '0')}`;
        const fechaFinVentana = addMinutes(fechaActualVentana, intervalo_minutos || 15);
        const horaFinVentana = `${String(fechaFinVentana.getHours()).padStart(2, '0')}:${String(fechaFinVentana.getMinutes()).padStart(2, '0')}`;
        
        const ventana = await prisma.ventanaAtencion.create({
          data: {
            id_periodo: parseInt(id_periodo),
            fecha: new Date(fechaActualVentana),
            hora_inicio: horaInicioVentana,
            hora_fin: horaFinVentana,
            modalidad: docente.condicion,
            categoria: docente.categoriaDocente,
            orden_prioridad: ordenPrioridad++,
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
        
        console.log(`  ✅ Ventana ${ordenPrioridad - 1}: ${docente.nombres} ${docente.apellidos} - ${horaInicioVentana} a ${horaFinVentana}`);
        fechaActualVentana = fechaFinVentana;
      }
      
      console.log(`\n✅ Total ventanas creadas: ${ventanasCreadas.length}`);
    }

    // Paso 3: SOLO CREAR HORARIOS EN MODO AUTOMATICO
    // En modo INTERVALO, NO CREAMOS NINGÚN HORARIO - cada docente crea el suyo durante su ventana
    let totalHorariosCreados = 0;

    if (modo === "automatico") {
      console.log("\n🔄 Modo AUTOMÁTICO: creando horarios para todos los docentes...");
      
      for (const docente of docentesConDatos) {
        console.log(`\n👉 Procesando docente: ${docente.nombres} ${docente.apellidos}`);
        
        for (const declaracion of docente.declaraciones_horarias) {
          for (const cargaLectiva of declaracion.cargas_lectivas) {
            const curso = cargaLectiva.curso;
            console.log(`  📚 Curso: ${curso.nombre} (${cargaLectiva.tipo_clase})`);
          
          // Obtener todos los ambientes del tipo apropiado (aula para teoría, laboratorio para laboratorio)
          const ambientesValidos = ambientes.filter((a: any) => {
            if (cargaLectiva.tipo_clase.toLowerCase() === 'teoria') {
              return a.tipo === 'aula' || a.tipo === 'auditorio';
            } else if (cargaLectiva.tipo_clase.toLowerCase() === 'laboratorio') {
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

          // Para carga lectiva, usamos las horas que ya están definidas en la carga lectiva
          const horasRequeridas = cargaLectiva.horas_semanales * cargaLectiva.grupos_asignados;

          console.log(`    ⏱️ Horas requeridas: ${horasRequeridas}`);
          
          const disponibilidadOrdenada = [...disponibilidadDocente].sort(() => Math.random() - 0.5);
          
          for (const disponibilidad of disponibilidadOrdenada) {
            const horasAsignadasYa = await prisma.horarioAsignado.count({
              where: {
                id_docente: docente.id_docente,
                id_curso: curso.id_curso,
                id_periodo: parseInt(id_periodo),
                tipo_clase: cargaLectiva.tipo_clase
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
                  tipo_clase: cargaLectiva.tipo_clase,
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
      }

      console.log(`\n🎉 Total horarios creados en modo automático: ${totalHorariosCreados}`);
    } else if (modo === "intervalo") {
      console.log("\n⏰ Modo INTERVALO: NO se crean horarios automáticamente. Cada docente creará su horario durante su ventana.");
    }

    const ahora = new Date();
    let message = "";
    let fechaFinIntervalo: Date | null = null;

    if (modo === "automatico") {
      message = `Asignación completamente automática completada! ${totalHorariosCreados} horarios creados exitosamente (sin conflictos).`;
    } else if (modo === "intervalo") {
      fechaFinIntervalo = new Date(ahora.getTime() + (intervalo_minutos || 15) * docentesConDatos.length * 60000);
      message = `Modo intervalo configurado! ${ventanasCreadas.length} ventanas de tiempo creadas. Cada docente creará su propio horario durante su turno.`;
    }

    return NextResponse.json(
      { 
        message,
        docentes_count: docentesConDatos.length,
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
