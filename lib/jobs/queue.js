import { Queue } from 'bullmq';
import IORedis from 'ioredis';

let connection;
let pushQueue;

export function getRedisConnection() {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export function getPushQueue() {
  if (!pushQueue) {
    pushQueue = new Queue('github-push', {
      connection: getRedisConnection(),
    });
  }
  return pushQueue;
}
