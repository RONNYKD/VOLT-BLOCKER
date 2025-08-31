/**
 * Data validation utilities for storage operations
 * Provides schema validation and data integrity checks
 */

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Schema definition interface
export interface SchemaDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

// Data validator class
export class DataValidator {
  /**
   * Validate data against a schema
   */
  static validate(data: any, schema: SchemaDefinition, path: string = 'root'): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check if data is required but missing
    if (schema.required && (data === null || data === undefined)) {
      result.errors.push(`${path}: Required field is missing`);
      result.isValid = false;
      return result;
    }

    // Skip validation if data is null/undefined and not required
    if (data === null || data === undefined) {
      return result;
    }

    // Type validation
    const typeResult = this.validateType(data, schema.type, path);
    result.errors.push(...typeResult.errors);
    result.warnings.push(...typeResult.warnings);
    if (!typeResult.isValid) {
      result.isValid = false;
    }

    // Additional validations based on type
    switch (schema.type) {
      case 'string':
        const stringResult = this.validateString(data, schema, path);
        result.errors.push(...stringResult.errors);
        result.warnings.push(...stringResult.warnings);
        if (!stringResult.isValid) result.isValid = false;
        break;

      case 'number':
        const numberResult = this.validateNumber(data, schema, path);
        result.errors.push(...numberResult.errors);
        result.warnings.push(...numberResult.warnings);
        if (!numberResult.isValid) result.isValid = false;
        break;

      case 'object':
        const objectResult = this.validateObject(data, schema, path);
        result.errors.push(...objectResult.errors);
        result.warnings.push(...objectResult.warnings);
        if (!objectResult.isValid) result.isValid = false;
        break;

      case 'array':
        const arrayResult = this.validateArray(data, schema, path);
        result.errors.push(...arrayResult.errors);
        result.warnings.push(...arrayResult.warnings);
        if (!arrayResult.isValid) result.isValid = false;
        break;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(data)) {
      result.errors.push(`${path}: Value must be one of: ${schema.enum.join(', ')}`);
      result.isValid = false;
    }

    // Custom validation
    if (schema.custom) {
      const customResult = schema.custom(data);
      if (typeof customResult === 'string') {
        result.errors.push(`${path}: ${customResult}`);
        result.isValid = false;
      } else if (!customResult) {
        result.errors.push(`${path}: Custom validation failed`);
        result.isValid = false;
      }
    }

    return result;
  }

  private static validateType(data: any, expectedType: string, path: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };
    const actualType = Array.isArray(data) ? 'array' : typeof data;

    if (actualType !== expectedType) {
      result.errors.push(`${path}: Expected ${expectedType}, got ${actualType}`);
      result.isValid = false;
    }

    return result;
  }

  private static validateString(data: string, schema: SchemaDefinition, path: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    if (schema.minLength && data.length < schema.minLength) {
      result.errors.push(`${path}: String too short (min: ${schema.minLength})`);
      result.isValid = false;
    }

    if (schema.maxLength && data.length > schema.maxLength) {
      result.errors.push(`${path}: String too long (max: ${schema.maxLength})`);
      result.isValid = false;
    }

    if (schema.pattern && !schema.pattern.test(data)) {
      result.errors.push(`${path}: String does not match required pattern`);
      result.isValid = false;
    }

    return result;
  }

  private static validateNumber(data: number, schema: SchemaDefinition, path: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    if (schema.min !== undefined && data < schema.min) {
      result.errors.push(`${path}: Number too small (min: ${schema.min})`);
      result.isValid = false;
    }

    if (schema.max !== undefined && data > schema.max) {
      result.errors.push(`${path}: Number too large (max: ${schema.max})`);
      result.isValid = false;
    }

    if (!Number.isFinite(data)) {
      result.errors.push(`${path}: Number must be finite`);
      result.isValid = false;
    }

    return result;
  }

  private static validateObject(data: object, schema: SchemaDefinition, path: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const propPath = `${path}.${key}`;
        const propValue = (data as any)[key];
        const propResult = this.validate(propValue, propSchema, propPath);
        
        result.errors.push(...propResult.errors);
        result.warnings.push(...propResult.warnings);
        if (!propResult.isValid) {
          result.isValid = false;
        }
      }
    }

    return result;
  }

  private static validateArray(data: any[], schema: SchemaDefinition, path: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    if (schema.minLength && data.length < schema.minLength) {
      result.errors.push(`${path}: Array too short (min: ${schema.minLength})`);
      result.isValid = false;
    }

    if (schema.maxLength && data.length > schema.maxLength) {
      result.errors.push(`${path}: Array too long (max: ${schema.maxLength})`);
      result.isValid = false;
    }

    if (schema.items) {
      data.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        const itemResult = this.validate(item, schema.items!, itemPath);
        
        result.errors.push(...itemResult.errors);
        result.warnings.push(...itemResult.warnings);
        if (!itemResult.isValid) {
          result.isValid = false;
        }
      });
    }

    return result;
  }
}

