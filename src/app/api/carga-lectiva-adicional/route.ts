import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper function to check for schedule conflicts
const checkConflicts = async (
  docenteId: number,
  newHorarios: Array<{ dia: string; horaInicio: string; horaFin: string }>,
  fechaInicio: Date,
  fechaFin: Date,
  excludeCladId?: string
) => {
  // Convert dia to index
  const diaToIndex: Record<string, number> = {
    LU: 0, MA: 1, MI: 2, JU: 3, VI: 4, SA: 5
  };

  // Helper to check time overlap
  const timesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    return start1 < end2 && start2 < end1;
  };

  // Check conflicts with HorarioAsignado (regular carga lectiva)
  const regularHorarios = await prisma.horarioAsignado.findMany({
    where: { docenteId },
    include: { grupo: true }
  });

  for (const regHor of regularHorarios) {
    const regDia = regHor.dia_semana; // 0-5
    const regInicio = regHor.hora_inicio;
    const regFin = regHor.hora_fin;
    for (const newHor of newHorarios) {
      const newDia = diaToIndex[newHor.dia];
      if (newDia === regDia && timesOverlap(newHor.horaInicio, newHor.horaFin, regInicio, regFin)) {
        return true;
      }
    }
  }

  // Check conflicts with CargaNoLectiva's HorarioActividad
  const noLectivaCargas = await prisma.cargaNoLectiva.findMany({
    where: {
      declaracion: { docenteId: docenteId }
    },
    include: { horarios: true }
  });

  for (const cargaNL of noLectivaCargas) {
    for (const horNL of cargaNL.horarios) {
      const horNLDia = diaToIndex[horNL.dia];
      for (const newHor of newHorarios) {
        const newDia = diaToIndex[newHor.dia];
        if (newDia === horNLDia && timesOverlap(newHor.horaInicio, newHor.horaFin, horNL.horaInicio, horNL.horaFin)) {
          return true;
        }
      }
    }
  }

  // Check conflicts with other CargaLectivaAdicional's HorarioActividad
  const otherClads = await prisma.cargaLectivaAdicional.findMany({
    where: {
      docenteId,
      id: excludeCladId ? { not: excludeCladId } : undefined,
      OR: [
        { fechaInicio: { lte: fechaFin }, fechaFin: { gte: fechaInicio } }
      ]
    },
    include: { horarios: true }
  });

  for (const otherClad of otherClads) {
    for (const horClad of otherClad.horarios) {
      const horCladDia = diaToIndex[horClad.dia];
      for (const newHor of newHorarios) {
        const newDia = diaToIndex[newHor.dia];
        if (newDia === horCladDia && timesOverlap(newHor.horaInicio, newHor.horaFin, horClad.horaInicio, horClad.horaFin)) {
          return true;
        }
      }
    }
  }

  return false;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const docenteId = searchParams.get('docenteId');
    const estado = searchParams.get('estado');
    const id = searchParams.get('id');

    if (id) {
      const clad = await prisma.cargaLectivaAdicional.findUnique({
        where: { id },
        include: {
          docente: true,
          sede: true,
          validador: true,
          horarios: true
        }
      });
      return NextResponse.json(clad);
    }

    const where: any = {};
    if (docenteId) where.docenteId = parseInt(docenteId);
    if (estado) where.estado = estado;

    const clads = await prisma.cargaLectivaAdicional.findMany({
      where,
      include: {
        docente: true,
        sede: true,
        validador: true,
        horarios: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(clads);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error getting clads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { docenteId, dependencia, sedeId, curso, numeroResolucion, fechaInicio, fechaFin, totalHoras, horarios } = data;

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

    // Check conflicts if horarios are provided
    if (horarios && horarios.length > 0) {
      const hasConflict = await checkConflicts(
        docenteId,
        horarios,
        new Date(fechaInicio),
        new Date(fechaFin)
      );
      if (hasConflict) {
        return NextResponse.json({ 
          error: 'Incompatibilidad horaria con carga regular (Art. 14 del Reglamento CAD)' 
        }, { status: 400 });
      }
    }

    const clad = await prisma.cargaLectivaAdicional.create({
      data: {
        docenteId,
        dependencia,
        sedeId,
        curso,
        numeroResolucion,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        totalHoras: parseInt(totalHoras),
        horarios: horarios ? {
          createMany: {
            data: horarios.map((h: any) => ({
              dia: h.dia,
              horaInicio: h.horaInicio,
              horaFin: h.horaFin
            }))
          }
        } : undefined
      },
      include: { horarios: true }
    });

    return NextResponse.json(clad);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating clad' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, docenteId, dependencia, sedeId, curso, numeroResolucion, fechaInicio, fechaFin, totalHoras, horarios, estado, observaciones } = data;

    const existingClad = await prisma.cargaLectivaAdicional.findUnique({
      where: { id },
      include: { docente: true }
    });

    if (!existingClad) {
      return NextResponse.json({ error: 'Clad not found' }, { status: 404 });
    }

    // Check conflicts if horarios are provided and not just updating state/observations
    if (horarios && horarios.length > 0 && !(estado && !['BORRADOR', 'ENVIADO'].includes(estado))) {
      const hasConflict = await checkConflicts(
        existingClad.docenteId,
        horarios,
        new Date(fechaInicio || existingClad.fechaInicio),
        new Date(fechaFin || existingClad.fechaFin),
        id
      );
      if (hasConflict) {
        return NextResponse.json({ 
          error: 'Incompatibilidad horaria con carga regular (Art. 14 del Reglamento CAD)' 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      dependencia,
      sedeId,
      curso,
      numeroResolucion,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
      totalHoras: totalHoras ? parseInt(totalHoras) : undefined,
      estado,
      observaciones
    };

    // Handle horarios if provided
    if (horarios) {
      await prisma.horarioActividad.deleteMany({
        where: { cargaLectivaAdicionalId: id }
      });

      if (horarios.length > 0) {
        updateData.horarios = {
          createMany: {
            data: horarios.map((h: any) => ({
              dia: h.dia,
              horaInicio: h.horaInicio,
              horaFin: h.horaFin
            }))
          }
        };
      }
    }

    // Handle validation
    if (estado === 'VALIDADO_DEPARTAMENTO' || estado === 'APROBADO') {
      // Get current user to check if they are director_departamento of the docente's dept
      if (!session.user.id) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const user = await prisma.usuario.findUnique({
        where: { id_usuario: parseInt(session.user.id) },
        include: { docente: true }
      });

      // Get docente's departamento
      const docente = await prisma.docente.findUnique({
        where: { id_docente: existingClad.docenteId },
        include: { departamento: true }
      });

      if (!docente?.departamentoId) {
        return NextResponse.json({ error: 'Docente has no departamento' }, { status: 400 });
      }

      // Check if user is director of that departamento
      const director = await prisma.usuario.findFirst({
        where: {
          rol: 'director_departamento',
          docente: { departamentoId: docente.departamentoId }
        }
      });

      if (!director || director.id_usuario !== parseInt(session.user.id)) {
        return NextResponse.json({ error: 'Not authorized to validate' }, { status: 403 });
      }

      // Set validador
      updateData.validadoPorId = parseInt(session.user.id);
      updateData.fechaValidacion = new Date();
    }

    const clad = await prisma.cargaLectivaAdicional.update({
      where: { id },
      data: updateData,
      include: { horarios: true, docente: true, sede: true, validador: true }
    });

    return NextResponse.json(clad);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating clad' }, { status: 500 });
  }
}
