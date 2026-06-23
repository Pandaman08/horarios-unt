import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calcularDeclaracionJurada } from '@/lib/declaracion-jurada';
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

interface HorarioActividadPayload {
  horaInicio?: string;
  horaFin?: string;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const idNum = Number.parseInt(id);

    const declaracionActual = await prisma.declaracionHoraria.findUnique({
      where: { id_declaracion: idNum },
      include: {
        docente: true,
        cargas_lectivas: true,
        cargas_no_lectivas: {
          include: {
            horarios: true
          }
        }
      }
    });

    if (!declaracionActual) {
      return NextResponse.json({ error: 'Declaración no encontrada' }, { status: 404 });
    }

    // Get the docente to generate snapshot data
    const docente = declaracionActual.docente;
    
    // Generate snapshot data from docente's new fields
    const condicionTexto = mapCondicionToTexto(docente?.condicion);
    const categoriaTexto = mapCategoriaDocenteToTexto(docente?.categoriaDocente);
    const dedicacionTexto = mapRegimenDedicacionToTexto(docente?.regimenDedicacion);
    
    // Calculate horas_dedicacion
    let horasDedicacionCalculada = 0;
    if (docente) {
      if (docente.condicion === 'CONTRATADO' && docente.tipoContrato) {
        horasDedicacionCalculada = TIPO_CONTRATO[docente.tipoContrato as TipoContratoType]?.totalHoras || 0;
      } else if (docente.regimenDedicacion) {
        horasDedicacionCalculada = REGIMEN_DEDICACION[docente.regimenDedicacion as RegimenDedicacionType]?.totalHoras || 0;
      }
    }

    const nuevoEstado = data.estado ?? declaracionActual.estado;

    // Only check horas de dedicacion if we're explicitly setting the state to ENVIADO or APROBADO
    if (nuevoEstado === 'ENVIADO' || nuevoEstado === 'APROBADO') {
      const totalLectivas = declaracionActual.cargas_lectivas.reduce(
        (sum: number, c: { horas_semanales: number; grupos_asignados?: number }) => sum + c.horas_semanales * (c.grupos_asignados || 1),
        0
      );
      const totalNoLectivas = declaracionActual.cargas_no_lectivas.reduce(
        (sum: number, c: { horas_semanales: number; horarios?: HorarioActividadPayload[] }) => {
          const minutos = (c.horarios || []).reduce((s: number, h: HorarioActividadPayload) => {
            const inicio = h?.horaInicio;
            const fin = h?.horaFin;
            if (typeof inicio !== 'string' || typeof fin !== 'string') return s;
            const [hi, mi] = inicio.split(':').map(Number);
            const [hf, mf] = fin.split(':').map(Number);
            if ([hi, mi, hf, mf].some((n) => Number.isNaN(n))) return s;
            const fechaInicio = new Date(0, 0, 0, hi, mi);
            const fechaFin = new Date(0, 0, 0, hf, mf);
            return s + Math.max(0, (fechaFin.getTime() - fechaInicio.getTime()) / 60000);
          }, 0);
          return sum + (minutos > 0 ? Math.round(minutos / 60) : c.horas_semanales);
        },
        0
      );
      const totalGeneral = totalLectivas + totalNoLectivas;

      if (totalGeneral !== horasDedicacionCalculada) {
        return NextResponse.json(
          { error: `La suma total de horas (${totalGeneral}h) debe ser exactamente igual a las horas de dedicación (${horasDedicacionCalculada}h).` },
          { status: 400 }
        );
      }
    }

    // If we're saving a draft or editing a rejected declaracion, don't enforce the hour check
    // Also, if the declaracion was rejected, allow editing without changing the state back to BORRADOR automatically?
    // Let's also make sure that if the current state is RECHAZADO, and we're not setting a new state, we can still edit!
    if (declaracionActual.estado === 'RECHAZADO' && nuevoEstado === declaracionActual.estado) {
      // Allow editing without checks here
    }

    const updateData: Record<string, unknown> = {
      fecha_actualizacion: new Date(),
      // Always update the snapshot fields from the docente's current data
      condicion: condicionTexto,
      categoria: categoriaTexto,
      dedicacion: dedicacionTexto,
      horas_dedicacion: horasDedicacionCalculada
    };

    if (data.ibm !== undefined) updateData.ibm = data.ibm;
    
    // If current state is RECHAZADO and we're not explicitly setting a state, set it to BORRADOR
    if (declaracionActual.estado === 'RECHAZADO' && data.estado === undefined) {
      updateData.estado = 'BORRADOR';
    } else if (data.estado !== undefined) {
      updateData.estado = data.estado;
    }
    
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;
    if (nuevoEstado === 'ENVIADO') {
      updateData.fecha_envio = new Date();
      const declaracionJurada = calcularDeclaracionJurada(docente);
      updateData.declaracionJuradaOpcion = declaracionJurada;
      updateData.fechaFirmaJurada = new Date();
    }
    if (nuevoEstado === 'APROBADO') updateData.fecha_aprobacion = new Date();

    const declaracion = await prisma.declaracionHoraria.update({
      where: { id_declaracion: idNum },
      data: updateData
    });

    if (nuevoEstado === 'APROBADO') {
      for (const carga of declaracionActual.cargas_lectivas) {
        await prisma.docenteCurso.upsert({
          where: {
            id_docente_id_curso_tipo_clase: {
              id_docente: declaracionActual.id_docente,
              id_curso: carga.id_curso,
              tipo_clase: carga.tipo_clase
            }
          },
          update: { activo: true },
          create: {
            id_docente: declaracionActual.id_docente,
            id_curso: carga.id_curso,
            tipo_clase: carga.tipo_clase,
            activo: true
          }
        });
      }
    }

    return NextResponse.json(declaracion);
  } catch (error) {
    console.error('Error en PUT /api/declaracion-horaria/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar declaración' }, { status: 500 });
  }
}
