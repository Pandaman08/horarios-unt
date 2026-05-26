import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const docentes = await prisma.docente.findMany({
      orderBy: { apellidos: 'asc' },
      include: {
        usuario: {
          select: {
            correo_electronico: true,
            rol: true
          }
        },
        docente_cursos: {
          include: {
            curso: true
          }
        }
      }
    });
    res.json(docentes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener docentes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // 1. Generar código si no viene
    let codigo_docente = data.codigo_docente;
    if (!codigo_docente) {
      const lastDocente = await prisma.docente.findFirst({
        orderBy: { id_docente: 'desc' },
        select: { codigo_docente: true }
      });
      let nextNumber = 1;
      if (lastDocente && lastDocente.codigo_docente) {
        const match = lastDocente.codigo_docente.match(/\d+$/);
        if (match) nextNumber = parseInt(match[0]) + 1;
      }
      const year = new Date().getFullYear().toString().slice(-2);
      codigo_docente = `D${year}${nextNumber.toString().padStart(4, '0')}`;
    }

    // 2. Crear Usuario
    const contrasena_hash = await bcrypt.hash(data.contrasena || 'docente123', 10);
    const usuario = await prisma.usuario.create({
      data: {
        codigo: codigo_docente,
        nombres: data.nombres,
        apellidos: data.apellidos,
        correo_electronico: data.correo_electronico,
        contrasena_hash,
        rol: 'docente',
        activo: true
      }
    });

    // 3. Crear Docente vinculado al usuario
    const docente = await prisma.docente.create({
      data: {
        codigo_docente,
        nombres: data.nombres,
        apellidos: data.apellidos,
        correo_electronico: data.correo_electronico,
        telefono: data.telefono,
        categoria: data.categoria,
        especialidad: data.especialidad,
        grado_academico: data.grado_academico,
        fecha_ingreso: data.fecha_ingreso ? new Date(data.fecha_ingreso) : null,
        id_usuario: usuario.id_usuario,
        activo: true
      }
    });

    res.json(docente);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El código o correo ya existe' });
    } else {
      res.status(500).json({ error: 'Error al crear docente y usuario' });
    }
  }
});

// Endpoint para listar disponibilidad
router.get('/disponibilidad/listar', async (req, res) => {
  try {
    const periodoId = req.query.periodoId as string;
    const search = (req.query.search as string) || "";
    const categoria = (req.query.categoria as string) || "todos";
    const modalidad = (req.query.modalidad as string) || "todos";
    const orden = (req.query.orden as string) || "antiguedad_desc";

    if (!periodoId) {
      return res.status(400).json({ error: "periodoId es obligatorio" });
    }

    const idPeriodo = parseInt(periodoId);

    const docentes = await prisma.docente.findMany({
      where: {
        activo: true,
        AND: [
          search ? {
            OR: [
              { nombres: { contains: search, mode: 'insensitive' } },
              { apellidos: { contains: search, mode: 'insensitive' } },
              { codigo_docente: { contains: search, mode: 'insensitive' } },
            ]
          } : {},
          categoria !== "todos" ? { 
            categoria: {
              equals: categoria,
              mode: 'insensitive'
            }
          } : {},
          modalidad !== "todos" ? { 
            modalidad: {
              equals: modalidad,
              mode: 'insensitive'
            }
          } : {},
        ]
      },
      include: {
        disponibilidad: {
          where: { id_periodo: idPeriodo },
          take: 1
        }
      }
    });

    const docentesFormateados = docentes.map(d => {
      let antiguedad = 0;
      if (d.fecha_ingreso) {
        const hoy = new Date();
        const ingreso = new Date(d.fecha_ingreso);
        antiguedad = hoy.getFullYear() - ingreso.getFullYear();
        if (hoy.getMonth() < ingreso.getMonth() || (hoy.getMonth() === ingreso.getMonth() && hoy.getDate() < ingreso.getDate())) {
          antiguedad--;
        }
      }

      return {
        id_docente: d.id_docente,
        codigo_docente: d.codigo_docente,
        nombres: d.nombres,
        apellidos: d.apellidos,
        dni: d.dni,
        categoria: d.categoria,
        modalidad: d.modalidad,
        antiguedad: d.fecha_ingreso ? antiguedad : null,
        tiene_disponibilidad: d.disponibilidad.length > 0
      };
    });

    docentesFormateados.sort((a, b) => {
      if (a.antiguedad === null) return 1;
      if (b.antiguedad === null) return -1;
      return orden === "antiguedad_asc" ? a.antiguedad - b.antiguedad : b.antiguedad - a.antiguedad;
    });

    res.json(docentesFormateados);
  } catch (error) {
    console.error("Error al listar docentes:", error);
    res.status(500).json({ error: "Error al listar docentes" });
  }
});

export default router;
