import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const lastDocente = await prisma.docente.findFirst({
      orderBy: { id_docente: 'desc' },
      select: { codigo_docente: true }
    });

    let nextNumber = 1;
    if (lastDocente && lastDocente.codigo_docente) {
      const match = lastDocente.codigo_docente.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    const year = new Date().getFullYear().toString().slice(-2);
    const nextCode = `D${year}${nextNumber.toString().padStart(4, '0')}`;

    return NextResponse.json({ nextCode });
  } catch (error) {
    return NextResponse.json({ error: 'Error al generar siguiente código' }, { status: 500 });
  }
}
