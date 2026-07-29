import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class SharingEventService extends EventEmitter {
  constructor() {
    super();
  }
}
