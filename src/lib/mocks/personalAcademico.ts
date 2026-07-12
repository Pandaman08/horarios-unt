import { prisma } from '../prisma';
import { getForcedResult } from '@/app/api/simulaciones/forzar/route';

export async function verificarPersonalAcademico(dni: string) {
  // Get docente from our DB (simulate external system)
  const docente = await prisma.docente.findFirst({ where: { dni } });

  // Check if there's a forced result
  if (docente) {
    const forced = getForcedResult(docente.id_docente, 'PERSONAL_ACADEMICO');
    if (forced) {
      await prisma.integracionSimulada.create({
        data: {
          tipo: 'PERSONAL_ACADEMICO',
          docenteId: docente.id_docente,
          payload: JSON.stringify({ dni, forzado: true }),
          resultado: JSON.stringify(forced)
        }
      });
      return forced;
    }
  }

  const resultado = docente 
    ? { 
        encontrado: true, 
        dni: docente.dni, 
        nombres: docente.nombres, 
        apellidos: docente.apellidos,
        codigoDocente: docente.codigo_docente
      }
    : { encontrado: false, mensaje: 'Docente no encontrado en Base de Datos de Personal Académico' };

  // Log the call
  await prisma.integracionSimulada.create({
    data: {
      tipo: 'PERSONAL_ACADEMICO',
      docenteId: docente?.id_docente,
      payload: JSON.stringify({ dni }),
      resultado: JSON.stringify(resultado)
    }
  });

  return resultado;
}
