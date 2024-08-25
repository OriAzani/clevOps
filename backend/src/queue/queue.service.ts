import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { utils } from '../utils'
import { FileService } from '../file/file.service';
import { Job, JobStatus } from './queue.model';

@Injectable()
export class QueueService implements OnApplicationBootstrap {

  constructor(
    @InjectModel('QUEUE_SCHEMA') private queueModel: Model<Job>,
    private readonly eventEmitter: EventEmitter2,
    private readonly fileService: FileService
  ) { }

  private JOB_RUNTIME_LIMIT_IN_HOURS = 1;
  private MAX_JOB_RETRIES = 3;

  @Cron(CronExpression.EVERY_HOUR)
  handleCron() {
    this._init();
  }

  async onApplicationBootstrap() {
    this._init();
  }

  private _init() {
    this.manageQueueJobExecution();
  }

  @OnEvent('job.created')
  async handleJobCreatedEvent() {
    console.log(`Event job.created was triggered`);
    await utils.sleep(3);
    this.manageQueueJobExecution();
  }

  @OnEvent('job.status-change')
  async handleJobStatusChangeEvent() {
    console.log(`Event job.status-changed was triggered`);
    await utils.sleep(3);
    this.manageQueueJobExecution();
  }

  private async manageQueueJobExecution() {
    const job = await this._getNextJob();
    if (!job) {
      console.log(`No job to execute on queue`);
      return;
    }

    const { _id: id, execTime, status } = job;
    
    // Verify that the job is not stuck 
    if (status === JobStatus.RUNNING) {
      const currTimeSeconds = Math.floor(Date.now() / 1000);
      const jobRuntimeMinutes = ((currTimeSeconds - execTime) / 60).toFixed(2);
      const jobRuntimeHours = (currTimeSeconds - execTime) / 3600;

      if (jobRuntimeHours >= this.JOB_RUNTIME_LIMIT_IN_HOURS) {
        console.warn(`Job ${id} has been running for ${jobRuntimeMinutes} minutes`);
        this._handleFailedJob(id);
      } else {
        console.log(`Job ${id} has been running for ${jobRuntimeMinutes} minutes`);
      }
    }

    if (status === JobStatus.PENDING) {
      this.executeJob(job);
    }
  }

  async createJob(filename: string) {
    try {

      const newJob = new this.queueModel({
        _id: new Types.ObjectId(),
        status: JobStatus.PENDING,
        tries: 0,
        filename,
      });

      const createdJob = await newJob.save();
      const jobObject = createdJob.toObject();
      console.log(`Job created successfully`);
      this.eventEmitter.emit('job.created');

      return jobObject
    } catch (err) {
      console.error('Failed creating job', err);
    }
  }

  private async _handleFailedJob(id: string) {
    const job = await this._getJobById(id);

    if (!job) {
      throw Error(`Could not find job ${id} `);
    }

    console.log(`Handling failed job ${id}`);
    const updateJobPayload = {
      id,
      status: JobStatus.PENDING // set pending so queue will try to run this job again
    }
    if (job.tries >= this.MAX_JOB_RETRIES) {
      updateJobPayload.status = JobStatus.FAILED;
    }

    const res = await this.updateJob(updateJobPayload);
    console.log(`Job ${id} was updated` , res);
  }


  private async _getJobById(id: string) {
    try {
      return await this.queueModel.findById(id).lean().exec();
    } catch (err) {
      console.error(`Failed getting job ${id}`)
    }
  }
  async _getNextJob() {
    let jobToReturn = null;
    try {
      const activeJobsArr = await this.queueModel.find({ status: { $nin: [JobStatus.FAILED, JobStatus.COMPLETED] } }).sort({ createdAt: 1 }).lean().exec();
      if (activeJobsArr.length > 0) {
        jobToReturn = activeJobsArr[0];
      }

      return jobToReturn;
    } catch (err) {
      console.error(`Failed getting next job. ${err}`);
      throw new Error(err);
    }
  }


  async updateJob(payload: any) {
    const { id, ...dataToUpdate } = payload;
    console.log(`Trying to update job ${id}`);

    try {
      const updatedJob = await this.queueModel.findByIdAndUpdate(id, dataToUpdate, { new: true });
      if (!updatedJob) {
        throw new Error(`Could not find job ${id}`);
      }

      const updatedJobObject = updatedJob.toObject();
      return updatedJobObject;
    } catch (err) {
      console.error(`Failed updating ${id}. ${err}`);
    }
  }


  private async executeJob(job: Job) {
    const { _id: id, filename } = job;

    try {
      console.log(`Preparing job ${id}`);
      const updatePayload = {
        id,
        execTime: Math.floor(Date.now() / 1000),
        status: JobStatus.RUNNING
      }
      const prepJob = await this.updateJob(updatePayload);
      console.log(`Job ${id} was updated`, prepJob);

      console.log(`Executing job ${id}`);
      const res = this.fileService.handleUploadedFile(filename);
      if (res) {
        const updatePayload = {
          id,
          execTime: Math.floor(Date.now() / 1000),
          status: JobStatus.COMPLETED
        }
        const res = await this.updateJob(updatePayload);
        console.log(`Job ${id} was updated`, res);
      } else {
        if (res) {
          this._handleFailedJob(id)
        }
      }
    } catch (err) {
      console.error(`Failed executing jon ${id}`);
      this._handleFailedJob(id)
    }
  }
}