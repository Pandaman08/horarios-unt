import { NextResponse } from 'next/server';
import { GestorSeleccionTemporal } from '@/services/horarios/GestorSeleccionTemporal';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Proteger con CRON_SECRET si está configurado
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const eliminados = await GestorSeleccionTemporal.limpiarExpirados();
    return NextResponse.json({
      ok: true,
      eliminados: eliminados.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error en limpieza de selecciones temporales:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
