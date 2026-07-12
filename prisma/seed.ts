// main.seeder.ts
import { PrismaClient } from '@prisma/client';
import { seedCiclos } from './seeders/ciclos.seeder';
import { seedPeriodos } from './seeders/periodos.seeder';
import { seedAmbientes } from './seeders/ambientes.seeder';
import { seedCursos } from './seeders/cursos.seeder';
import { seedDocentes } from './seeders/docentes.seeder';
import { seedUsuariosAdministrativos } from './seeders/usuarios_administrativos.seeder';
import { seedGrupos } from './seeders/grupos.seeder';
import { seedDisponibilidad } from './seeders/disponibilidad.seeder';
import { seedCargaLectivaCompleta } from './seeders/carga_lectiva_completa.seeder';
import { seedFacultades } from './seeders/facultades.seeder';
import { seedCargosAcademicosAdministrativos } from './seeders/cargos_academicos_administrativos.seeder';

// Inicializar Prisma Client usando DIRECT_URL para el seed si está disponible
// Esto evita errores de prepared statements con PgBouncer en Supabase/Vercel
// Añadimos configuración de logs para debuggear mejor
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn']
});

async function main() {
  console.log('--- Iniciando Seed Modular y Realista ---');

  try {
    // 1. Limpiar base de datos (orden inverso a las dependencias)

    console.log('-> Limpiando base de datos...');
    
    // Lista de tablas en ORDEN INVERSO de dependencia (empieza por las que dependen de otras)
    const tables = [
      '"AuditoriaHorario"',
      '"RestriccionInstitucional"',
      '"DiaNoLaborable"',
      '"ConfiguracionNotificaciones"',
      '"HorarioActividad"',
      '"CargaLectivaAdicional"',
      '"FormatoDeclaracion"',
      '"CargaNoLectiva"',
      '"CargaLectiva"',
      '"DeclaracionHoraria"',
      '"IntegracionSimulada"',
      '"PersonalApoyo"',
      '"CargoAcademicoAdministrativo"',
      '"HorarioAsignado"',
      '"SeleccionTemporalHorario"',
      '"ConflictoHorario"',
      '"DisponibilidadDocente"',
      '"ColaNotificaciones"',
      '"HistorialNotificaciones"',
      '"PreferenciasNotificacionDocente"',
      '"VentanaAtencion"',
      '"Grupo"',
      '"DocenteCurso"',
      '"CursoAmbiente"',
      '"Prerequisito"', // IMPORTANTE: Borrar antes de Curso
      '"Curso"',
      '"MallaCurricular"',
      '"EscuelaProfesional"',
      '"DepartamentoAcademico"',
      '"Facultad"',
      '"Ambiente"',
      '"PeriodoAcademico"',
      '"Ciclo"',
      '"Docente"',
      '"Usuario"'
    ];

    console.log('   Truncando tablas una por una...');
    
    for (const table of tables) {
      try {
        // Truncate con CASCADE y RESTART IDENTITY
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        console.log(`      ✓ ${table}`);
      } catch (e) {
        console.error(`      × Error al truncar ${table}:`, e);
        // Si falla, intentamos DELETE
        try {
          await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
          console.log(`      ✓ Eliminado ${table} con DELETE`);
        } catch (deleteError) {
          console.error(`      × No se pudo limpiar ${table}`, deleteError);
        }
      }
    }
    
    console.log('   ✓ Limpieza completada.');

    // 2. Sembrar datos base (sin dependencias entre sí)
    await seedFacultades(prisma);
    await seedCiclos(prisma);
    await seedPeriodos(prisma);
    await seedAmbientes(prisma);
    await seedCargosAcademicosAdministrativos(prisma);
    
    // Crear la malla curricular inicial "Plan de Estudios 2018"
    console.log('-> Creando malla curricular inicial...');
    
    // Get Departamento de Ingeniería de Sistemas first
    const departamentoSistemas = await prisma.departamentoAcademico.findFirst({
      where: { nombre: { contains: 'Ingeniería de Sistemas' } }
    });
    const facultadIngenieria = await prisma.facultad.findFirst({
      where: { nombre: { contains: 'Ingeniería' } }
    });
    const escuelaSistemas = await prisma.escuelaProfesional.findFirst({
      where: { nombre: { contains: 'Ingeniería de Sistemas' } }
    });
    
    if (!departamentoSistemas) {
      throw new Error('Departamento de Ingeniería de Sistemas not found!');
    }
    
    const mallaInicial = await prisma.mallaCurricular.create({
      data: {
        nombre: 'Plan de Estudios 2018',
        descripcion: 'Malla curricular oficial de la carrera de Ingeniería de Sistemas',
        anio: 2018,
        activo: true,
        departamentoId: departamentoSistemas.id,
        facultadId: facultadIngenieria?.id,
        escuelaId: escuelaSistemas?.id
      }
    });
    console.log('   ✓ Malla curricular "Plan de Estudios 2018" creada con éxito!');
    
    // Pasar la malla inicial al seeder de cursos
    await seedCursos(prisma, mallaInicial.id_malla);
    
    await seedDocentes(prisma);     // Necesita usuarios (se crean internamente)
    await seedUsuariosAdministrativos(prisma); // Opcional, crea admins y operadores

    // 3. Sembrar relaciones y lógica de negocio
    await seedGrupos(prisma);
    await seedDisponibilidad(prisma);  // Disponibilidad de docentes
    await seedCargaLectivaCompleta(prisma);    // Carga Lectiva COMPLETA por ciclos

    console.log('--- Seed completado con éxito ---');
  } catch (error) {
    console.error('Error durante el seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();