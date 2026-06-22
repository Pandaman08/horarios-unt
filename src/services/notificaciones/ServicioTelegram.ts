import axios from 'axios';

export class ServicioTelegram {
  private static botToken = process.env.TELEGRAM_BOT_TOKEN;
  private static apiUrl = `https://api.telegram.org/bot${this.botToken}`;

  static async enviarMensaje(chatId: string, text: string) {
    if (!this.botToken) {
      console.warn('[Telegram] Error: TELEGRAM_BOT_TOKEN no configurado');
      return { success: false, error: 'Token no configurado' };
    }

    try {
      console.log(`[Telegram] Enviando mensaje a chatId: ${chatId}`);
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      });
      console.log(`[Telegram] Respuesta exitosa de Telegram API`);
      return { success: true, data: response.data };
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error('[Telegram] Error al enviar:', errorData || error.message);
      return { 
        success: false, 
        error: errorData?.description || error.message 
      };
    }
  }

  static async setWebhook(url: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/setWebhook`, { url });
      return response.data;
    } catch (error: any) {
      console.error('Error configurando webhook:', error.message);
      return null;
    }
  }
}
