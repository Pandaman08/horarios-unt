import axios from 'axios';

export class ServicioTelegram {
  private static botToken = process.env.TELEGRAM_BOT_TOKEN;
  private static apiUrl = `https://api.telegram.org/bot${this.botToken}`;

  static async enviarMensaje(chatId: string, text: string) {
    if (!this.botToken) {
      console.warn('TELEGRAM_BOT_TOKEN no configurado');
      return { success: false, error: 'Token no configurado' };
    }

    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error enviando Telegram:', error.response?.data || error.message);
      return { success: false, error: error.message };
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
