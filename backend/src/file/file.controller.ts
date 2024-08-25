import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from '../file/file.service';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Post('uploadFile')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<string> {
    return await this.fileService.uploadFile(file);
  }
}