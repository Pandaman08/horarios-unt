import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
try {
  const cursosTotal = await p.curso.count({ where: { activo: true } });
  const cursosConDepto = await p.curso.count({ where: { activo: true, departamentoId: { not: null } } });
  const ambientesTotal = await p.ambiente.count({ where: { activo: true } });
  const ambientesConDepto = await p.ambiente.count({ where: { activo: true, departamentoId: { not: null } } });
  const ambientesConFac = await p.ambiente.count({ where: { activo: true, facultadId: { not: null } } });

  const deptoSistemas = await p.departamentoAcademico.findFirst({
    where: { nombre: { contains: 'Ingeniería de Sistemas', mode: 'insensitive' } },
  });

  const cursosSistemasFilter = deptoSistemas
    ? await p.curso.count({ where: { activo: true, departamentoId: deptoSistemas.id } })
    : 0;

  const cargas = await p.cargaLectiva.count();
  const horarios = await p.horarioAsignado.count();

  console.log({
    cursosTotal,
    cursosConDepto,
    cursosSistemasFilter,
    deptoSistemas: deptoSistemas?.nombre,
    ambientesTotal,
    ambientesConDepto,
    ambientesConFac,
    cargas,
    horarios,
  });
} finally {
  await p.$disconnect();
}
