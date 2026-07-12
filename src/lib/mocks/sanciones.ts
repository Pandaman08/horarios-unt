import { prisma } from '../prisma';
import { getForcedResult } from '@/app/api/simulaciones/forzar/route';

export async function consultarSanciones(dni: string) {
  const docente = await prisma.docente.findFirst({ where: { dni } });

  // Check if there's a forced result
  if (docente) {
    const forced = getForcedResult(docente.id_docente, 'SANCIONES');
    if (forced) {
      await prisma.integracionSimulada.create({
        data: {
          tipo: 'SANCIONES',
          docenteId: docente.id_docente,
          payload: JSON.stringify({ dni, forzado: true }),
          resultado: JSON.stringify(forced)
        }
      });
      return forced;
    }
  }

  let resultado: Array<{
    id: number;
    tipo: string;
    fecha: string;
    motivo: string;
    activo: boolean;
    hasta: string | null;
  }> = [];

  if (docente?.sancionActiva) {
    resultado = [
      {
        id: 1,
        tipo: 'Amonestación Escrita',
        fecha: '2025-03-15',
        motivo: 'Retraso en entrega de notas',
        activo: true,
        hasta: docente.sancionHasta?.toISOString() || null
      }
    ];
  }

  await prisma.integracionSimulada.create({
    data: {
      tipo: 'SANCIONES',
      docenteId: docente?.id_docente,
      payload: JSON.stringify({ dni }),
      resultado: JSON.stringify(resultado)
    }
  });

  return resultado;
}
