import Groq from 'groq-sdk';
import { ChatMessage } from './ChatbotService';
import { SYSTEM_KNOWLEDGE } from './SystemKnowledge';

// Singleton instance
let groqClient: Groq | null = null;

export class GroqClient {
  private static SYSTEM_PROMPT = `Eres el asistente virtual del Sistema de Gestión de Horarios UNT.

REGLAS DE ESTILO CONVERSACIONAL (ESTRICTO):
1. NATURALIDAD: Responde como un compañero de trabajo que conoce bien el sistema. Evita el tono corporativo, académico o de manual técnico.
2. ESTRUCTURA: Responde primero la pregunta de forma directa. Amplía la información en 1 a 3 párrafos cortos solo si es necesario.
3. LISTAS: Evita listas numeradas o viñetas a menos que el usuario las pida explícitamente o sea estrictamente necesario para pasos secuenciales.
4. CIERRE: No termines siempre con preguntas de seguimiento como "¿Necesitas algo más?". Solo haz preguntas si realmente aportan valor para continuar la tarea.
5. REFERENCIAS: No repitas nombres de módulos o rutas en cada frase. Úsalas solo si el usuario pregunta específicamente dónde encontrar algo.
6. MULETILLAS: Prohibido usar "Como [ROL]...", "Desde el [MÓDULO]...", "Tienes acceso a...".
7. DATOS REALES: Si no tienes el dato, di: "Actualmente no tengo acceso a esa información en tiempo real."
8. PRECISIÓN: Básate exclusivamente en la información técnica proporcionada, pero explícala de forma sencilla.

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
    context: { name?: string; role?: string; currentModule?: string }
  ): Promise<string> {
    const groq = this.getInstance();

    // Mapear el historial al formato de Groq
    const mappedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // El contexto del usuario se envía como un mensaje de sistema inicial para que no contamine el mensaje del usuario
    const userContextPrompt = {
      role: 'system' as const,
      content: `USUARIO ACTUAL:
- Nombre: ${context.name || 'Usuario'}
- Rol: ${context.role || 'Desconocido'}
- Ubicación actual: ${context.currentModule || 'Dashboard'}
(Usa esta información solo para validar permisos, no la repitas en tu respuesta).`
    };

    const messages = [
      { role: 'system' as const, content: this.SYSTEM_PROMPT },
      userContextPrompt,
      ...mappedHistory,
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    console.log('[GroqClient] Messages being sent to Groq:', JSON.stringify(messages, null, 2));

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.6, // Un poco más de temperatura para mayor naturalidad
        max_tokens: 512,
      });

      console.log('[GroqClient] Groq choice[0]:', JSON.stringify(chatCompletion.choices[0], null, 2));
      
      const content = chatCompletion.choices[0]?.message?.content || 'Lo siento, no puedo responder en este momento.';
      console.log('[GroqClient] Returning content:', content);
      
      return content;
    } catch (error: any) {
      console.error('[GroqClient] Error interacting with Groq:', {
        message: error.message,
        type: error.type || 'unknown',
        code: error.code || 'no_code',
        statusCode: error.status || 'no_status',
        stack: error.stack
      });

      // Manejo de errores conocidos
      if (error.type === 'model_not_found' || error.code === 'model_not_found') {
        return 'No puedo procesar tu consulta en este momento. Inténtalo nuevamente más tarde.';
      }
      if (error.code === 'rate_limit_exceeded' || error.status === 429) {
        return 'No puedo procesar tu consulta en este momento. Inténtalo nuevamente más tarde.';
      }
      if (error.type === 'api_connection_error' || error.name === 'AbortError') {
        return 'No puedo procesar tu consulta en este momento. Inténtalo nuevamente más tarde.';
      }
      
      // Error genérico
      return 'No puedo procesar tu consulta en este momento. Inténtalo nuevamente más tarde.';
    }
  }
}
