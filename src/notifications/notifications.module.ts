import { Module } from '@nestjs/common';

import { EmailTemplateService } from './services/email-template.service';
import { EmailService } from './services/email.service';

@Module({
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService],
})
export class NotificationsModule {}
