import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const cursos = await prisma.curso.findMany({
      where: { activo: true },
      include: {
        ciclo_rel: true,
        curso_ambientes: {
          include: {
            ambiente: true
          }
        }
      },
      orderBy: { codigo: 'asc' }
    });
    res.json(cursos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cursos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const curso = await prisma.curso.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        horas_teoria: parseInt(data.horas_teoria) || 0,
        horas_laboratorio: parseInt(data.horas_laboratorio) || 0,
        horas_practica: parseInt(data.horas_practica) || 0,
        creditos: parseInt(data.creditos) || 0,
        id_ciclo: data.id_ciclo ? parseInt(data.id_ciclo) : null,
        tipo_curso: data.tipo_curso || "linea_carrera",
        plan_estudios: data.plan_estudios,
        prerequisitos: data.prerequisitos,
        activo: true
      }
    });

    // Asignar ambientes automáticos según horas
    if (parseInt(data.horas_teoria) > 0) {
      const aulasTeoria = await prisma.ambiente.findMany({ where: { tipo: 'teoria', activo: true }, take: 1 });
      if (aulasTeoria.length > 0) {
        await prisma.cursoAmbiente.create({
          data: { id_curso: curso.id_curso, id_ambiente: aulasTeoria[0].id_ambiente, tipo_clase: 'teoria' }
        });
      }
    }
    if (parseInt(data.horas_laboratorio) > 0) {
      const laboratorios = await prisma.ambiente.findMany({ where: { tipo: 'laboratorio', activo: true }, take: 1 });
      if (laboratorios.length > 0) {
        await prisma.cursoAmbiente.create({
          data: { id_curso: curso.id_curso, id_ambiente: laboratorios[0].id_ambiente, tipo_clase: 'laboratorio' }
        });
      }
    }
    if (parseInt(data.horas_practica) > 0) {
      const aulasTeoria = await prisma.ambiente.findMany({ where: { tipo: 'teoria', activo: true }, take: 1 });
      if (aulasTeoria.length > 0) {
        await prisma.cursoAmbiente.create({
          data: { id_curso: curso.id_curso, id_ambiente: aulasTeoria[0].id_ambiente, tipo_clase: 'practica' }
        });
      }
    }

    res.json(curso);
  } catch (error) {
    console.error("Error al crear curso:", error);
    res.status(500).json({ error: 'Error al crear curso' });
  }
});

export default router;
