import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsInt, IsString } from 'class-validator';
import { Prop, Schema as SchemaDecorator, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = Job & Document;
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@SchemaDecorator({ timestamps: true })
export class Job {
  @Prop({ required: false })
  @ApiProperty({
    required: false,
    name: '_id',
    description: 'Id created by mongo DB',
    example: '649ae2571dfa8d874983c544'
  })
  @IsNotEmpty()
  _id: string;

  @Prop({ required: false })
  @ApiProperty({
    required: false,
    name: 'status',
    description: 'Status of the job',
    example: 'pending'
  })
  @IsEnum(JobStatus)
  status: JobStatus;

  @Prop({ required: false })
  @ApiProperty({
    required: false,
    name: 'execTime',
    description: 'Timestamp of the execution time',
    example: 1234353456
  })
  @IsInt()
  execTime: number;

  @Prop({ required: false })
  @ApiProperty({
    required: false,
    name: 'tries',
    description: 'Number of previous attempts to execute this job',
    example: 1
  })
  @IsInt()
  tries: number;


  @Prop({ required: true })
  @ApiProperty({
    required: true,
    name: 'filename',
    description: 'File name on S3',
    example: 'myFile.csv'
  })
  @IsString()
  filename: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);