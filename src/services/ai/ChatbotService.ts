export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class ChatbotService {
  /**
   * Procesa un mensaje del usuario y devuelve una respuesta
   */
  static async processMessage(
    message: string,
    history: ChatMessage[],
    currentModule?: string
  ): Promise<string> {
    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, currentModule }),
    });
    
    const data = await response.json();
    console.log('[ChatbotService] Data received from API:', data);
    return data.response;
  }
}
