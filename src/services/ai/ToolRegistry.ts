import { z } from 'zod';

// Tipos base
export type Role = 'administrador_sistema' | 'operador_horarios' | 'docente';

export interface ToolContext {
  userId: number;
  userRole: Role;
  docenteId?: number;
  currentPeriodId?: number;
  ipAddress?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodSchema<any>;
  requiredRoles: Role[];
  handler: (args: any, context: ToolContext) => Promise<any>;
}

// Registro global de herramientas
export class ToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  static register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  static get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  static getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  static getDefinitionsForGroq() {
    return this.getAll().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: zodToJsonSchema(tool.parameters)
      }
    }));
  }
}

// Helper para convertir Zod a JSON Schema (simplificado)
function zodToJsonSchema(zodSchema: z.ZodSchema<any>): any {
  const schema: any = { type: 'object', properties: {}, required: [] };
  
  // Para este proyecto, manejamos objetos simples
  if (zodSchema instanceof z.ZodObject) {
    const shape = zodSchema.shape;
    for (const [key, field] of Object.entries(shape)) {
      let fieldSchema: any = {};
      
      if (field instanceof z.ZodString) fieldSchema.type = 'string';
      else if (field instanceof z.ZodNumber) fieldSchema.type = 'number';
      else if (field instanceof z.ZodBoolean) fieldSchema.type = 'boolean';
      else if (field instanceof z.ZodArray) {
        fieldSchema.type = 'array';
        fieldSchema.items = zodToJsonSchema((field as any).element);
      }
      
      // Check if optional
      if (!(field instanceof z.ZodOptional)) {
        schema.required.push(key);
      }
      
      schema.properties[key] = fieldSchema;
    }
  }
  
  return schema;
}
