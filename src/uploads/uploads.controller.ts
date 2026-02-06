import {
  BadRequestException,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

@Controller('uploads')
export class UploadsController {
  @Post('profile-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async () => {
          return {
            folder: 'dentizy-profiles',
            resource_type: 'image',
            public_id: `profile-${Date.now()}`,
            allowed_formats: ['jpg', 'png', 'webp'],
          };
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // Max 2MB
          new FileTypeValidator({ fileType: /^image\/(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('File tidak ditemukan atau tidak valid');
      }

      // Cloudinary Storage akan otomatis mengisi property 'path' dengan URL HTTPS
      if (!file.path) {
        throw new BadRequestException('Upload gagal, URL file tidak tersedia');
      }

      return {
        message: 'Upload berhasil',
        url: file.path, // Contoh output: https://res.cloudinary.com/demo/image/upload/...
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(`Upload gagal: ${error.message}`);
      }
      throw new BadRequestException(
        'Upload gagal: Terjadi kesalahan tak terduga',
      );
    }
  }
}
