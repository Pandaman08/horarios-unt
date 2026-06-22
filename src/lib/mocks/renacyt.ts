import { prisma } from '../prisma';
import { getForcedResult } from '@/app/api/simulaciones/forzar/route';

export async function consultarRenacyt(dni: string) {
  const docente = await prisma.docente.findFirst({ where: { dni } });

  // Check if there's a forced result
  if (docente) {
    const forced = getForcedResult(docente.id_docente, 'RENACYT');
    if (forced) {
      await prisma.integracionSimulada.create({
        data: {
          tipo: 'RENACYT',
          docenteId: docente.id_docente,
          payload: JSON.stringify({ dni, forzado: true }),
          resultado: JSON.stringify(forced)
        }
      });
      return forced;
    }
  }

  let resultado = { acreditado: false };

  if (docente?.esInvestigadorAcreditado) {
    resultado = { acreditado: true, nivel: docente.nivelRenacyt || 'Candidato' };
  }

  await prisma.integracionSimulada.create({
    data: {
      tipo: 'RENACYT',
      docenteId: docente?.id_docente,
      payload: JSON.stringify({ dni }),
      resultado: JSON.stringify(resultado)
    }
  });

  return resultado;
}
