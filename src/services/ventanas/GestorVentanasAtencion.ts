import { prisma } from '@/lib/prisma';
import { addMinutes, format } from 'date-fns';
import { ServicioNotificador } from '@/services/notificaciones/ServicioNotificador';

const prioridadCategoria = ['AUXILIAR', 'ASOCIADO', 'PRINCIPAL'];
const prioridadCondicion = ['ORDINARIO', 'CONTRATADO', 'EXTRAORDINARIO'];

export class GestorVentanasAtencion {
  static async obtenerDocentesAprobadosOrdenados(id_periodo: number) {
    const docentes = await prisma.docente.findMany({
      where: {
        activo: true,
        declaraciones_horarias: {
          some: {
            id_periodo,
            estado: {
              in: ['BORRADOR', 'LECTIVA_CONFIRMADA', 'ENVIADO', 'VALIDADO_DEPARTAMENTO', 'APROBADO']
            }
          }
        }
      }
    });

    return [...docentes].sort((a, b) => {
      const condA = a.condicion || 'ORDINARIO';
      const condB = b.condicion || 'ORDINARIO';
      const idxA = prioridadCondicion.indexOf(condA);
      const idxB = prioridadCondicion.indexOf(condB);
      if (idxA !== idxB) return idxA - idxB;

      const catA = a.categoriaDocente || 'AUXILIAR';
      const catB = b.categoriaDocente || 'AUXILIAR';
      const idxCatA = prioridadCategoria.indexOf(catA);
      const idxCatB = prioridadCategoria.indexOf(catB);
      if (idxCatA !== idxCatB) return idxCatB - idxCatA;

      if (a.fecha_ingreso && b.fecha_ingreso) {
        return new Date(a.fecha_ingreso).getTime() - new Date(b.fecha_ingreso).getTime();
      }
      return 0;
    });
  }

  /**
   * Calcula cuántos docentes hay por cada categoría y condición
   */
  static async obtenerEstadisticasDocentes() {
    const docentes = await prisma.docente.findMany({
      where: { activo: true },
      select: {
        condicion: true,
        categoriaDocente: true
      }
    });

    const stats: Record<string, Record<string, number>> = {
      ORDINARIO: { PRINCIPAL: 0, ASOCIADO: 0, AUXILIAR: 0 },
      CONTRATADO: { PRINCIPAL: 0, ASOCIADO: 0, AUXILIAR: 0 },
      EXTRAORDINARIO: { PRINCIPAL: 0, ASOCIADO: 0, AUXILIAR: 0 }
    };

    docentes.forEach((d: any) => {
      const cond = d.condicion || 'ORDINARIO';
      const cat = d.categoriaDocente || 'AUXILIAR';
      if (stats[cond] && stats[cond][cat] !== undefined) {
        stats[cond][cat]++;
      }
    });

    return stats;
  }

