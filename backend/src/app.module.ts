import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from "@nestjs/schedule";

import { FileController } from './file/file.controller';
import { FileService } from './file/file.service';

import { QueueController } from './queue/queue.controller';
import { QueueService } from './queue/queue.service';
import { JobSchema } from './queue/queue.model'

const MONGO_URL = process.env.MONGO_URL;

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(MONGO_URL, {
      dbName: "clev-ops-queue"
    }),
    MongooseModule.forFeature([
      { name: 'QUEUE_SCHEMA', schema: JobSchema, collection: 'clevOpsQueue' },
    ]),
    EventEmitterModule.forRoot()
  ],
  controllers: [FileController, QueueController],
  providers: [FileService,QueueService],
})
export class AppModule { }