import { Injectable } from '@nestjs/common';
import { AWS } from './aws'
import { utils } from '../utils';

@Injectable()
export class FileService {
  private readonly AWS = new AWS();

  async uploadFile(file: Express.Multer.File): Promise<string> {
    return await this.AWS.uploadFile(file)
  }

  async handleUploadedFile(filename: string) {
    try {
      const csvContent = await this.AWS.getFileContent(filename);
      const jsonArray = await utils.convertCsvBufferToJson(csvContent);

      const jsonString = JSON.stringify(jsonArray, null, 2);
      const jsonBuffer = Buffer.from(jsonString, 'utf-8');

      const jsonFileName = filename.replace('.csv', '.json');

      await this.AWS.uploadFile({
        originalname: jsonFileName,
        buffer: jsonBuffer,
      } as Express.Multer.File);

      console.log(`JSON file uploaded successfully as ${jsonFileName}`);
    } catch (error) {
      console.error('Error handling uploaded file:', error);
      throw new Error('Unable to process and upload JSON file');
    }
  }
}