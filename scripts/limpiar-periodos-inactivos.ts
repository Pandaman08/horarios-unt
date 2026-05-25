import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limpiarPeriodosInactivos() {
  console.log('🧹 Limpiando horarios de períodos inactivos...');
  
  try {
    // Obtener períodos inactivos
    const periodosInactivos = await prisma.periodoAcademico.findMany({
      where: { activo: false }
    });

    console.log(`✅ Encontrados ${periodosInactivos.length} período(s) inactivo(s):`);
    periodosInactivos.forEach(p => console.log(`   - ${p.nombre} (${p.codigo})`));

    let totalHorarios = 0;
    let totalVentanas = 0;
    let totalSelecciones = 0;

    for (const periodo of periodosInactivos) {
      console.log(`\n🧹 Limpiando período: ${periodo.nombre}`);
      
      // Borrar horarios
      const resultHorarios = await prisma.horarioAsignado.deleteMany({
        where: { id_periodo: periodo.id_periodo }
      });
      console.log(`   - Borramos ${resultHorarios.count} horarios`);
      totalHorarios += resultHorarios.count;
      
      // Borrar ventanas de atención
      const resultVentanas = await prisma.ventanaAtencion.deleteMany({
        where: { id_periodo: periodo.id_periodo }
      });
      console.log(`   - Borramos ${resultVentanas.count} ventanas de atención`);
      totalVentanas += resultVentanas.count;
      
      // Borrar selecciones temporales
      const resultSelecciones = await prisma.seleccionTemporalHorario.deleteMany({
        where: { id_periodo: periodo.id_periodo }
      });
      console.log(`   - Borramos ${resultSelecciones.count} selecciones temporales`);
      totalSelecciones += resultSelecciones.count;
    }

    console.log(`\n✅ Limpieza completada!`);
    console.log(`   - Total horarios borrados: ${totalHorarios}`);
    console.log(`   - Total ventanas borradas: ${totalVentanas}`);
    console.log(`   - Total selecciones borradas: ${totalSelecciones}`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

limpiarPeriodosInactivos();
