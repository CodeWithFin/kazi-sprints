import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { getRedisConnection } from './queue.js';
import { processPushJob } from './process-push.js';

dotenv.config();

const worker = new Worker(
  'github-push',
  async (job) => {
    if (job.name === 'process-push') {
      return processPushJob(job);
    }
    throw new Error(`Unknown job: ${job.name}`);
  },
  { connection: getRedisConnection() }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log('ppp-worker listening for github-push jobs');
