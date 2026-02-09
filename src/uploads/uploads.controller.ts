import {
  BadRequestException,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  @Post('profile-photo')
  @HttpCode(HttpStatus.CREATED)
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
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload foto profil ke Cloudinary' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Upload berhasil',
    schema: {
      example: {
        url: 'https://res.cloudinary.com/...',
        filename: 'profile-12345.jpg',
        size: 102450,
        mimetype: 'image/jpeg',
      },
    },
  })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan atau tidak valid');
    }

    return {
      url: file.path,
      filename: file.filename || file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
