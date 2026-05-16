import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);
  console.log('--- Iniciando Seed Centralizado ---');

  // 1. Catálogos Base (Siempre se ejecutan)
  const periodo = await prisma.periodoAcademico.upsert({
    where: { codigo: '2026-I' },
    update: {},
    create: {
      codigo: '2026-I',
      nombre: 'Semestre 2026-I',
      anio: 2026,
      semestre: 1,
      fecha_inicio: new Date('2026-04-01'),
      fecha_fin: new Date('2026-08-31'),
      estado: 'asignacion_horarios',
    },
  });

  const ambientes = [
    { codigo: 'S101', nombre: 'Lab de Cómputo 101', tipo: 'laboratorio', capacidad: 30 },
    { codigo: 'A201', nombre: 'Aula Magna 201', tipo: 'aula', capacidad: 50 },
  ];

  for (const a of ambientes) {
    await prisma.ambiente.upsert({ where: { codigo: a.codigo }, update: {}, create: a });
  }

  const cursos = [
    { codigo: 'ISW01', nombre: 'Ingeniería de Software II', creditos: 4, horas_teoria: 3, horas_laboratorio: 2 },
    { codigo: 'ISW02', nombre: 'Base de Datos I', creditos: 4, horas_teoria: 2, horas_laboratorio: 4 },
  ];

  for (const c of cursos) {
    await prisma.curso.upsert({ where: { codigo: c.codigo }, update: {}, create: c });
  }

  // 2. Usuarios y Docentes
  const docentesData = [
    { codigo: '1001', nombres: 'Roberto', apellidos: 'García', rol: 'docente', mod: 'nombrado', cat: 'principal', tel: '987654321' },
    { codigo: '1002', nombres: 'María', apellidos: 'López', rol: 'docente', mod: 'nombrado', cat: 'asociado', tel: '912345678' },
    { codigo: 'admin', nombres: 'Admin', apellidos: 'SGH', rol: 'administrador_sistema', correo: 'admin@unt.edu.pe' },
  ];

  for (const d of docentesData) {
    const user = await prisma.usuario.upsert({
      where: { codigo: d.codigo },
      update: {},
      create: {
        codigo: d.codigo,
        nombres: d.nombres,
        apellidos: d.apellidos,
        correo_electronico: d.correo || `${d.codigo}@unt.edu.pe`,
        contrasena_hash: passwordHash,
        rol: d.rol,
      },
    });

    if (d.rol === 'docente') {
      await prisma.docente.upsert({
        where: { codigo_docente: d.codigo },
        update: {},
        create: {
          id_usuario: user.id_usuario,
          codigo_docente: d.codigo,
          nombres: d.nombres,
          apellidos: d.apellidos,
          modalidad: d.mod!,
          categoria: d.cat!,
          telefono: d.tel,
          correo_electronico: user.correo_electronico,
        },
      });
    }
  }

  // --- SECCIONES MODULARES ---
  // Activa estas secciones según tu tarea asignada (puedes usar variables de entorno)

  if (process.env.SEED_REPORTES === 'true') {
    console.log('-> Insertando datos para Reportes (Estadísticas)');
    // Insertar muchas asignaciones para que los reportes tengan datos estadísticos
  }

  if (process.env.SEED_CONFLICTOS === 'true') {
    console.log('-> Insertando datos para Conflictos');
    // Insertar asignaciones cruzadas intencionalmente
  }

  if (process.env.SEED_NOTIFICACIONES === 'true') {
    console.log('-> Insertando datos para Notificaciones (Telegram)');
    // Insertar ventanas de atención próximas
  }

  console.log('--- Seed Finalizado ---');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
