import { Module } from '@nestjs/common';

import { CloudinaryProvider } from './cloudinary.provider';
import { UploadsController } from './uploads.controller';

@Module({
  controllers: [UploadsController],
  providers: [CloudinaryProvider],
})
export class UploadsModule {}
