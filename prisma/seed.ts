// main.seeder.ts
import { PrismaClient } from '@prisma/client';
import { seedCiclos } from './seeders/ciclos.seeder';
import { seedPeriodos } from './seeders/periodos.seeder';
import { seedAmbientes } from './seeders/ambientes.seeder';
import { seedCursos } from './seeders/cursos.seeder';
import { seedDocentes } from './seeders/docentes.seeder';
import { seedUsuariosAdministrativos } from './seeders/usuarios_administrativos.seeder';
import { seedDocenteCurso } from './seeders/docente_curso.seeder';
import { seedCursoAmbiente } from './seeders/curso_ambiente.seeder';
import { seedGrupos } from './seeders/grupos.seeder';
import { seedHorarios } from './seeders/horarios.seeder';
import { seedDisponibilidad } from './seeders/disponibilidad.seeder';
import { seedCargaLectiva } from './seeders/carga_lectiva.seeder';

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
    
    // Lista de tablas en orden de dependencia para la limpieza
    const tables = [
      '"HorarioAsignado"',
      '"SeleccionTemporalHorario"',
      '"ConflictoHorario"',
      '"DocenteCurso"',
      '"Grupo"',
      '"CursoAmbiente"',
      '"DisponibilidadDocente"',
      '"ColaNotificaciones"',
      '"HistorialNotificaciones"',
      '"PreferenciasNotificacionDocente"',
      '"VentanaAtencion"',
      '"PeriodoAcademico"',
      '"Ambiente"',
      '"Curso"',
      '"Ciclo"',
      '"Docente"',
      '"Usuario"'
    ];

    // Ejecutar todas las limpiezas en una sola sentencia SQL para minimizar el uso de prepared statements
    // Esto es crucial para entornos con PgBouncer (Supabase, Vercel, etc.)
    const truncateQuery = tables.map(table => `TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`).join('; ');
    
    try {
      await prisma.$executeRawUnsafe(truncateQuery);
      console.log('   ✓ Limpieza completada con éxito.');
    } catch (e) {
      console.log('   ! Error en truncado masivo, intentando borrado individual...');
      // Si falla el masivo, intentamos uno por uno con DELETE (menos eficiente pero más compatible)
      for (const table of tables) {
        try {
          await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
        } catch (innerError) {
          console.error(`   × No se pudo limpiar la tabla ${table}`);
        }
      }
    }

    // 2. Sembrar datos base (sin dependencias entre sí)
    await seedCiclos(prisma);
    await seedPeriodos(prisma);
    await seedAmbientes(prisma);
    await seedCursos(prisma);      // Necesita ciclos (ya están)
    await seedDocentes(prisma);     // Necesita usuarios (se crean internamente)
    await seedUsuariosAdministrativos(prisma); // Opcional, crea admins y operadores

    // 3. Sembrar relaciones y lógica de negocio
    await seedDocenteCurso(prisma);
    await seedCursoAmbiente(prisma);
    await seedGrupos(prisma);
    await seedDisponibilidad(prisma);  // Disponibilidad de docentes
    await seedCargaLectiva(prisma);    // Nueva Carga Lectiva
    await seedHorarios(prisma);     // Usa los períodos creados en seedPeriodos

    console.log('--- Seed completado con éxito ---');
  } catch (error) {
    console.error('Error durante el seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();