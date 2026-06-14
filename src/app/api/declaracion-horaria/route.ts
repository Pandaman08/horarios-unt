import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idDocente = searchParams.get('idDocente');
    const idPeriodo = searchParams.get('idPeriodo');

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
          cargas_no_lectivas: true,
          formatos: true
        }
      });
      return NextResponse.json(declaracion);
    }

    const declaraciones = await prisma.declaracionHoraria.findMany({
      include: { 
        docente: true, 
        periodo: true,
        cargas_lectivas: { include: { curso: true } },
        cargas_no_lectivas: true
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
    const declaracion = await prisma.declaracionHoraria.upsert({
      where: {
        id_docente_id_periodo: {
          id_docente: parseInt(data.id_docente),
          id_periodo: parseInt(data.id_periodo)
        }
      },
      update: {
        ibm: data.ibm,
        condicion: data.condicion,
        categoria: data.categoria,
        dedicacion: data.dedicacion,
        horas_dedicacion: parseFloat(data.horas_dedicacion),
        estado: data.estado || 'BORRADOR'
      },
      create: {
        id_docente: parseInt(data.id_docente),
        id_periodo: parseInt(data.id_periodo),
        ibm: data.ibm,
        condicion: data.condicion,
        categoria: data.categoria,
        dedicacion: data.dedicacion,
        horas_dedicacion: parseFloat(data.horas_dedicacion),
        estado: data.estado || 'BORRADOR'
      },
      include: {
        docente: true,
        periodo: true,
        cargas_lectivas: { include: { curso: true, grupo: true } },
        cargas_no_lectivas: true,
        formatos: true
      }
    });
    return NextResponse.json(declaracion);
  } catch (error) {
    console.error('Error en POST /api/declaracion-horaria:', error);
    return NextResponse.json({ error: 'Error al crear declaración' }, { status: 500 });
  }
}
