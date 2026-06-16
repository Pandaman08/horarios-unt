import { prisma } from '@/lib/prisma';
import type { ToolContext } from './ToolRegistry';

export interface AuditLogEntry {
  toolName: string;
  args: any;
  context: ToolContext;
  success: boolean;
  result?: any;
  error?: string;
  timestamp: Date;
}

export class AuditLogger {
  static async log(entry: AuditLogEntry) {
    try {
      await prisma.auditoriaHorario.create({
        data: {
          accion: `TOOL_CALL:${entry.toolName}`,
          usuario_id: entry.context.userId,
          datos_anteriores: null,
          datos_nuevos: {
            args: entry.args,
            success: entry.success,
            result: entry.success ? entry.result : null,
            error: entry.error
          },
          direccion_ip: entry.context.ipAddress,
          motivo: 'Llamada a herramienta de chatbot',
          fecha_registro: entry.timestamp
        }
      });
    } catch (error) {
      console.error('Error al registrar auditoría:', error);
      // No bloquear ejecución por error de auditoría
    }
  }
}
