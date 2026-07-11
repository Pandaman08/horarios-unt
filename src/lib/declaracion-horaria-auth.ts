import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RolUsuario } from '@prisma/client';

const ROLES_TODOS = new Set<RolUsuario>([
  'administrador_sistema',
  'operador_horarios',
]);

const ROLES_SUPERVISION = new Set<RolUsuario>([
  'director_departamento',
  'decano',
]);

export async function puedeVerDeclaracionDocente(
  idDocente: number,
  rol: RolUsuario,
  idUsuario: number,
  idDocenteSesion?: number
): Promise<boolean> {
  if (ROLES_TODOS.has(rol)) return true;

  if (rol === 'docente') {
    return idDocenteSesion === idDocente;
  }

  if (!ROLES_SUPERVISION.has(rol)) return false;

  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: idUsuario },
    include: {
      docente: {
        select: { departamentoId: true, facultadId: true },
      },
    },
  });

  const docenteObjetivo = await prisma.docente.findUnique({
    where: { id_docente: idDocente },
    select: { departamentoId: true, facultadId: true },
  });

  if (!usuario?.docente || !docenteObjetivo) return false;

  if (rol === 'director_departamento') {
    return (
      !!usuario.docente.departamentoId &&
      usuario.docente.departamentoId === docenteObjetivo.departamentoId
    );
  }

  if (rol === 'decano') {
    return (
      !!usuario.docente.facultadId &&
      usuario.docente.facultadId === docenteObjetivo.facultadId
    );
  }

  return false;
}

export async function assertPuedeVerDeclaracionDocente(idDocente: number) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { ok: false as const, status: 401, error: 'No autenticado' };
  }

  const allowed = await puedeVerDeclaracionDocente(
    idDocente,
    session.user.rol,
    session.user.id_usuario,
    session.user.id_docente
  );

  if (!allowed) {
    return { ok: false as const, status: 403, error: 'No autorizado para ver esta declaración' };
  }

  return { ok: true as const, session };
}
