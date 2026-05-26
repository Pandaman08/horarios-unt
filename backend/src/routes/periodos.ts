import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const periodos = await prisma.periodoAcademico.findMany({
      orderBy: { id_periodo: 'desc' }
    });
    res.json(periodos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener periodos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const periodo = await prisma.periodoAcademico.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        anio: parseInt(data.anio),
        semestre: parseInt(data.semestre),
        fecha_inicio: new Date(data.fecha_inicio + 'T00:00:00'),
        fecha_fin: new Date(data.fecha_fin + 'T23:59:59'),
        fecha_inicio_clases: data.fecha_inicio_clases ? new Date(data.fecha_inicio_clases + 'T00:00:00') : null,
        fecha_fin_clases: data.fecha_fin_clases ? new Date(data.fecha_fin_clases + 'T23:59:59') : null,
        estado: data.estado || 'planificacion',
        activo: true
      }
    });
    res.json(periodo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear periodo' });
  }
});

export default router;
