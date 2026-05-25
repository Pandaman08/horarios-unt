import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarYActualizarPeriodos() {
  console.log('📋 Verificando períodos...');
  
  try {
    // Obtener TODOS los períodos
    const periodos = await prisma.periodoAcademico.findMany({
      orderBy: { id_periodo: 'desc' }
    });

    console.log(`\n✅ Encontrados ${periodos.length} período(s):`);
    periodos.forEach(p => {
      console.log(`   - ID: ${p.id_periodo} | Código: ${p.codigo} | Nombre: ${p.nombre} | Activo: ${p.activo ? '✅' : '❌'}`);
    });

    // Marcar 2025-II como inactivo si lo encontramos
    const periodo2025_II = periodos.find(p => p.codigo === '2025-II');
    if (periodo2025_II && periodo2025_II.activo) {
      console.log(`\n🔄 Actualizando período 2025-II a inactivo...`);
      await prisma.periodoAcademico.update({
        where: { id_periodo: periodo2025_II.id_periodo },
        data: { activo: false }
      });
      console.log(`✅ Periodo 2025-II marcado como inactivo!`);
    } else if (periodo2025_II && !periodo2025_II.activo) {
      console.log(`\n✅ Periodo 2025-II ya está inactivo!`);
    } else {
      console.log(`\n⚠️ Periodo 2025-II no encontrado!`);
    }

    // Marcar 2025-I como inactivo si lo encontramos
    const periodo2025_I = periodos.find(p => p.codigo === '2025-I');
    if (periodo2025_I && periodo2025_I.activo) {
      console.log(`\n🔄 Actualizando período 2025-I a inactivo...`);
      await prisma.periodoAcademico.update({
        where: { id_periodo: periodo2025_I.id_periodo },
        data: { activo: false }
      });
      console.log(`✅ Periodo 2025-I marcado como inactivo!`);
    } else if (periodo2025_I && !periodo2025_I.activo) {
      console.log(`\n✅ Periodo 2025-I ya está inactivo!`);
    }

    // Verificar 2026-I esté activo
    const periodo2026_I = periodos.find(p => p.codigo === '2026-I');
    if (periodo2026_I && !periodo2026_I.activo) {
      console.log(`\n🔄 Actualizando período 2026-I a activo...`);
      await prisma.periodoAcademico.update({
        where: { id_periodo: periodo2026_I.id_periodo },
        data: { activo: true }
      });
      console.log(`✅ Periodo 2026-I marcado como activo!`);
    } else if (periodo2026_I && periodo2026_I.activo) {
      console.log(`\n✅ Periodo 2026-I ya está activo!`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verificarYActualizarPeriodos();
