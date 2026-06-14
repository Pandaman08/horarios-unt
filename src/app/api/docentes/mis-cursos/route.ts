import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Tipo inferido para DocenteCurso con curso y grupos
type DocenteCursoWithGrupos = Prisma.DocenteCursoGetPayload<{
  include: {
    curso: {
      include: {
        grupos: true;
      };
    };
  };
}>;

// Tipos para asignaciones
type HorarioAsignadoType = Prisma.HorarioAsignadoGetPayload<object>;

type SeleccionTemporalType =
  Prisma.SeleccionTemporalHorarioGetPayload<object>;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const id_periodo = searchParams.get('id_periodo');
    const id_docente_manual = searchParams.get('id_docente_manual') || searchParams.get('id_docente');

    if (!id_periodo) {
      return NextResponse.json(
        { error: 'Falta id_periodo' },
        { status: 400 }
      );
    }

    const periodoId = parseInt(id_periodo, 10);

    if (isNaN(periodoId)) {
      return NextResponse.json(
        { error: 'id_periodo debe ser un número válido' },
        { status: 400 }
      );
    }

    let docenteId: number;

    // Admin u operador (o si se pasa id_docente explícitamente)
    if (
      id_docente_manual &&
      (
        session.user.rol === 'administrador_sistema' ||
        session.user.rol === 'operador_horarios' ||
        session.user.rol === 'docente' // Permitir que el docente pase su propio ID si es necesario
      )
    ) {
      const parsedDocenteId = parseInt(id_docente_manual, 10);

      if (isNaN(parsedDocenteId)) {
        return NextResponse.json(
          { error: 'id_docente debe ser un número válido' },
          { status: 400 }
        );
      }

      docenteId = parsedDocenteId;
    } else {
      // Buscar por el id_usuario de la sesión
      const docente = await prisma.docente.findFirst({
        where: {
          id_usuario: session.user.id_usuario,
        },
      });

      if (!docente) {
        // Si no se encuentra como docente por id_usuario, intentar buscar por el id_docente de la sesión
        if (session.user.id_docente) {
          docenteId = Number(session.user.id_docente);
        } else {
          return NextResponse.json(
            { error: 'Docente no encontrado' },
            { status: 404 }
          );
        }
      } else {
        docenteId = docente.id_docente;
      }
    }

    // Cursos asignados
    const cursosAsignados = await prisma.docenteCurso.findMany({
      where: {
        id_docente: docenteId,
        activo: true,
      },
      include: {
        curso: {
          include: {
            grupos: {
              where: {
                id_periodo: periodoId,
                activo: true,
              },
            },
          },
        },
      },
    });

    // Filtrar cursos con grupos y asegurar que curso existe
    const cursosConGrupos = cursosAsignados.filter(
      (dc) => dc.curso && dc.curso.grupos && dc.curso.grupos.length > 0
    );

    // Eliminar duplicados usando una clave única (id_curso + tipo_clase normalizado)
    const uniqueKeys = Array.from(
      new Set(
        cursosConGrupos.map(
          (c) => `${c.id_curso}:${c.tipo_clase.toLowerCase().trim()}`
        )
      )
    );

    const uniqueCursos = uniqueKeys
      .map((key) => {
        const [id, tipo] = key.split(':');
        return cursosConGrupos.find(
          (c) =>
            c.id_curso === parseInt(id, 10) &&
            c.tipo_clase.toLowerCase().trim() === tipo
        );
      })
      .filter((c): c is typeof cursosConGrupos[0] => c !== undefined);

    // Calcular progreso
    const progreso = await Promise.all(
      uniqueCursos.map(
        async (dc) => {
          const asignaciones = await prisma.horarioAsignado.findMany({
            where: {
              id_docente: docenteId,
              id_curso: dc.id_curso,
              tipo_clase: dc.tipo_clase,
              id_periodo: periodoId,
            },
          });

          const temporales = await prisma.seleccionTemporalHorario.findMany({
            where: {
              id_docente: docenteId,
              id_curso: dc.id_curso,
              tipo_clase: dc.tipo_clase,
              id_periodo: periodoId,
              fecha_expiracion: {
                gt: new Date(),
              },
            },
          });

          let minutosTotales = 0;

          const calcularMinutos = (
            hInicio: string | null | undefined,
            hFin: string | null | undefined
          ): number => {
            if (!hInicio || !hFin || !hInicio.includes(':') || !hFin.includes(':')) return 0;

            try {
              const [h1, m1] = hInicio.split(':').map(Number);
              const [h2, m2] = hFin.split(':').map(Number);
              
              if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;

              return (h2 * 60 + m2) - (h1 * 60 + m1);
            } catch (e) {
              return 0;
            }
          };

          asignaciones.forEach((a) => {
            minutosTotales += calcularMinutos(a.hora_inicio, a.hora_fin);
          });

          temporales.forEach((t) => {
            minutosTotales += calcularMinutos(t.hora_inicio, t.hora_fin);
          });

          let horasRequeridas = 0;
          const tipo = dc.tipo_clase.toLowerCase();

          if (tipo.includes('teoria') || tipo.includes('teoría')) {
            horasRequeridas = dc.curso.horas_teoria ?? 0;
          } else if (tipo.includes('laboratorio')) {
            horasRequeridas = dc.curso.horas_laboratorio ?? 0;
          } else if (tipo.includes('practica') || tipo.includes('práctica')) {
            horasRequeridas = dc.curso.horas_practica ?? 0;
          }

          return {
            id_curso: dc.id_curso,
            nombre: dc.curso.nombre,
            codigo: dc.curso.codigo,
            tipo_clase: dc.tipo_clase,
            horas_requeridas: horasRequeridas,
            horas_asignadas: Math.max(0, minutosTotales / 60),
            confirmado: asignaciones.length > 0,
          };
        }
      )
    );

    return NextResponse.json(progreso);
  } catch (error) {
    console.error('Error en mis-cursos:', error);
    return NextResponse.json(
      { error: `Error al obtener progreso: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}