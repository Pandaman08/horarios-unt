import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const ambientes = await prisma.ambiente.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(ambientes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ambientes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const ambiente = await prisma.ambiente.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        tipo: data.tipo,
        capacidad: parseInt(data.capacidad),
        piso: data.piso,
        pabellon: data.pabellon,
        equipamiento: data.equipamiento,
        caracteristicas: data.caracteristicas || {},
        activo: true
      }
    });
    res.json(ambiente);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear ambiente' });
  }
});

export default router;
