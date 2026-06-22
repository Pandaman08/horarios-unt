import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  mapCondicionToTexto, 
  mapCategoriaDocenteToTexto, 
  mapRegimenDedicacionToTexto 
} from '@/lib/docenteMappers';
import { 
  REGIMEN_DEDICACION, 
  TIPO_CONTRATO, 
  type RegimenDedicacion as RegimenDedicacionType, 
  type TipoContrato as TipoContratoType 
} from '@/lib/constants/regimenHoras';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idDocente = searchParams.get('idDocente');
    const idPeriodo = searchParams.get('idPeriodo');
    const departamentoId = searchParams.get('departamentoId');

    if (idDocente && idPeriodo) {
      const declaracion = await prisma.declaracionHoraria.findUnique({
        where: {
          id_docente_id_periodo: {
            id_docente: parseInt(idDocente),
            id_periodo: parseInt(idPeriodo)
          }
        },
        include: {
          docente: true,
          periodo: true,
          cargas_lectivas: { include: { curso: true, grupo: true } },
          cargas_no_lectivas: { include: { horarios: true, cargo: true } },
          formatos: true
        }
      });
      return NextResponse.json(declaracion);
    }

    if (idPeriodo) {
      const where: any = { id_periodo: parseInt(idPeriodo) };
      if (departamentoId) {
        where.docente = { departamentoId };
      }
      const declaraciones = await prisma.declaracionHoraria.findMany({
        where,
        include: {
          docente: true,
          periodo: true,
          cargas_lectivas: { include: { curso: true } },
          cargas_no_lectivas: { include: { horarios: true, cargo: true } }
        }
      });
      return NextResponse.json(declaraciones);
    }

    const declaraciones = await prisma.declaracionHoraria.findMany({
      include: { 
        docente: true, 
        periodo: true,
        cargas_lectivas: { include: { curso: true } },
        cargas_no_lectivas: { include: { horarios: true, cargo: true } }
      }
    });
    return NextResponse.json(declaraciones);
  } catch (error) {
    console.error('Error en GET /api/declaracion-horaria:', error);
    return NextResponse.json({ error: 'Error al obtener declaraciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const docenteId = parseInt(data.id_docente);
    
    // Check if docente has active sanction
    const docente = await prisma.docente.findUnique({
      where: { id_docente: docenteId }
    });
    
    const today = new Date();
    if (docente?.sancionActiva && docente.sancionHasta && new Date(docente.sancionHasta) > today) {
      const fechaSancion = new Date(docente.sancionHasta).toLocaleDateString('es-ES');
      return NextResponse.json({ 
        error: `No se puede asignar carga académica: docente sancionado hasta ${fechaSancion} (Art. 13.3 del Reglamento CAD)` 
      }, { status: 400 });
    }

    // Generate snapshot data from docente's new fields
    const condicionTexto = mapCondicionToTexto(docente?.condicion);
    const categoriaTexto = mapCategoriaDocenteToTexto(docente?.categoriaDocente);
    const dedicacionTexto = mapRegimenDedicacionToTexto(docente?.regimenDedicacion);
    
    // Calculate horas_dedicacion
    let horasDedicacion = 0;
    if (docente) {
      if (docente.condicion === 'CONTRATADO' && docente.tipoContrato) {
        horasDedicacion = TIPO_CONTRATO[docente.tipoContrato as TipoContratoType]?.totalHoras || 0;
      } else if (docente.regimenDedicacion) {
        horasDedicacion = REGIMEN_DEDICACION[docente.regimenDedicacion as RegimenDedicacionType]?.totalHoras || 0;
      }
    }

    const declaracion = await prisma.declaracionHoraria.upsert({
      where: {
        id_docente_id_periodo: {
          id_docente: docenteId,
          id_periodo: parseInt(data.id_periodo)
        }
      },
      update: {
        ibm: data.ibm || docente?.codigo_docente,
        condicion: condicionTexto,
        categoria: categoriaTexto,
        dedicacion: dedicacionTexto,
        horas_dedicacion: horasDedicacion,
        estado: data.estado || 'BORRADOR'
      },
      create: {
        id_docente: docenteId,
        id_periodo: parseInt(data.id_periodo),
        ibm: data.ibm || docente?.codigo_docente,
        condicion: condicionTexto,
        categoria: categoriaTexto,
        dedicacion: dedicacionTexto,
        horas_dedicacion: horasDedicacion,
        estado: data.estado || 'BORRADOR'
      },
      include: {
        docente: true,
        periodo: true,
        cargas_lectivas: { include: { curso: true, grupo: true } },
        cargas_no_lectivas: { include: { horarios: true, cargo: true } },
        formatos: true
      }
    });
    return NextResponse.json(declaracion);
  } catch (error) {
    console.error('Error en POST /api/declaracion-horaria:', error);
    return NextResponse.json({ error: 'Error al crear declaración' }, { status: 500 });
  }
}
