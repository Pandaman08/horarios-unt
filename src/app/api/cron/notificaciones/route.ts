import { NextResponse } from 'next/server';
import { ServicioNotificador } from '@/services/notificaciones/ServicioNotificador';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ServicioNotificador.procesarCola();
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error procesando cola de notificaciones:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
