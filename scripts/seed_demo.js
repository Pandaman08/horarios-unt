const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const contrasenaHash = await bcrypt.hash('123456', 10);

  console.log('Iniciando seeding de datos...');

  // 1. Usuarios y Docentes
  const usuarios = [
    { codigo: 'admin', nombres: 'Admin', apellidos: 'Sistema', correo: 'admin@unt.edu.pe', rol: 'administrador_sistema' },
    { codigo: 'operador', nombres: 'Juan', apellidos: 'Perez', correo: 'operador@unt.edu.pe', rol: 'operador_horarios' },
    { codigo: '1001', nombres: 'Roberto', apellidos: 'García', correo: 'roberto@unt.edu.pe', rol: 'docente', modalidad: 'nombrado', categoria: 'principal' },
    { codigo: '1002', nombres: 'María', apellidos: 'López', correo: 'maria@unt.edu.pe', rol: 'docente', modalidad: 'nombrado', categoria: 'asociado' },
    { codigo: '1003', nombres: 'Carlos', apellidos: 'Sánchez', correo: 'carlos@unt.edu.pe', rol: 'docente', modalidad: 'contratado', categoria: 'auxiliar' },
  ];

  for (const u of usuarios) {
    const user = await prisma.usuario.upsert({
      where: { codigo: u.codigo },
      update: {},
      create: {
        codigo: u.codigo,
        nombres: u.nombres,
        apellidos: u.apellidos,
        correo_electronico: u.correo,
        contrasena_hash: contrasenaHash,
        rol: u.rol,
      }
    });

    if (u.rol === 'docente') {
      await prisma.docente.upsert({
        where: { codigo_docente: u.codigo },
        update: {},
        create: {
          id_usuario: user.id_usuario,
          codigo_docente: u.codigo,
          nombres: u.nombres,
          apellidos: u.apellidos,
          modalidad: u.modalidad,
          categoria: u.categoria,
          correo_electronico: u.correo,
          fecha_ingreso: new Date(new Date().getFullYear() - (Math.floor(Math.random() * 20) + 1), 0, 1),
        }
      });
    }
  }

  // 2. Periodo
  const periodo = await prisma.periodoAcademico.upsert({
    where: { codigo: '2026-I' },
    update: {},
    create: {
      codigo: '2026-I',
      nombre: 'Semestre Académico 2026-I',
      anio: 2026,
      semestre: 1,
      fecha_inicio: new Date('2026-04-01'),
      fecha_fin: new Date('2026-08-31'),
      estado: 'planificacion'
    }
  });

  // 3. Ambientes
  const ambientes = [
    { codigo: 'S101', nombre: 'Sala de Cómputo 101', tipo: 'laboratorio', capacidad: 30 },
    { codigo: 'S102', nombre: 'Sala de Cómputo 102', tipo: 'laboratorio', capacidad: 25 },
    { codigo: 'A201', nombre: 'Aula Magna 201', tipo: 'aula', capacidad: 60 },
    { codigo: 'A202', nombre: 'Aula 202', tipo: 'aula', capacidad: 40 },
  ];

  for (const a of ambientes) {
    await prisma.ambiente.upsert({
      where: { codigo: a.codigo },
      update: {},
      create: a
    });
  }

  // 4. Cursos
  const cursos = [
    { codigo: 'ISW-01', nombre: 'Ingeniería de Software I', creditos: 4, horas_teoria: 3, horas_laboratorio: 2, ciclo: 5 },
    { codigo: 'ISW-02', nombre: 'Base de Datos I', creditos: 4, horas_teoria: 2, horas_laboratorio: 4, ciclo: 6 },
    { codigo: 'ISW-03', nombre: 'Redes de Computadoras', creditos: 3, horas_teoria: 2, horas_laboratorio: 2, ciclo: 7 },
  ];

  for (const c of cursos) {
    await prisma.curso.upsert({
      where: { codigo: c.codigo },
      update: {},
      create: c
    });
  }

  console.log('Seeding completado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
