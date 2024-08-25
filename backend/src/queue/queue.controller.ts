import { Controller, Post, Body } from '@nestjs/common';
import { QueueService } from './queue.service';

// DTO
interface AddJobPayload {
  filename: string;
}

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) { }

  @Post('addJob')
  async addJob(@Body() payload: AddJobPayload) {
    await this.queueService.createJob(payload.filename);
  }
}