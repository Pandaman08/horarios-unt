import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cargos = [
    { nombre: 'Rector', chlm: 0, chnlpe: 0, chnla: 40 },
    { nombre: 'Vicerrector', chlm: 0, chnlpe: 0, chnla: 40 },
    { nombre: 'Decano', chlm: 6, chnlpe: 3, chnla: 20 },
    { nombre: 'Director de Escuela de Posgrado', chlm: 6, chnlpe: 3, chnla: 20 },
    { nombre: 'Director de Departamento Académico', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Escuela Profesional', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Unidad de Posgrado/Segunda Especialidad', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Filial', chlm: 8, chnlpe: 4, chnla: 15 },
    { nombre: 'Integrante de Asamblea Universitaria', chlm: 14, chnlpe: 7, chnla: 2 },
    { nombre: 'Integrante de Consejo de Facultad', chlm: 14, chnlpe: 7, chnla: 3 },
    { nombre: 'Jefe de Oficina de Gestión de la Calidad', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Responsabilidad Social Universitaria', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Servicios Educativos de Extensión', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Jefe de Oficina de Relaciones Nacionales e Internacionales', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Admisión', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Procesos Académicos', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Bienestar Universitario', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Investigación y Ética', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Innovación y Transferencia Tecnológica', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Institutos de Investigación y Desarrollo', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Director de Producción de Bienes y Servicios', chlm: 10, chnlpe: 5, chnla: 10 },
    { nombre: 'Directivo del Centro Educativo Experimental', chlm: 8, chnlpe: 4, chnla: 15 },
    { nombre: 'Presidente de Comité de Calidad/COTECU', chlm: 12, chnlpe: 6, chnla: 10 },
  ];

  for (const cargo of cargos) {
    await prisma.cargoAcademicoAdministrativo.upsert({
      where: { nombre: cargo.nombre },
      update: {},
      create: cargo,
    });
    console.log(`Upserted cargo: ${cargo.nombre}`);
  }

  console.log('Seeding cargos completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
