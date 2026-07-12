import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get('rol');

    if (!rol) {
      return NextResponse.json({ error: 'Falta el rol' }, { status: 400 });
    }

    // Prefijos por rol
    const prefijos: Record<string, string> = {
      admin: 'ADM',
      operador: 'OPE',
      docente: 'DOC'
    };

    const prefijo = prefijos[rol] || 'USR';

    // Buscar el último código que empiece con el prefijo
    const ultimoUsuario = await prisma.usuario.findFirst({
      where: {
        codigo: {
          startsWith: prefijo
        }
      },
      orderBy: {
        codigo: 'desc'
      },
      select: {
        codigo: true
      }
    });

    let siguienteNumero = 1;
    if (ultimoUsuario && ultimoUsuario.codigo) {
      // Extraer la parte numérica del código (ej: OPE001 -> 001)
      const match = ultimoUsuario.codigo.match(/\d+$/);
      if (match) {
        siguienteNumero = parseInt(match[0]) + 1;
      }
    }

    const nuevoCodigo = `${prefijo}${siguienteNumero.toString().padStart(3, '0')}`;

    return NextResponse.json({ codigo: nuevoCodigo });
  } catch (error) {
    console.error('Error al generar código:', error);
    return NextResponse.json({ error: 'Error al generar código' }, { status: 500 });
  }
}
