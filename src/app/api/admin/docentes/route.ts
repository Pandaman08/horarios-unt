import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const prioridadCategoria = ['AUXILIAR', 'ASOCIADO', 'PRINCIPAL'];
const prioridadCondicion = ['ORDINARIO', 'CONTRATADO', 'EXTRAORDINARIO'];

function ordenarDocentes(docentes: any[]) {
  return [...docentes].sort((a, b) => {
    const condA = a.condicion || 'ORDINARIO';
    const condB = b.condicion || 'ORDINARIO';
    const idxA = prioridadCondicion.indexOf(condA);
    const idxB = prioridadCondicion.indexOf(condB);
    if (idxA !== idxB) return idxA - idxB;

    const catA = a.categoriaDocente || 'AUXILIAR';
    const catB = b.categoriaDocente || 'AUXILIAR';
    const idxCatA = prioridadCategoria.indexOf(catA);
    const idxCatB = prioridadCategoria.indexOf(catB);
    if (idxCatA !== idxCatB) return idxCatB - idxCatA;

    if (a.fecha_ingreso && b.fecha_ingreso) {
      return new Date(a.fecha_ingreso).getTime() - new Date(b.fecha_ingreso).getTime();
    }
    return 0;
  });
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Only allow admin, operador_horarios, or secretaria roles
    const userRole = session.user.rol;
    if (!['administrador_sistema', 'operador_horarios', 'secretaria'].includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para acceder a este recurso' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');

    if (!id_periodo) {
      return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });
    }

    const periodoId = parseInt(id_periodo);

    // Get all active docentes with declaracion_horaria in the periodo
    const docentes = await prisma.docente.findMany({
      where: {
        activo: true,
        declaraciones_horarias: {
          some: {
            id_periodo: periodoId
          }
        }
      },
      include: {
        usuario: true,
        departamento: true,
      }
    });

    const docentesOrdenados = ordenarDocentes(docentes);

    // Simplify the response
    const docentesResponse = docentesOrdenados.map((docente) => ({
      id_docente: docente.id_docente,
      nombres: docente.nombres,
      apellidos: docente.apellidos,
      codigo_docente: docente.codigo_docente,
      condicion: docente.condicion,
      categoriaDocente: docente.categoriaDocente,
      departamento: docente.departamento?.nombre || '',
      fecha_ingreso: docente.fecha_ingreso,
    }));

    return NextResponse.json({ docentes: docentesResponse });
  } catch (error) {
    console.error('Error en admin/docentes:', error);
    return NextResponse.json({ error: 'Error al obtener docentes' }, { status: 500 });
  }
}
