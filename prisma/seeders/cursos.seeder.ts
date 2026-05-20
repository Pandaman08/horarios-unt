import { PrismaClient } from '@prisma/client';

export async function seedCursos(prisma: PrismaClient, ciclos: any[], ambientes: any[]) {
  console.log('-> Sembrando Cursos y sus Ambientes...');
  
  const cursosData = [
    // Ciclo 1 (I) - 8 cursos
    { ciclo: 1, codigo: 'GEN101', nombre: 'Matemática Básica', creditos: 4, t: 3, p: 2, l: 0, tipo: 'general' },
    { ciclo: 1, codigo: 'GEN102', nombre: 'Comunicación y Redacción', creditos: 3, t: 2, p: 2, l: 0, tipo: 'general' },
    { ciclo: 1, codigo: 'GEN103', nombre: 'Metodología del Trabajo Universitario', creditos: 2, t: 1, p: 2, l: 0, tipo: 'general' },
    { ciclo: 1, codigo: 'GEN104', nombre: 'Filosofía', creditos: 2, t: 2, p: 0, l: 0, tipo: 'general' },
    { ciclo: 1, codigo: 'GEN105', nombre: 'Inglés I', creditos: 2, t: 1, p: 2, l: 0, tipo: 'general' },
    { ciclo: 1, codigo: 'SIS101', nombre: 'Introducción a la Ingeniería de Sistemas', creditos: 3, t: 2, p: 2, l: 0, tipo: 'linea_carrera' },
    { ciclo: 1, codigo: 'SIS102', nombre: 'Algoritmos y Programación', creditos: 4, t: 2, p: 0, l: 4, tipo: 'linea_carrera' },
    { ciclo: 1, codigo: 'ELE101', nombre: 'Cultura y Deporte', creditos: 2, t: 0, p: 4, l: 0, tipo: 'electivo' },

    // Ciclo 7 (VII)
    { ciclo: 7, codigo: 'SIS701', nombre: 'Ingeniería de Software I', creditos: 4, t: 3, p: 2, l: 0, tipo: 'linea_carrera' },
    { ciclo: 7, codigo: 'SIS702', nombre: 'Redes y Comunicaciones I', creditos: 4, t: 2, p: 0, l: 4, tipo: 'linea_carrera' },
    { ciclo: 7, codigo: 'SIS703', nombre: 'Bases de Datos I', creditos: 4, t: 2, p: 0, l: 4, tipo: 'linea_carrera' },
    { ciclo: 7, codigo: 'SIS704', nombre: 'Sistemas Operativos', creditos: 4, t: 3, p: 0, l: 2, tipo: 'linea_carrera' },
    { ciclo: 7, codigo: 'SIS705', nombre: 'Investigación de Operaciones I', creditos: 3, t: 2, p: 2, l: 0, tipo: 'linea_carrera' },
    { ciclo: 7, codigo: 'SIS706', nombre: 'Metodología de la Investigación', creditos: 3, t: 2, p: 2, l: 0, tipo: 'linea_carrera' },
    { ciclo: 7, codigo: 'ELE701', nombre: 'Taller de Confecciones', creditos: 2, t: 0, p: 4, l: 0, tipo: 'electivo' },
  ];

  const aulasTeoria = ambientes.filter((a: any) => a.tipo === 'teoria');
  const laboratorios = ambientes.filter((a: any) => a.tipo === 'laboratorio');

  const cursos = [];
  for (const c of cursosData) {
    const cicloId = ciclos.find(cic => cic.numero === c.ciclo)?.id_ciclo;
    const curso = await prisma.curso.upsert({
      where: { codigo: c.codigo },
      update: { id_ciclo: cicloId, tipo_curso: c.tipo },
      create: {
        codigo: c.codigo,
        nombre: c.nombre,
        creditos: c.creditos,
        horas_teoria: c.t,
        horas_practica: c.p,
        horas_laboratorio: c.l,
        tipo_curso: c.tipo,
        id_ciclo: cicloId
      }
    });

    // Asignar ambientes automáticos según horas
    if (c.t > 0 && aulasTeoria.length > 0) {
      await prisma.cursoAmbiente.create({
        data: { id_curso: curso.id_curso, id_ambiente: aulasTeoria[0].id_ambiente, tipo_clase: 'teoria' }
      });
    }
    if (c.p > 0 && aulasTeoria.length > 0) {
      await prisma.cursoAmbiente.create({
        data: { id_curso: curso.id_curso, id_ambiente: aulasTeoria[0].id_ambiente, tipo_clase: 'practica' }
      });
    }
    if (c.l > 0 && laboratorios.length > 0) {
      await prisma.cursoAmbiente.create({
        data: { id_curso: curso.id_curso, id_ambiente: laboratorios[0].id_ambiente, tipo_clase: 'laboratorio' }
      });
    }

    cursos.push(curso);
  }
  return cursos;
}
