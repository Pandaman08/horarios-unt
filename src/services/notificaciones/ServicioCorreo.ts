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

  static async enviarCorreo(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Horarios UNT" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error enviando correo:', error);
      return { success: false, error };
    }
  }
}
