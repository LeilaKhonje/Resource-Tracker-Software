import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.from = config.get<string>('APP_MAIL_FROM', config.get<string>('MAIL_FROM', ''));
    const user = config.get<string>('MAIL_USERNAME', config.get<string>('BREVO_SMTP_USER', ''));
    const pass = config.get<string>('MAIL_PASSWORD', config.get<string>('BREVO_SMTP_KEY', ''));
    const host = config.get<string>('MAIL_HOST', 'smtp-relay.brevo.com');
    const port = Number(config.get<string>('MAIL_PORT', '587'));
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host, port, secure: port === 465,
        auth: { user, pass }, requireTLS: port !== 465,
      });
    }
  }

  async send(to: string, subject: string, text: string, html?: string): Promise<void> {
    if (!this.transporter || !this.from) {
      this.logger.warn(`Email not sent to ${to}: Brevo SMTP settings are missing`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text, html });
    } catch (error) {
      this.logger.error(`Email delivery failed for ${to}`, error instanceof Error ? error.stack : undefined);
    }
  }

  async sendRequired(to: string, subject: string, text: string, html?: string): Promise<void> {
    if (!this.transporter || !this.from) {
      throw new ServiceUnavailableException('Email delivery is not configured');
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text, html });
    } catch (error) {
      this.logger.error(`Email delivery failed for ${to}`, error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException('Could not deliver the account credentials email');
    }
  }
}
