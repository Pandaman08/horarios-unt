import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const declaracion = await prisma.declaracionHoraria.update({
      where: { id_declaracion: parseInt(params.id) },
      data: {
        ibm: data.ibm,
        condicion: data.condicion,
        categoria: data.categoria,
        dedicacion: data.dedicacion,
        horas_dedicacion: data.horas_dedicacion,
        estado: data.estado,
        observaciones: data.observaciones,
        fecha_envio: data.estado === 'ENVIADO' ? new Date() : undefined,
        fecha_aprobacion: data.estado === 'APROBADO' ? new Date() : undefined,
        fecha_actualizacion: new Date()
      }
    });
    return NextResponse.json(declaracion);
  } catch (error) {
    console.error('Error en PUT /api/declaracion-horaria/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar declaración' }, { status: 500 });
  }
}
