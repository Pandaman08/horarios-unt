import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { id_periodo, stats } = req.query;

    if (stats === 'true') {
      const totalVentanas = await prisma.ventanaAtencion.count();
      const completadas = await prisma.ventanaAtencion.count({ where: { completado: true } });
      const activas = await prisma.ventanaAtencion.count({ where: { activo: true } });
      
      return res.json({
        total: totalVentanas,
        completadas,
        activas,
        pendientes: totalVentanas - completadas
      });
    }

    if (!id_periodo) {
      return res.status(400).json({ error: 'id_periodo es requerido' });
    }

    // Obtener ventanas de la BD
    const ventanas = await prisma.ventanaAtencion.findMany({
      where: { id_periodo: parseInt(id_periodo as string) },
      orderBy: { orden_prioridad: 'asc' }
    });

    // Obtener docentes para asociar con las ventanas (solo los que tienen grupos en el período)
    const docentes = await prisma.docente.findMany({
      where: { 
        activo: true,
        docente_cursos: {
          some: {
            activo: true,
            curso: {
              grupos: {
                some: {
                  id_periodo: parseInt(id_periodo as string)
                }
              }
            }
          }
        }
      },
      orderBy: [
        { modalidad: 'desc' }, // Nombrado primero
        { categoria: 'desc' }, // Principal primero
        { fecha_ingreso: 'asc' } // Más viejo primero
      ]
    });

    // Asociar cada ventana con un docente
    const ventanasConDocentes = ventanas.map((ventana, index) => ({
      ...ventana,
      docente: docentes[index] || null
    }));

    res.json({ ventanas: ventanasConDocentes });

  } catch (error: any) {
    console.error('Error al obtener ventanas:', error);
    res.status(500).json({ error: 'Error interno del servidor', message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id_periodo, programacion_automatica, ...data } = req.body;
    
    if (programacion_automatica) {
      // Lógica simplificada de programación automática
      // En una implementación real, esto crearía múltiples ventanas
      const nuevaVentana = await prisma.ventanaAtencion.create({
        data: {
          id_periodo: parseInt(id_periodo),
          fecha: new Date(data.fecha_inicio),
          hora_inicio: data.hora_inicio_jornada,
          hora_fin: data.hora_fin_jornada,
          modalidad: 'todos',
          categoria: 'todos',
          orden_prioridad: 1,
          intervalo_minutos: parseInt(data.intervalo_por_docente),
          activo: true,
          completado: false
        }
      });
      return res.json(nuevaVentana);
    }

    const ventana = await prisma.ventanaAtencion.create({
      data: {
        ...data,
        id_periodo: parseInt(id_periodo),
        fecha: new Date(data.fecha),
        activo: true,
        completado: false
      }
    });
    res.json(ventana);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear ventana' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.ventanaAtencion.update({
      where: { id_ventana: parseInt(id) },
      data: { activo: false }
    });
    res.json({ message: 'Ventana eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar ventana' });
  }
});

export default router;
