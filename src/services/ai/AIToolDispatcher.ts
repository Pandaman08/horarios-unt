import { ToolRegistry, type ToolContext } from './ToolRegistry';
import { AuditLogger } from './AuditLogger';

export interface ToolCallResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class AIToolDispatcher {
  static async dispatch(
    toolName: string, 
    args: any, 
    context: ToolContext
  ): Promise<ToolCallResult> {
    const tool = ToolRegistry.get(toolName);
    
    if (!tool) {
      return {
        success: false,
        error: `Herramienta '${toolName}' no encontrada`
      };
    }

    // Validar permisos
    if (!tool.requiredRoles.includes(context.userRole)) {
      const error = `Rol '${context.userRole}' no tiene permisos para usar '${toolName}'`;
      await AuditLogger.log({
        toolName,
        args,
        context,
        success: false,
        error,
        timestamp: new Date()
      });
      return { success: false, error };
    }

    // Validar parámetros
    try {
      tool.parameters.parse(args);
    } catch (validationError: any) {
      const error = `Parámetros inválidos: ${validationError.message}`;
      await AuditLogger.log({
        toolName,
        args,
        context,
        success: false,
        error,
        timestamp: new Date()
      });
      return { success: false, error };
    }

    // Ejecutar herramienta
    try {
      const result = await tool.handler(args, context);
      await AuditLogger.log({
        toolName,
        args,
        context,
        success: true,
        result,
        timestamp: new Date()
      });
      return { success: true, data: result };
    } catch (handlerError: any) {
      const error = handlerError.message || 'Error interno en la herramienta';
      await AuditLogger.log({
        toolName,
        args,
        context,
        success: false,
        error,
        timestamp: new Date()
      });
      return { success: false, error };
    }
  }

  static async dispatchMultiple(
    calls: Array<{ name: string; arguments: any }>,
    context: ToolContext
  ): Promise<Array<{ name: string; result: ToolCallResult }>> {
    return Promise.all(
      calls.map(async (call) => {
        // Log 3: Tool execution start
        console.log('[TOOL EXECUTION]', call.name, call.arguments);
        return {
          name: call.name,
          result: await this.dispatch(call.name, call.arguments, context)
        };
      })
    );
  }
}
