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

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed Modular y Realista ---');

  try {
    // 1. Limpiar base de datos (orden inverso a las dependencias)
    console.log('-> Limpiando base de datos...');
    await prisma.horarioAsignado.deleteMany();
    await prisma.seleccionTemporalHorario.deleteMany();
    await prisma.conflictoHorario.deleteMany();
    await prisma.docenteCurso.deleteMany();
    await prisma.grupo.deleteMany();
    await prisma.cursoAmbiente.deleteMany();
    await prisma.disponibilidadDocente.deleteMany();
    await prisma.colaNotificaciones.deleteMany();
    await prisma.historialNotificaciones.deleteMany();
    await prisma.preferenciasNotificacionDocente.deleteMany();
    await prisma.ventanaAtencion.deleteMany();
    await prisma.periodoAcademico.deleteMany();
    await prisma.ambiente.deleteMany();
    await prisma.curso.deleteMany();
    await prisma.ciclo.deleteMany();
    await prisma.docente.deleteMany();
    await prisma.usuario.deleteMany();

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