import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const id_periodo = req.query.id_periodo as string;
    const id_curso = req.query.id_curso as string;

    const where: any = { activo: true };
    if (id_periodo) where.id_periodo = parseInt(id_periodo);
    if (id_curso) where.id_curso = parseInt(id_curso);

    const grupos = await prisma.grupo.findMany({
      where,
      include: {
        curso: true,
        periodo: true
      },
      orderBy: { codigo_grupo: 'asc' }
    });
    res.json(grupos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const grupo = await prisma.grupo.create({
      data: {
        id_curso: parseInt(data.id_curso),
        id_periodo: parseInt(data.id_periodo),
        codigo_grupo: data.codigo_grupo,
        capacidad_maxima: parseInt(data.capacidad_maxima) || 40,
        cantidad_matriculados: parseInt(data.cantidad_matriculados) || 0,
        activo: true
      }
    });
    res.json(grupo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear grupo' });
  }
});

export default router;
