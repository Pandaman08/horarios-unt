import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const docenteId = 13;

  const bd = await prisma.disponibilidadDocente.findMany({
    where: { id_docente: docenteId },
    orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
    select: { id_disponibilidad: true, dia_semana: true, hora_inicio: true, hora_fin: true, disponible: true, id_periodo: true }
  });

  console.log('=== REGISTROS EN BD ===');
  console.log(JSON.stringify(bd, null, 2));

  const keyMap = new Map<string, { disponible: boolean; id_periodo: number }[]>();
  for (const r of bd) {
    const key = `${r.dia_semana}-${r.hora_inicio}`;
    if (!keyMap.has(key)) keyMap.set(key, []);
    keyMap.get(key)!.push({ disponible: r.disponible, id_periodo: r.id_periodo });
  }

  let dupCount = 0;
  for (const [key, entries] of keyMap) {
    if (entries.length > 1) {
      console.log(`DUPLICADO key=${key}: ${JSON.stringify(entries)}`);
      dupCount++;
    }
  }
  if (dupCount === 0) console.log('\nNo hay duplicados');

  const periodos = await prisma.periodoAcademico.findMany({ select: { id_periodo: true, nombre: true, activo: true } });
  console.log('\n=== PERIODOS ===');
  console.log(JSON.stringify(periodos, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