// Predefined schemas for common data types
export const schemas = {
  user: {
    type: 'object' as const,
    required: true,
    properties: {
      id: { type: 'string' as const, required: true },
      email: { 
        type: 'string' as const, 
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
      username: { type: 'string' as const, minLength: 1, maxLength: 50 },
      avatar_url: { type: 'string' as const },
      created_at: { type: 'string' as const, required: true },
      updated_at: { type: 'string' as const, required: true },
    },
  },

  blockedApp: {
    type: 'object' as const,
    required: true,
    properties: {
      id: { type: 'string' as const, required: true },
      packageName: { type: 'string' as const, required: true, minLength: 1 },
      appName: { type: 'string' as const, required: true, minLength: 1 },
      iconUrl: { type: 'string' as const },
      isBlocked: { type: 'boolean' as const, required: true },
      category: { type: 'string' as const },
      addedAt: { type: 'string' as const, required: true },
      updatedAt: { type: 'string' as const, required: true },
    },
  },

  blockedWebsite: {
    type: 'object' as const,
    required: true,
    properties: {
      id: { type: 'string' as const, required: true },
      url: { type: 'string' as const, required: true, minLength: 1 },
      domain: { type: 'string' as const, required: true, minLength: 1 },
      title: { type: 'string' as const },
      isBlocked: { type: 'boolean' as const, required: true },
      category: { type: 'string' as const },
      addedAt: { type: 'string' as const, required: true },
      updatedAt: { type: 'string' as const, required: true },
    },
  },

  focusSession: {
    type: 'object' as const,
    required: true,
    properties: {
      id: { type: 'string' as const, required: true },
      userId: { type: 'string' as const },
      duration: { type: 'number' as const, required: true, min: 1 },
      actualDuration: { type: 'number' as const, min: 0 },
      startTime: { type: 'string' as const, required: true },
      endTime: { type: 'string' as const },
      status: { 
        type: 'string' as const, 
        required: true,
        enum: ['active', 'paused', 'completed', 'cancelled'],
      },
      blockedApps: { 
        type: 'array' as const, 
        required: true,
        items: { type: 'string' as const },
      },
      blockedWebsites: { 
        type: 'array' as const, 
        required: true,
        items: { type: 'string' as const },
      },
      pausedAt: { type: 'string' as const },
      pauseDuration: { type: 'number' as const, required: true, min: 0 },
      createdAt: { type: 'string' as const, required: true },
      updatedAt: { type: 'string' as const, required: true },
    },
  },

  settings: {
    type: 'object' as const,
    required: true,
    properties: {
      theme: { 
        type: 'string' as const, 
        required: true,
        enum: ['light', 'dark', 'system'],
      },
      notifications: { type: 'boolean' as const, required: true },
      strictMode: { type: 'boolean' as const, required: true },
      defaultSessionDuration: { 
        type: 'number' as const, 
        required: true, 
        min: 1, 
        max: 480, // 8 hours max
      },
    },
  },
};

// Convenience validation functions
export const validate = {
  user: (data: any) => DataValidator.validate(data, schemas.user),
  blockedApp: (data: any) => DataValidator.validate(data, schemas.blockedApp),
  blockedWebsite: (data: any) => DataValidator.validate(data, schemas.blockedWebsite),
  focusSession: (data: any) => DataValidator.validate(data, schemas.focusSession),
  settings: (data: any) => DataValidator.validate(data, schemas.settings),
  custom: (data: any, schema: SchemaDefinition) => DataValidator.validate(data, schema),
};