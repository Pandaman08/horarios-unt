import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);
  console.log('--- Iniciando Seed Centralizado ---');

  // ELIMINAR DATOS PREVIOS (Opcional, pero asegura que el seed sea limpio)
  console.log('-> Limpiando base de datos');
  await prisma.horarioAsignado.deleteMany({});
  await prisma.seleccionTemporalHorario.deleteMany({});
  await prisma.docenteCurso.deleteMany({});
  await prisma.cursoAmbiente.deleteMany({});
  await prisma.ventanaAtencion.deleteMany({});
  await prisma.grupo.deleteMany({});
  await prisma.docente.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.curso.deleteMany({});
  await prisma.ambiente.deleteMany({});
  await prisma.periodoAcademico.deleteMany({});

  console.log('-> Insertando periodo academico');
  const periodo = await prisma.periodoAcademico.create({
    data: {
      codigo: '2026-I',
      nombre: 'Semestre 2026-I',
      anio: 2026,
      semestre: 1,
      fecha_inicio: new Date('2026-04-01'),
      fecha_fin: new Date('2026-08-31'),
      estado: 'asignacion_horarios',
    },
  });

  console.log('-> Insertando ambientes');
  const ambientes = [
    { codigo: 'S101', nombre: 'Lab de Cómputo 101', tipo: 'laboratorio', capacidad: 30, pabellon: 'A', piso: '1' },
    { codigo: 'A201', nombre: 'Aula Magna 201', tipo: 'aula', capacidad: 50, pabellon: 'B', piso: '2' },
    { codigo: 'S102', nombre: 'Lab de Cómputo 102', tipo: 'laboratorio', capacidad: 30, pabellon: 'A', piso: '1' },
    { codigo: 'A202', nombre: 'Aula Magna 202', tipo: 'aula', capacidad: 40, pabellon: 'B', piso: '2' },
    { codigo: 'A203', nombre: 'Aula 203', tipo: 'aula', capacidad: 35, pabellon: 'C', piso: '2' },
  ];

  for (const a of ambientes) {
    await prisma.ambiente.create({ data: a });
  }

  console.log('-> Insertando cursos');
  const cursos = [
    { codigo: 'ISW01', nombre: 'Ingeniería de Software II', creditos: 4, horas_teoria: 3, horas_laboratorio: 2 },
    { codigo: 'ISW02', nombre: 'Base de Datos I', creditos: 4, horas_teoria: 2, horas_laboratorio: 4 },
    { codigo: 'ISW03', nombre: 'Redes de Computadoras I', creditos: 4, horas_teoria: 3, horas_laboratorio: 2 },
    { codigo: 'ISW04', nombre: 'Arquitectura de Software', creditos: 4, horas_teoria: 2, horas_laboratorio: 2 },
    { codigo: 'ISW05', nombre: 'Sistemas Operativos', creditos: 3, horas_teoria: 2, horas_laboratorio: 2 },
  ];

  for (const c of cursos) {
    await prisma.curso.create({ data: c });
  }

  // 2. Usuarios y Docentes
  const docentesData = [
    { codigo: '1001', nombres: 'Roberto', apellidos: 'García', rol: 'docente', mod: 'nombrado', cat: 'principal', tel: '987654321', correo: 'roberto@unt.edu.pe' },
    { codigo: '1002', nombres: 'María', apellidos: 'López', rol: 'docente', mod: 'nombrado', cat: 'asociado', tel: '912345678', correo: 'maria@unt.edu.pe' },
    { codigo: '1003', nombres: 'Carlos', apellidos: 'Sánchez', rol: 'docente', mod: 'nombrado', cat: 'auxiliar', tel: '955666777', correo: 'carlos@unt.edu.pe' },
    { codigo: '1004', nombres: 'Ana', apellidos: 'Martínez', rol: 'docente', mod: 'contratado', cat: 'principal', tel: '944333222', correo: 'ana@unt.edu.pe' },
    { codigo: '1005', nombres: 'Jorge', apellidos: 'Ramírez', rol: 'docente', mod: 'contratado', cat: 'asociado', tel: '922111000', correo: 'jorge@unt.edu.pe' },
    { codigo: 'admin', nombres: 'Admin', apellidos: 'SGH', rol: 'administrador_sistema', correo: 'admin@unt.edu.pe' },
  ];

  console.log('-> Insertando usuarios y docentes');
  const docentes = [];
  for (const d of docentesData) {
    const user = await prisma.usuario.create({
      data: {
        codigo: d.codigo,
        nombres: d.nombres,
        apellidos: d.apellidos,
        correo_electronico: d.correo || `${d.codigo}@unt.edu.pe`,
        contrasena_hash: passwordHash,
        rol: d.rol,
      },
    });

    if (d.rol === 'docente') {
      const docente = await prisma.docente.create({
        data: {
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
      docentes.push(docente);
    }
  }

  console.log('-> Insertando grupos y asignando cursos a docentes');
  const dbCursos = await prisma.curso.findMany();
  
  for (const curso of dbCursos) {
    // Crear grupos para cada curso
    const grupoA = await prisma.grupo.create({
      data: {
        id_curso: curso.id_curso,
        id_periodo: periodo.id_periodo,
        codigo_grupo: 'A',
        capacidad_maxima: 40,
      }
    });

    const grupoB = await prisma.grupo.create({
      data: {
        id_curso: curso.id_curso,
        id_periodo: periodo.id_periodo,
        codigo_grupo: 'B',
        capacidad_maxima: 40,
      }
    });

    // COMENTADO: No asignar automáticamente cursos a docentes para que inicien en blanco
    /*
    if (docentes.length > 0) {
      const docenteRoberto = docentes[0];
      
      await prisma.docenteCurso.create({
        data: {
          id_docente: docenteRoberto.id_docente,
          id_curso: curso.id_curso,
          tipo_clase: 'Teoria',
        }
      });
      // ... más asignaciones
    }
    */
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
