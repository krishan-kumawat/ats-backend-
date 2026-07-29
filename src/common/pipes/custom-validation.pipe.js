import { Injectable, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe {
  constructor(metatype) {
    this.metatype = metatype;
  }

  async transform(value, metadata) {
    // Only run validation for request body payloads
    if (metadata && metadata.type !== 'body') {
      return value;
    }

    // Prevent empty or null bodies
    if (!value || Object.keys(value).length === 0) {
      throw new BadRequestException('Request body must not be empty');
    }

    if (!this.metatype || !this.toValidate(this.metatype)) {
      return value;
    }

    // Convert plain JavaScript object to DTO instance
    const object = plainToInstance(this.metatype, value);
    
    // Validate instance
    const errors = await validate(object);
    if (errors.length > 0) {
      const messages = errors.flatMap((err) => Object.values(err.constraints));
      throw new BadRequestException({
        statusCode: 400,
        message: messages,
        error: 'Bad Request',
      });
    }
    return object;
  }

  toValidate(metatype) {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
