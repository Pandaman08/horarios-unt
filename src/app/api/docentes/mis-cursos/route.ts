import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');
    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    const docente = await prisma.docente.findFirst({
      where: { id_usuario: parseInt(session.user.id_usuario) }
    });

    if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });

    const cursosAsignados = await prisma.docenteCurso.findMany({
      where: { id_docente: docente.id_docente, activo: true },
      include: { curso: true }
    });

    const progreso = await Promise.all(cursosAsignados.map(async (dc) => {
      const asignaciones = await prisma.horarioAsignado.findMany({
        where: {
          id_docente: docente.id_docente,
          id_curso: dc.id_curso,
          tipo_clase: dc.tipo_clase,
          id_periodo: parseInt(id_periodo)
        }
      });

      let minutosAsignados = 0;
      asignaciones.forEach(a => {
        const [h1, m1] = a.hora_inicio.split(':').map(Number);
        const [h2, m2] = a.hora_fin.split(':').map(Number);
        minutosAsignados += (h2 * 60 + m2) - (h1 * 60 + m1);
      });

      const horasRequeridas = dc.tipo_clase === 'teoria' ? dc.curso.horas_teoria : dc.curso.horas_laboratorio;

      return {
        id_curso: dc.id_curso,
        nombre: dc.curso.nombre,
        codigo: dc.curso.codigo,
        tipo_clase: dc.tipo_clase,
        horas_requeridas: horasRequeridas,
        horas_asignadas: minutosAsignados / 60
      };
    }));

    return NextResponse.json(progreso);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener progreso' }, { status: 500 });
  }
}
