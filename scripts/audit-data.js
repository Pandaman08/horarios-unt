const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { format } = require('date-fns');

async function main() {
  console.log('--- AUDITORÍA DE DATOS REALES ---');
  
  // 1. Periodos
  const periodos = await prisma.periodoAcademico.findMany({ where: { activo: true } });
  console.log(`\n1. Periodos Activos: ${periodos.length}`);
  periodos.forEach(p => console.log(`   - ID: ${p.id_periodo}, Código: ${p.codigo}, Estado: ${p.estado}`));

  // 2. Ventanas de hoy
  const ahora = new Date();
  const hoySoloFechaStr = format(ahora, 'yyyy-MM-dd');
  const hoySoloFecha = new Date(hoySoloFechaStr + 'T12:00:00Z');
  const horaActual = format(ahora, 'HH:mm');

  const ventanasHoy = await prisma.ventanaAtencion.findMany({
    where: { fecha: hoySoloFecha },
    include: { periodo: true }
  });
  console.log(`\n2. Ventanas para hoy (${hoySoloFechaStr}): ${ventanasHoy.length}`);
  ventanasHoy.forEach(v => {
    console.log(`   - ID: ${v.id_ventana}, Bloque: ${v.hora_inicio}-${v.hora_fin}, Modalidad: ${v.modalidad}, Categoría: ${v.categoria}, Activo: ${v.activo}`);
  });

  const ventanasActivasAhora = ventanasHoy.filter(v => v.activo && v.hora_inicio <= horaActual && v.hora_fin >= horaActual);
  console.log(`   - Ventanas activas en este momento (${horaActual}): ${ventanasActivasAhora.length}`);

  // 3. Docentes compatibles
  if (ventanasHoy.length > 0) {
    const modalidades = [...new Set(ventanasHoy.map(v => v.modalidad))];
    const categorias = [...new Set(ventanasHoy.map(v => v.categoria))];
    const docentesCompatibles = await prisma.docente.count({
      where: {
        activo: true,
        modalidad: { in: modalidades },
        categoria: { in: categorias }
      }
    });
    console.log(`\n3. Docentes compatibles con las ventanas de hoy: ${docentesCompatibles}`);
  } else {
    console.log('\n3. No se pueden buscar docentes compatibles sin ventanas para hoy.');
  }

  // 4. Carga Académica (DocenteCurso)
  const totalDocenteCurso = await prisma.docenteCurso.count();
  console.log(`\n4. Total registros en DocenteCurso: ${totalDocenteCurso}`);

  // 5. Grupos y Ambientes
  const totalGrupos = await prisma.grupo.count();
  const totalCursoAmbiente = await prisma.cursoAmbiente.count();
  console.log(`\n5. Infraestructura:`);
  console.log(`   - Total Grupos: ${totalGrupos}`);
  console.log(`   - Total Relaciones Curso-Ambiente: ${totalCursoAmbiente}`);

  console.log('\n--- FIN DE AUDITORÍA ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
