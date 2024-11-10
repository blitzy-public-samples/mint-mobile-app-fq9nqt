// Library versions:
// @nestjs/common: ^9.0.0
// class-validator: ^0.14.0
// class-transformer: ^0.5.1

import { 
  PipeTransform, 
  ArgumentMetadata, 
  BadRequestException, 
  Injectable 
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PaginationParams } from '../utils/pagination.util';

/**
 * Human Tasks:
 * 1. Monitor validation performance metrics and optimize if needed
 * 2. Review and update validation rules based on security requirements
 * 3. Configure error message translations if internationalization is needed
 */

/**
 * Interface for validation pipe configuration options
 * @requirement Input Validation
 */
export interface ValidationPipeOptions {
  skipMissingProperties?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  transform?: boolean;
  disableErrorMessages?: boolean;
  validationError?: {
    target?: boolean;
    value?: boolean;
  };
}

/**
 * Custom validation pipe that provides comprehensive request payload validation
 * @requirement Input Validation
 * @requirement Security Controls
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  private readonly options: ValidationPipeOptions;

  constructor(options: ValidationPipeOptions = {}) {
    this.options = {
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: true
      },
      ...options
    };
  }

  /**
   * Transforms and validates incoming request data
   * @requirement Input Validation
   * @requirement Security Controls
   */
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    // Skip validation for primitives
    if (!value || this.isPrimitive(value)) {
      return value;
    }

    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metadata)) {
      return value;
    }

    // Special handling for pagination parameters
    if (this.isPaginationParams(value)) {
      return this.validatePaginationParams(value);
    }

    // Transform plain object to class instance
    const object = plainToClass(metatype, value, {
      enableImplicitConversion: this.options.transform
    });

    // Validate the object using class-validator
    const errors = await validate(object, {
      skipMissingProperties: this.options.skipMissingProperties,
      whitelist: this.options.whitelist,
      forbidNonWhitelisted: this.options.forbidNonWhitelisted
    });

    if (errors.length > 0) {
      const messages = this.formatErrors(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages
      });
    }

    return object;
  }

  /**
   * Checks if the value is a primitive type
   * @requirement Input Validation
   */
  private isPrimitive(value: any): boolean {
    return ['string', 'boolean', 'number', 'bigint'].includes(typeof value);
  }

  /**
   * Determines if the metadata type should be validated
   * @requirement Input Validation
   */
  private toValidate(metadata: ArgumentMetadata): boolean {
    const { metatype } = metadata;
    if (!metatype) {
      return false;
    }

    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Checks if the value represents pagination parameters
   * @requirement Input Validation
   */
  private isPaginationParams(value: any): boolean {
    return (
      value &&
      typeof value === 'object' &&
      ('page' in value || 'limit' in value)
    );
  }

  /**
   * Validates pagination parameters
   * @requirement Input Validation
   */
  private validatePaginationParams(value: any): PaginationParams {
    const page = Number(value.page);
    const limit = Number(value.limit);

    if (page && isNaN(page)) {
      throw new BadRequestException('Page must be a number');
    }

    if (limit && isNaN(limit)) {
      throw new BadRequestException('Limit must be a number');
    }

    if (page && page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }

    if (limit && limit < 1) {
      throw new BadRequestException('Limit must be greater than 0');
    }

    return {
      page: page || undefined,
      limit: limit || undefined
    };
  }

  /**
   * Formats validation errors into user-friendly messages
   * @requirement Input Validation
   * @requirement Security Controls
   */
  private formatErrors(errors: any[]): string[] {
    if (this.options.disableErrorMessages) {
      return ['Validation failed'];
    }

    return errors.map(error => {
      const constraints = error.constraints;
      if (!constraints) {
        return 'Invalid input';
      }

      return Object.values(constraints).map(message => 
        typeof message === 'string' ? message : 'Invalid input'
      );
    }).flat();
  }
}

export default ValidationPipe;