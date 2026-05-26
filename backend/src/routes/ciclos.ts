import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const ciclos = await prisma.ciclo.findMany({
      where: { activo: true },
      orderBy: { numero: 'asc' }
    });
    res.json(ciclos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ciclos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const ciclo = await prisma.ciclo.create({
      data: {
        numero: parseInt(data.numero.toString()),
        nombre: data.nombre,
        activo: true
      }
    });
    res.json(ciclo);
  } catch (error) {
    console.error("Error al crear ciclo:", error);
    res.status(500).json({ error: 'Error al crear ciclo' });
  }
});

export default router;
