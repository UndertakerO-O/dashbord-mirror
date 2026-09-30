import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
  });

  async sendConfirmationEmail(recipient: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const confirmationUrl = `${frontendUrl}/confirm?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM ?? 'no-reply@dashboard.local',
      to: recipient,
      subject: 'Confirm your Dashboard account',
      text: `Confirm your account: ${confirmationUrl}`,
      html: `<p>Confirm your Dashboard account:</p><p><a href="${confirmationUrl}">Confirm my account</a></p>`,
    });
  }
}
