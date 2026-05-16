import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cursos = await prisma.curso.findMany({
      where: { activo: true },
      include: {
        curso_ambientes: {
          include: {
            ambiente: true
          }
        }
      },
      orderBy: { codigo: 'asc' }
    });
    return NextResponse.json(cursos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cursos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const curso = await prisma.curso.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        horas_teoria: parseInt(data.horas_teoria) || 0,
        horas_laboratorio: parseInt(data.horas_laboratorio) || 0,
        horas_practica: parseInt(data.horas_practica) || 0,
        creditos: parseInt(data.creditos) || 0,
        ciclo: parseInt(data.ciclo) || null,
        plan_estudios: data.plan_estudios,
        prerequisitos: data.prerequisitos,
        activo: true
      }
    });
    return NextResponse.json(curso);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear curso' }, { status: 500 });
  }
}
