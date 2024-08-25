import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import {utils} from '../utils'
import * as dotenv from 'dotenv';

dotenv.config();

const bucket = process.env.AWS_BUCKET;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;


export class AWS {
    private s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    },
  });

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const { originalname, buffer } = file;
    
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: originalname,
      Body: buffer,
    });

    try {
      await this.s3Client.send(command);
      console.log('File uploaded successfully');

      return originalname;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Unable to upload file');
    }
  }

  async getFileContent(filename: string) {
    const isAssetExists = await this.checkIfAssetExists(filename);
    if (!isAssetExists) {
      throw new Error(`File ${filename} does not exists on s3 bucket`)
    }

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: filename,
      });

      const response = await this.s3Client.send(command);
      return await utils.streamToString(response.Body);
    } catch (err) {
      console.error(`Could not get content of file ${filename} ${err}`);
      throw err;
    }
  }

  async checkIfAssetExists(filename: string): Promise<boolean> {
    console.log(`Checking if file ${filename} exists`);
    const params = {
      Bucket: bucket,
      Key: filename,
    };

    try {
      await this.s3Client.send(new HeadObjectCommand(params));
      return true;
    } catch (err) {
      if (err.name === "NotFound") {
        console.log(`file ${filename} was not found`);
        return false;
      } else {
        console.log(`Error while checking for ${filename} file`);
        throw err;
      }
    }
  }
}