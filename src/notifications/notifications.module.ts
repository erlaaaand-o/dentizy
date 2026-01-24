import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';

@Module({
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService],
})
export class NotificationsModule {}
