import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idPeriodo = parseInt(searchParams.get('idPeriodo') || '0');
  if (!idPeriodo) {
    return NextResponse.json({ error: 'Falta idPeriodo' }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: session.user.id_usuario },
    include: { docente: { select: { facultadId: true } } }
  });

  const facultadId = usuario?.docente?.facultadId;
  if (!facultadId) {
    return NextResponse.json({ error: 'No tiene facultad asignada' }, { status: 400 });
  }

  const declaraciones = await prisma.declaracionHoraria.findMany({
    where: {
      id_periodo: idPeriodo,
      estado: 'VALIDADO_DEPARTAMENTO',
      docente: { facultadId }
    },
    include: {
      docente: {
        include: { departamento: true, facultad: true }
      },
      periodo: true,
      cargas_lectivas: {
        include: { curso: true }
      },
      cargas_no_lectivas: true
    },
    orderBy: { fechaValidacionDepartamento: 'desc' }
  });

  return NextResponse.json(declaraciones);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { idPeriodo, repositorioUrl } = await request.json();
  if (!idPeriodo) {
    return NextResponse.json({ error: 'Falta idPeriodo' }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: session.user.id_usuario },
    include: { docente: { select: { facultadId: true, facultad: true } } }
  });

  const facultadId = usuario?.docente?.facultadId;
  if (!facultadId) {
    return NextResponse.json({ error: 'No tiene facultad asignada' }, { status: 400 });
  }

  const declaraciones = await prisma.declaracionHoraria.findMany({
    where: {
      id_periodo: idPeriodo,
      estado: 'APROBADO',
      docente: { facultadId }
    },
    include: {
      docente: {
        include: { departamento: true }
      }
    },
    orderBy: { fecha_aprobacion: 'desc' }
  });

  const periodo = await prisma.periodoAcademico.findUnique({
    where: { id_periodo: idPeriodo }
  });

  const pdfContent = `
    ENTREGABLE DE CONSOLIDACIÓN DE CARGA HORARIA
    Facultad: ${usuario?.docente?.facultad?.nombre || 'N/A'}
    Periodo: ${periodo?.nombre || 'N/A'}
    Fecha: ${new Date().toISOString().split('T')[0]}
    
    REPOSITORIO: ${repositorioUrl || 'No proporcionado'}
    
    DOCENTES INCLUIDOS:
    ${declaraciones.map(d => `- ${d.docente.apellidos}, ${d.docente.nombres} (${d.ibm}) - ${d.docente.departamento?.nombre || 'N/A'}`).join('\n  ')}
    
    TOTAL DOCENTES: ${declaraciones.length}
  `;

  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `attachment; filename=entregable-consolidacion-${new Date().toISOString().split('T')[0]}.txt`);

  return new Response(pdfContent, { headers });
}
