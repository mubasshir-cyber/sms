import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly isMock: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY', '');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@societyms.app');
    this.isMock = !apiKey || apiKey === 'MOCK';

    if (!this.isMock) {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid email service initialized');
    } else {
      this.logger.warn('EmailService running in MOCK mode — emails will be logged, not sent');
    }
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (this.isMock) {
      this.logger.log(`[MOCK EMAIL] To: ${options.to} | Subject: ${options.subject}`);
      this.logger.log(`[MOCK EMAIL] Body: ${options.text.substring(0, 200)}`);
      return true;
    }

    try {
      await sgMail.send({
        to: options.to,
        from: this.fromEmail,
        subject: options.subject,
        text: options.text,
        html: options.html ?? `<p>${options.text.replace(/\n/g, '<br/>')}</p>`,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (err) {
      this.logger.error(`Email failed to ${options.to}: ${(err as Error).message}`);
      return false;
    }
  }
}