  /**
   * Programa automáticamente las ventanas de atención para un periodo
   */
  static async programarVentanasAutomaticas(params: {
    id_periodo: number;
    fecha_inicio: Date;
    hora_inicio_jornada: string; // "08:00"
    hora_fin_jornada: string;    // "18:00"
    intervalo_por_docente: number; // 15
  }) {
    const { id_periodo, fecha_inicio, hora_inicio_jornada, hora_fin_jornada, intervalo_por_docente } = params;
    
    console.log(`Iniciando programación automática: Periodo=${id_periodo}, FechaInicio=${format(fecha_inicio, 'yyyy-MM-dd')}`);

    // 1. Obtener docentes activos que tienen al menos un curso asignado
    const docentes = await prisma.docente.findMany({
      where: { 
        activo: true,
        docente_cursos: {
          some: {
            activo: true
          }
        }
      },
      orderBy: [
        { condicion: 'asc' }, 
        { categoriaDocente: 'asc' }, 
        { fecha_ingreso: 'asc' }
      ]
    });

    console.log(`Docentes elegibles encontrados: ${docentes.length}`);

    // 2. Identificar docentes que ya tienen una ventana programada
    // Usamos la cola de notificaciones como referencia de quién ya fue programado
    const notificacionesExistentes = await prisma.colaNotificaciones.findMany({
      where: {
        tipo_notificacion: 'recordatorio_24h'
      },
      select: { id_docente: true }
    });
    const idsDocentesConVentana = new Set(notificacionesExistentes.map((n: any) => n.id_docente || 0));

    // Filtrar la lista para quedarnos solo con los que NO tienen ventana
    const docentesSinVentana = docentes.filter((d:any) => !idsDocentesConVentana.has(d.id_docente));
    console.log(`Docentes sin ventana previa: ${docentesSinVentana.length}`);

    if (docentesSinVentana.length === 0) {
      console.log("No hay nuevos docentes que requieran programación de ventanas.");
      return [];
    }

    // 3. Obtener ventanas existentes para el periodo (solo para saber dónde continuar el horario)
    const ventanasExistentes = await prisma.ventanaAtencion.findMany({
      where: { id_periodo, activo: true }
    });

    // Agrupar solo los docentes que faltan por jerarquía
    const gruposParaProcesar = this.agruparDocentesPorJerarquia(docentesSinVentana);
    
    const ventanasCreadas = [];
    
    // Buscar la última ventana para continuar desde ahí si es posible
    let fechaActual = new Date(fecha_inicio);
    let horaActual = this.parseHora(hora_inicio_jornada, fechaActual);

    let horaLimite = this.parseHora(hora_fin_jornada, fechaActual);
    let prioridadActual = 1;

    if (ventanasExistentes.length > 0) {
      const ultimaVentana = [...ventanasExistentes].sort((a, b) => {
        const dateA = new Date(a.fecha).getTime() + this.timeToMinutes(a.hora_fin);
        const dateB = new Date(b.fecha).getTime() + this.timeToMinutes(b.hora_fin);
        return dateB - dateA;
      })[0];

      // Normalizar la fecha a date-only en zona local (medianoche local) para evitar
      // efectos de zona horaria al almacenar/leer fechas.
      const ut = new Date(ultimaVentana.fecha);
      fechaActual = new Date(ut.getFullYear(), ut.getMonth(), ut.getDate());
      horaActual = this.parseHora(ultimaVentana.hora_fin, fechaActual);
      prioridadActual = Math.max(...ventanasExistentes.map((v: any) => v.orden_prioridad || 0)) + 1;
    }

    horaLimite = this.parseHora(hora_fin_jornada, fechaActual);

    for (const grupo of gruposParaProcesar) {
      const { condicion, categoriaDocente, listaDocentes } = grupo;
      const numDocentes = listaDocentes.length;

      const minutosNecesarios = numDocentes * intervalo_por_docente;
      let minutosRestantes = minutosNecesarios;
      let docentesProcesadosEnGrupo = 0;

      while (minutosRestantes > 0) {
        // Calcular cuánto tiempo queda en la jornada de hoy
        const minutosDisponiblesHoy = (horaLimite.getTime() - horaActual.getTime()) / (1000 * 60);

        if (minutosDisponiblesHoy <= 0) {
          // Pasar al siguiente día hábil
          fechaActual = this.obtenerSiguienteDiaHabil(fechaActual);
          horaActual = this.parseHora(hora_inicio_jornada, fechaActual);
          horaLimite = this.parseHora(hora_fin_jornada, fechaActual);
          console.log(`Cambiando al siguiente día: ${format(fechaActual, 'yyyy-MM-dd')}`);
          continue;
        }

        const minutosAsignados = Math.min(minutosRestantes, minutosDisponiblesHoy);
        const horaFinVentana = addMinutes(horaActual, minutosAsignados);
        const cantidadDocentesEnEstaVentana = Math.ceil(minutosAsignados / intervalo_por_docente);
        
        // Seleccionar los docentes específicos para esta ventana
        const docentesParaEstaVentana = listaDocentes.slice(
          docentesProcesadosEnGrupo, 
          docentesProcesadosEnGrupo + cantidadDocentesEnEstaVentana
        );

        // Guardar solo la parte de fecha (medianoche local) para que al recuperar la
        // ventana desde la base de datos no haya desplazamientos de día por timezone.
        const fechaParaGuardar = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
        const ventana = await prisma.ventanaAtencion.create({
          data: {
            id_periodo,
            fecha: fechaParaGuardar,
            hora_inicio: format(horaActual, 'HH:mm'),
            hora_fin: format(horaFinVentana, 'HH:mm'),
            modalidad: condicion,
            categoria: categoriaDocente,
            orden_prioridad: prioridadActual++,
            intervalo_minutos: intervalo_por_docente,
            cantidad_docentes: cantidadDocentesEnEstaVentana,
            activo: true
          }
        });

        ventanasCreadas.push(ventana);
        
        // Programar notificaciones SOLO para los docentes de esta ventana (modo automático)
        await ServicioNotificador.programarNotificacionesVentana(
          ventana.id_ventana, 
          docentesParaEstaVentana.map(d => d.id_docente),
          true // esAutomatico = true
        );
        
        minutosRestantes -= minutosAsignados;
        docentesProcesadosEnGrupo += cantidadDocentesEnEstaVentana;
        horaActual = horaFinVentana;

        // Si terminamos la jornada, resetear para el día siguiente
        if (horaActual.getTime() >= horaLimite.getTime() && minutosRestantes > 0) {
          fechaActual = this.obtenerSiguienteDiaHabil(fechaActual);
          horaActual = this.parseHora(hora_inicio_jornada, fechaActual);
          horaLimite = this.parseHora(hora_fin_jornada, fechaActual);
          console.log(`Jornada terminada. Cambiando al siguiente día: ${format(fechaActual, 'yyyy-MM-dd')}`);
        }
      }
    }

    console.log(`Programación finalizada. Ventanas creadas: ${ventanasCreadas.length}`);
    return ventanasCreadas;
  }

