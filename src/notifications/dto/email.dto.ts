// backend/src/notifications/dto/email.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { EmailType } from '../types/email.types';

export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  html: string;
}

export class SendOTPEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  otpCode: string;

  @IsNumber()
  @IsOptional()
  expiresInMinutes?: number = 5;
}

export class SendPasswordResetEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  resetLink: string;

  @IsNumber()
  @IsOptional()
  expiresInMinutes?: number = 30;
}
