import { PrismaClient } from '@prisma/client';
import { seedCiclos } from './seeders/ciclos.seeder';
import { seedDocentes } from './seeders/docentes.seeder';
import { seedCursos } from './seeders/cursos.seeder';
import { seedAmbientes } from './seeders/ambientes.seeder';
import { seedMain } from './seeders/main.seeder';
import { seedHorarios } from './seeders/horarios.seeder';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed Modular y Realista ---');
  
  try {
    // 1. Limpiar base de datos (orden inverso de dependencias para evitar conflictos)
    console.log('-> Limpiando base de datos...');
    
    // Eliminar primero las tablas que dependen de otras
    await prisma.horarioAsignado.deleteMany();
    await prisma.seleccionTemporalHorario.deleteMany();
    await prisma.conflictoHorario.deleteMany();
    await prisma.docenteCurso.deleteMany();
    await prisma.grupo.deleteMany();
    await prisma.cursoAmbiente.deleteMany();
    await prisma.disponibilidadDocente.deleteMany();
    
    // Notificaciones
    await prisma.colaNotificaciones.deleteMany();
    await prisma.historialNotificaciones.deleteMany();
    await prisma.preferenciasNotificacionDocente.deleteMany();
    
    // Ventanas y periodos
    await prisma.ventanaAtencion.deleteMany();
    await prisma.periodoAcademico.deleteMany();
    
    // Entidades base (orden: Ambiente → Curso → Ciclo, Docente → Usuario)
    await prisma.ambiente.deleteMany();
    await prisma.curso.deleteMany();
    await prisma.ciclo.deleteMany();
    await prisma.docente.deleteMany();
    await prisma.usuario.deleteMany();

    // 2. Sembrar datos base
    const ciclos = await seedCiclos(prisma);
    const ambientes = await seedAmbientes(prisma);
    const docentes = await seedDocentes(prisma);
    const cursos = await seedCursos(prisma, ciclos, ambientes);
    const { periodo, ventanas } = await seedMain(prisma);

    // 3. Sembrar lógica de negocio (horarios, conflictos, etc)
    await seedHorarios(prisma, { periodo, docentes, cursos, ambientes, ciclos });

    console.log('--- Seed completado con éxito ---');
  } catch (error) {
    console.error('Error durante el seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
