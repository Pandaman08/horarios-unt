import { prisma } from '../prisma';
import { getForcedResult } from '@/lib/forcedResults';

export async function verificarInformeInvestigacion(docenteId: number, periodoId: number) {
  // Check if there's a forced result
  const forced = getForcedResult(docenteId, 'INVESTIGACION_ETICA');
  if (forced) {
    await prisma.integracionSimulada.create({
      data: {
        tipo: 'INVESTIGACION_ETICA',
        docenteId: docenteId,
        payload: JSON.stringify({ docenteId, periodoId, forzado: true }),
        resultado: JSON.stringify(forced)
      }
    });
    return forced;
  }

  // Mock response - let's randomize sometimes but have a default
  const docente = await prisma.docente.findUnique({ where: { id_docente: docenteId } });

  let resultado: { validado: boolean; observacion?: string } = { validado: true };

  if (docente?.apellidos.toLowerCase().includes('perez') || docente?.apellidos.toLowerCase().includes('garcia')) {
    resultado = { validado: false, observacion: 'Informe semestral pendiente de entrega' };
  }

  await prisma.integracionSimulada.create({
    data: {
      tipo: 'INVESTIGACION_ETICA',
      docenteId: docenteId,
      payload: JSON.stringify({ docenteId, periodoId }),
      resultado: JSON.stringify(resultado)
    }
  });

  return resultado;
}