  private static timeToMinutes(horaStr: string): number {
    const [h, m] = horaStr.split(':').map(Number);
    return h * 60 + m;
  }

  private static parseHora(horaStr: string, fechaRef: Date): Date {
    const [horas, minutos] = horaStr.split(':').map(Number);
    const fecha = new Date(fechaRef);
    fecha.setHours(horas, minutos, 0, 0);
    return fecha;
  }

  private static agruparDocentesPorJerarquia(docentes: any[]) {
    const jerarquiaCondicion = ['ORDINARIO', 'CONTRATADO', 'EXTRAORDINARIO'];
    const jerarquiaCategoria = ['PRINCIPAL', 'ASOCIADO', 'AUXILIAR'];
    const grupos = [];

    for (const cond of jerarquiaCondicion) {
      for (const cat of jerarquiaCategoria) {
        const lista = docentes.filter((d: any) => (d.condicion || 'ORDINARIO') === cond && (d.categoriaDocente || 'AUXILIAR') === cat);
        if (lista.length > 0) {
          grupos.push({ condicion: cond, categoriaDocente: cat, listaDocentes: lista });
        }
      }
    }
    return grupos;
  }

  private static obtenerSiguienteDiaHabil(fecha: Date) {
    const nuevaFecha = new Date(fecha);
    do {
      nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    } while (nuevaFecha.getDay() === 0); // Omitir domingos (0)
    return nuevaFecha;
  }

