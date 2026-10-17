import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  logger = new Logger(RedisService.name);
  client = null;

  constructor() {
    const redisHost = process.env.REDIS_HOST;
    if (!redisHost) {
      this.logger.log('REDIS_HOST not configured. Running without external Redis caching.');
      return;
    }

    try {
      this.client = new Redis({
        host: redisHost,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        this.logger.warn(`[Redis] Connection warning: ${err.message}`);
      });
    } catch (err) {
      this.logger.warn(`[Redis] Failed to initialize Redis client: ${err.message}`);
      this.client = null;
    }
  }

  async get(key) {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    if (!this.client) return null;
    try {
      if (ttlSeconds) {
        return await this.client.set(key, value, 'EX', ttlSeconds);
      }
      return await this.client.set(key, value);
    } catch {
      return null;
    }
  }

  async del(key) {
    if (!this.client) return null;
    try {
      return await this.client.del(key);
    } catch {
      return null;
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
