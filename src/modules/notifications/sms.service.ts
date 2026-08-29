import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsOptions {
  to: string; // Mobile number with country code, e.g. "919876543210"
  body: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly isMock: boolean;
  private readonly authKey: string;
  private readonly senderId: string;
  private readonly templateId: string;

  constructor(private readonly configService: ConfigService) {
    this.authKey = this.configService.get<string>('MSG91_AUTH_KEY', '');
    this.senderId = this.configService.get<string>('MSG91_SENDER_ID', 'SMSAPP');
    this.templateId = this.configService.get<string>('MSG91_TEMPLATE_ID', '');
    this.isMock = !this.authKey || this.authKey === 'MOCK';

    if (this.isMock) {
      this.logger.warn('SmsService running in MOCK mode — SMS will be logged, not sent');
    }
  }

  async send(options: SmsOptions): Promise<boolean> {
    if (this.isMock) {
      this.logger.log(`[MOCK SMS] To: ${options.to} | Message: ${options.body.substring(0, 100)}`);
      return true;
    }

    try {
      const url = 'https://api.msg91.com/api/v5/flow/';
      const payload = {
        template_id: this.templateId,
        short_url: '0',
        mobiles: options.to,
        authkey: this.authKey,
        sender: this.senderId,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { type?: string; message?: string };
      if (data?.type === 'success') {
        this.logger.log(`SMS sent to ${options.to}`);
        return true;
      } else {
        this.logger.error(`SMS API error: ${JSON.stringify(data)}`);
        return false;
      }
    } catch (err) {
      this.logger.error(`SMS failed to ${options.to}: ${(err as Error).message}`);
      return false;
    }
  }
}
