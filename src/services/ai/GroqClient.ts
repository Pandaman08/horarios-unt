import Groq from 'groq-sdk';
import { ChatMessage } from './ChatbotService';
import { SYSTEM_KNOWLEDGE } from './SystemKnowledge';
import { ToolRegistry } from './ToolRegistry';
import { AIToolDispatcher } from './AIToolDispatcher';
import type { ToolContext } from './ToolRegistry';

// Singleton instance
let groqClient: Groq | null = null;

export class GroqClient {
  private static SYSTEM_PROMPT = `Eres el asistente virtual del Sistema de Gestión de Horarios UNT.

REGLAS DE ESTILO CONVERSACIONAL (ESTRICTO):
1. NATURALIDAD: Responde como un compañero de trabajo que conoce bien el sistema. Evita el tono corporativo, académico o de manual técnico.
2. ESTRUCTURA: Responde primero la pregunta de forma directa. Amplía la información en 1 a 3 párrafos cortos solo si es necesario.
3. LISTAS: Evita listas numeradas o viñetas a menos que el usuario las pida explícitamente o sea estrictamente necesario para pasos secuenciales.
4. CIERRE: No termines siempre con preguntas de seguimiento como "¿Necesitas algo más?" o "¿Puedo ayudarte?". Solo haz preguntas si realmente aportan valor para continuar la tarea.
5. REFERENCIAS: No repitas nombres de módulos o rutas en cada frase. Úsalas solo si el usuario pregunta específicamente dónde encontrar algo.
6. MULETILLAS: Prohibido usar "Como [ROL]...", "Desde el [MÓDULO]...", "Tienes acceso a...".
7. MARKDOWN: **¡PROHIBIDO USAR NINGÚN MARKDOWN!** No uses *, **, _, #, backticks ni cualquier símbolo de formato en tu respuesta.
8. DATOS REALES: Usa las herramientas disponibles para consultar información real del sistema. No inventes datos.
9. PRECISIÓN: Básate exclusivamente en la información técnica proporcionada, pero explícala de forma sencilla.

BASE DE CONOCIMIENTO VERIFICADA:
${JSON.stringify(SYSTEM_KNOWLEDGE, null, 2)}`;

  private static getInstance(): Groq {
    if (!groqClient) {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY no está configurada en las variables de entorno');
      }
      groqClient = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
    }
    return groqClient;
  }

  static async generateResponse(
    userMessage: string,
    history: ChatMessage[],
    context: { name?: string; role?: string; currentModule?: string; userId?: number; docenteId?: number; ipAddress?: string },
  ): Promise<string> {
    const groq = this.getInstance();

    // Importar herramientas para registrarlas
    await import('./tools/index');

    // Mapear el historial al formato de Groq
    const mappedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // El contexto del usuario se envía como un mensaje de sistema inicial
    const userContextPrompt = {
      role: 'system' as const,
      content: `USUARIO ACTUAL:
- Nombre: ${context.name || 'Usuario'}
- Rol: ${context.role || 'Desconocido'}
- Ubicación actual: ${context.currentModule || 'Dashboard'}
(USA ESTA INFORMACIÓN SOLO PARA VALIDAR PERMISOS Y CONTEXTUALIZAR, NO LA REPITAS.)`
    };

    const messages = [
      { role: 'system' as const, content: this.SYSTEM_PROMPT },
      userContextPrompt,
      ...mappedHistory,
      { role: 'user' as const, content: userMessage },
    ];

    console.log('[GroqClient] Messages being sent to Groq (with tools):', JSON.stringify(messages, null, 2));
    
    // Log 1: Tools definitions sent to Groq
    console.log('[GROQ TOOLS]', JSON.stringify(ToolRegistry.getDefinitionsForGroq(), null, 2));

    try {
      // Primera llamada: puede devolver tool_calls
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.6,
        max_tokens: 1024,
        tools: ToolRegistry.getDefinitionsForGroq() as any,
        tool_choice: 'auto'
      });

      const choice = chatCompletion.choices[0];
      
      // Log 2: First response from Groq
      console.log('[GROQ RESPONSE]', JSON.stringify(choice.message, null, 2));
      
      // Si hay tool calls, ejecutarlas
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        console.log('[GroqClient] Tool calls detected:', choice.message.tool_calls);

        // Construir contexto para herramientas
        const toolContext: ToolContext = {
          userId: context.userId || 0,
          userRole: (context.role || 'docente') as any,
          docenteId: context.docenteId,
          currentPeriodId: undefined, // Se obtiene dentro de cada herramienta
          ipAddress: context.ipAddress
        };

        // Ejecutar todas las herramientas
        const toolResults = await AIToolDispatcher.dispatchMultiple(
          choice.message.tool_calls.map(tc => ({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments || '{}')
          })),
          toolContext
        );

        // Construir mensaje con resultados de herramientas
        messages.push(choice.message as any);
        for (let i = 0; i < toolResults.length; i++) {
          const tc = choice.message.tool_calls[i];
          const tr = toolResults[i];
          messages.push({
            role: 'tool' as const,
            tool_call_id: tc.id,
            content: JSON.stringify(tr.result)
          });
        }

        // Segunda llamada: obtener respuesta final con resultados
        const finalCompletion = await groq.chat.completions.create({
          messages,
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          temperature: 0.6,
          max_tokens: 1024
        });

        const finalContent = finalCompletion.choices[0]?.message?.content || 'Lo siento, no puedo responder en este momento.';
        console.log('[GroqClient] Final response after tools:', finalContent);
        return finalContent;
      }

      // Si no hay tool calls, devolver respuesta directamente
      const content = choice.message?.content || 'Lo siento, no puedo responder en este momento.';
      console.log('[GroqClient] Response (no tools):', content);
      return content;
    } catch (error: any) {
      console.error('[GroqClient] Error interacting with Groq:', {
        message: error.message,
        type: error.type || 'unknown',
        code: error.code || 'no_code',
        statusCode: error.status || 'no_status',
        stack: error.stack
      });

      if (error.type === 'model_not_found' || error.code === 'model_not_found') {
        return 'No puedo procesar tu consulta en este momento. Inténtalo nuevamente más tarde.';
      }
      if (error.code === 'rate_limit_exceeded' || error.status === 429) {
        return 'No puedo procesar tu consulta en este momento. Inténtalo nuevamente más tarde.';
      }
      if (error.type === 'api_connection_error' || error.name === 'AbortError') {
        return 'No puedo procesar tu consulta en este momento. Inténtalo nuevamente más tarde.';
      }
      
      return 'No puedo procesar tu consulta en este momento. Inténtalo nuevamente más tarde.';
    }
  }
}
