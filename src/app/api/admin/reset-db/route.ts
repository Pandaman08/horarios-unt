import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const execPromise = promisify(exec);

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['administrador_sistema'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Ejecutar el comando de seed para reiniciar la DB
    // Nota: Esto asume que el comando npx prisma db seed funciona correctamente en el entorno
    const { stdout, stderr } = await execPromise('npx prisma db seed');
    
    console.log('DB Reset stdout:', stdout);
    if (stderr) console.error('DB Reset stderr:', stderr);

    return NextResponse.json({ message: 'Base de datos reiniciada con éxito' });
  } catch (error) {
    console.error('Error al reiniciar DB:', error);
    return NextResponse.json({ error: 'Error al reiniciar la base de datos' }, { status: 500 });
  }
}
