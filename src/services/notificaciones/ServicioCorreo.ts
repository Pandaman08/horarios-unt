import nodemailer from 'nodemailer';

export class ServicioCorreo {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async enviarCorreo(to: string | null | undefined, subject: string, html: string) {
    if (!to) {
      console.warn('[Correo] Error: No hay destinatario especificado.');
      return { success: false, error: 'No hay destinatario' };
    }
    try {
      console.log(`[Correo] Intentando enviar correo a: ${to} - Asunto: ${subject}`);
      const info = await this.transporter.sendMail({
        from: `"Horarios UNT" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`[Correo] Correo enviado exitosamente. ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error('[Correo] Error al enviar:', error.message || error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }
}
