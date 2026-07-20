import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createDocenteHorarioPdfDto } from '@/lib/pdf';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const id_periodo = searchParams.get('id_periodo');
    const departamentoId = searchParams.get('departamentoId');

    if (!id || isNaN(parseInt(id))) return NextResponse.json({ error: 'Falta id de docente' }, { status: 400 });
    if (!id_periodo || isNaN(parseInt(id_periodo))) return NextResponse.json({ error: 'Falta id de periodo' }, { status: 400 });

    const periodo = await prisma.periodoAcademico.findUnique({ where: { id_periodo: parseInt(id_periodo) } });

    const docente = await prisma.docente.findUnique({
        where: { id_docente: parseInt(id) },
        include: {
          horarios_asignados: {
            where: { id_periodo: parseInt(id_periodo) },
            include: { curso: { include: { ciclo_rel: true } }, ambiente: true, grupo: true }
          }
        }
      });

    if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });

    const pdfDto = createDocenteHorarioPdfDto({
      docente: {
        id_docente: docente.id_docente,
        nombres: docente.nombres,
        apellidos: docente.apellidos,
        codigo_docente: docente.codigo_docente ?? null,
      },
      periodo: {
        id_periodo: periodo?.id_periodo ?? Number.parseInt(id_periodo),
        nombre: periodo?.nombre ?? null,
        anio: periodo?.anio ?? null,
        semestre: periodo?.semestre ?? null,
      },
      escuela: {
        nombre: 'Escuela Profesional de Ingeniería de Sistemas',
        codigo: 'SYS',
      },
      horarios: docente.horarios_asignados ?? [],
    });

    return NextResponse.json(pdfDto);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener datos del docente' }, { status: 500 });
  }
}