  /**
   * Verifica si un docente tiene acceso en el momento actual
   * Usa timezone America/Lima para todas las comparaciones
   */
  static async verificarAccesoDocente(id_docente: number) {
    const docente = await prisma.docente.findUnique({
      where: { id_docente }
    });

    if (!docente) return { tieneAcceso: false, mensaje: "Docente no encontrado" };

    // PRIMERO: Verificar si el docente ya tiene horarios confirmados o asignados
    // Si tiene horarios, permitir acceso en modo solo lectura para verlos
    const horariosConfirmados = await prisma.horarioAsignado.findMany({
      where: {
        id_docente: id_docente,
        estado: {
          in: ["confirmado", "definitivo", "asignado", "publicado"]
        }
      },
      take: 1
    });

    if (horariosConfirmados.length > 0) {
      return { 
        tieneAcceso: true, 
        soloLectura: true,
        mensaje: "Viendo horario confirmado" 
      };
    }

    const periodoActivo = await prisma.periodoAcademico.findFirst({
      where: { activo: true },
      orderBy: { id_periodo: 'desc' }
    });

    if (!periodoActivo) {
      return { 
        tieneAcceso: false, 
        soloLectura: false,
        mensaje: 'No hay período activo' 
      };
    }

    // Obtener y ordenar docentes (misma lógica robusta y filtro exacto)
    const docentesOrdenados = await this.obtenerDocentesAprobadosOrdenados(periodoActivo.id_periodo);

    const indexDocente = docentesOrdenados.findIndex((d: any) => d.id_docente === id_docente);
    const ventanas = await prisma.ventanaAtencion.findMany({
      where: { id_periodo: periodoActivo.id_periodo },
      orderBy: { orden_prioridad: 'asc' }
    });

    // Obtener fecha/hora actual en Peru
    const ahora = new Date();
    const hoyLima = ahora.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
    const horaActualLima = ahora.toLocaleTimeString('en-GB', {
      timeZone: 'America/Lima',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const ahoraMin = (() => {
      const [h, m] = horaActualLima.split(':').map(Number);
      return h * 60 + m;
    })();

    if (indexDocente !== -1 && ventanas.length > indexDocente) {
      const ventana = ventanas[indexDocente];

      if (ventana.pausado) {
        return {
          tieneAcceso: false,
          soloLectura: true,
          mensaje: 'La venta de horarios está actualmente pausada por la administración. Intente nuevamente más tarde.'
        };
      }

      const fechaVentanaLima = new Date(ventana.fecha).toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
      const inicioMin = (() => {
        const [h, m] = ventana.hora_inicio.split(':').map(Number);
        return h * 60 + m;
      })();
      const finMin = (() => {
        const [h, m] = ventana.hora_fin.split(':').map(Number);
        return h * 60 + m;
      })();

      if (fechaVentanaLima > hoyLima) {
        return {
          tieneAcceso: false,
          soloLectura: false,
          mensaje: `Su turno está programado para el ${new Date(ventana.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} a las ${ventana.hora_inicio}.`
        };
      } else if (fechaVentanaLima < hoyLima) {
        return {
          tieneAcceso: false,
          soloLectura: true,
          mensaje: `Su turno correspondió al día ${new Date(ventana.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} a las ${ventana.hora_inicio} y ya finalizó. El sistema está en modo solo lectura.`
        };
      } else if (ahoraMin < inicioMin) {
        return {
          tieneAcceso: false,
          soloLectura: false,
          mensaje: `Su turno está programado para hoy a las ${ventana.hora_inicio}. Por favor, espere hasta la hora de inicio.`
        };
      } else if (ahoraMin >= inicioMin && ahoraMin < finMin) {
        const segundosRestantes = Math.max(0, (finMin - ahoraMin) * 60 - ahora.getSeconds());
        return {
          tieneAcceso: true,
          segundos_restantes: segundosRestantes,
          id_ventana: ventana.id_ventana
        };
      } else {
        return {
          tieneAcceso: false,
          soloLectura: true,
          mensaje: `Su ventana de atención finalizó a las ${ventana.hora_fin}. El sistema está en modo solo lectura.`
        };
      }
    }

    return {
      tieneAcceso: false,
      soloLectura: false,
      mensaje: `No tiene turnos programados en este periodo.`
    };
  }
}
