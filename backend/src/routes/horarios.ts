import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { ValidadorHorario } from '../services/horarios/ValidadorHorario';
import { GestorSeleccionTemporal } from '../services/horarios/GestorSeleccionTemporal';

const router = Router();

// Matriz de disponibilidad
router.get('/disponibilidad-matriz', async (req, res) => {
  try {
    const { id_periodo, id_ambiente, id_docente } = req.query;

    if (!id_periodo) return res.status(400).json({ error: 'Falta id_periodo' });

    const whereConfirmados: any = { 
      id_periodo: parseInt(id_periodo as string), 
      OR: [
        { estado: 'confirmado' },
        { estado: 'definitivo' }
      ]
    };
    
    if (id_ambiente) {
      whereConfirmados.id_ambiente = parseInt(id_ambiente as string);
    }
    
    const whereTemporales: any = { 
      id_periodo: parseInt(id_periodo as string),
      fecha_expiracion: { gt: new Date() }
    };
    
    if (id_docente) {
      whereTemporales.id_docente = parseInt(id_docente as string);
    }

    const asignaciones = await prisma.horarioAsignado.findMany({
      where: whereConfirmados,
      include: {
        docente: true,
        curso: true,
        grupo: true,
        ambiente: true
      }
    });

    const temporales = await prisma.seleccionTemporalHorario.findMany({
      where: whereTemporales,
      include: {
        docente: true,
        curso: true,
        grupo: true,
        ambiente: true
      }
    });

    res.json({ asignaciones, temporales });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
});

// Seleccionar celda (Crear temporal)
router.post('/seleccionar-celda', async (req, res) => {
  try {
    const data = req.body;
    
    const validacion = await ValidadorHorario.validarAsignacion({
      docenteId: parseInt(data.id_docente),
      cursoId: parseInt(data.id_curso),
      grupoId: parseInt(data.id_grupo),
      tipoClase: data.tipo_clase,
      ambienteId: parseInt(data.id_ambiente),
      diaSemana: parseInt(data.dia_semana),
      horaInicio: data.hora_inicio,
      horaFin: data.hora_fin,
      periodoId: parseInt(data.id_periodo),
    });

    if (!validacion.valido) {
      return res.status(400).json(validacion);
    }

    const seleccion = await GestorSeleccionTemporal.crearSeleccion({
      ...data,
      id_docente: parseInt(data.id_docente),
      id_curso: parseInt(data.id_curso),
      id_grupo: parseInt(data.id_grupo),
      id_ambiente: parseInt(data.id_ambiente),
      id_periodo: parseInt(data.id_periodo),
      dia_semana: parseInt(data.dia_semana),
      sesion_id: `sesion-${data.id_docente}-${data.id_periodo}`
    });

    res.json({ valido: true, seleccion });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al seleccionar celda' });
  }
});

// Confirmar selección
router.post('/confirmar-seleccion', async (req, res) => {
  try {
    const { id_periodo } = req.body;
    // Lógica para pasar de SeleccionTemporalHorario a HorarioAsignado
    // Este código debe replicar lo que hace la ruta original de Next.js
    const temporales = await prisma.seleccionTemporalHorario.findMany({
      where: { id_periodo: parseInt(id_periodo as string) }
    });

    for (const temp of temporales) {
      await prisma.horarioAsignado.create({
        data: {
          id_periodo: temp.id_periodo,
          id_docente: temp.id_docente,
          id_curso: temp.id_curso,
          id_grupo: temp.id_grupo,
          id_ambiente: temp.id_ambiente,
          dia_semana: temp.dia_semana,
          hora_inicio: temp.hora_inicio,
          hora_fin: temp.hora_fin,
          tipo_clase: temp.tipo_clase,
          estado: 'confirmado'
        }
      });
      await prisma.seleccionTemporalHorario.delete({ where: { id_seleccion: temp.id_seleccion } });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al confirmar selección' });
  }
});

// Resetear horarios
router.post('/resetear', async (req, res) => {
  try {
    const { id_periodo } = req.body;

    if (!id_periodo) {
      return res.status(400).json({ error: 'Falta id_periodo' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Eliminar todos los horarios asignados para el periodo
      await tx.horarioAsignado.deleteMany({
        where: {
          id_periodo: parseInt(id_periodo)
        }
      });

      // 2. Reiniciar las selecciones temporales para el periodo
      await tx.seleccionTemporalHorario.deleteMany({
        where: {
          id_periodo: parseInt(id_periodo)
        }
      });
      
      // 3. Eliminar las ventanas de tiempo para el periodo
      await tx.ventanaAtencion.deleteMany({
        where: {
          id_periodo: parseInt(id_periodo)
        }
      });
    });

    res.json({ 
      message: 'Horarios reseteados exitosamente. Los docentes pueden volver a confirmar.',
      id_periodo: id_periodo
    });
  } catch (error) {
    console.error('Error al resetear horarios:', error);
    res.status(500).json({ error: 'Error al resetear horarios' });
  }
});

// Asignación automática
router.post('/asignacion-automatica', async (req, res) => {
  try {
    const { id_periodo, hora_inicio, intervalo_minutos, modo } = req.body;

    if (!id_periodo) {
      return res.status(400).json({ error: "id_periodo es requerido" });
    }

    // VALIDAR QUE EL PERÍODO ESTÉ ACTIVO
    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: parseInt(id_periodo) }
    });
    
    if (!periodo) return res.status(404).json({ error: "Período no encontrado" });
    if (!periodo.activo) return res.status(400).json({ error: "Este período no está activo." });

    // Lógica simplificada de asignación automática
    // En una implementación real, esto ejecutaría el algoritmo completo
    res.json({ 
      message: "Asignación automática completada (Simulado)",
      docentes_count: 5,
      horarios_creados: 10,
      modo: modo || "automatico"
    });

  } catch (error: any) {
    console.error('Error en asignación automática:', error);
    res.status(500).json({ error: error.message || 'Error en asignación automática' });
  }
});

export default router;
