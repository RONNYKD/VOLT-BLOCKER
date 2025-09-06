/**
 * Base Repository - Abstract base class for all repositories
 * Provides common CRUD operations and error handling
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../supabase';

export interface RepositoryError {
  code: string;
  message: string;
  details?: any;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  nextOffset?: number;
}

export abstract class BaseRepository<T, TInsert = Omit<T, 'id' | 'created_at' | 'updated_at'>, TUpdate = Partial<TInsert>> {
  protected client: SupabaseClient;
  protected abstract tableName: string;

  constructor() {
    this.client = supabase.getClient();
  }

  /**
   * Find record by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows found
        }
        throw this.createRepositoryError(error);
      }

      return data as T;
    } catch (error) {
      console.error(`Error finding ${this.tableName} by ID:`, error);
      throw error;
    }
  }

  /**
   * Find records by user ID
   */
  async findByUserId(userId: string, options?: QueryOptions): Promise<T[]> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection !== 'desc' 
        });
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw this.createRepositoryError(error);
      }

      return (data as T[]) || [];
    } catch (error) {
      console.error(`Error finding ${this.tableName} by user ID:`, error);
      throw error;
    }
  }

  /**
   * Find records with pagination
   */
  async findPaginated(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    try {
      const limit = options.limit || 10;
      const offset = options.offset || 0;

      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection !== 'desc' 
        });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw this.createRepositoryError(error);
      }

      const totalCount = count || 0;
      const hasMore = offset + limit < totalCount;
      const nextOffset = hasMore ? offset + limit : undefined;

      return {
        data: (data as T[]) || [],
        count: totalCount,
        hasMore,
        nextOffset,
      };
    } catch (error) {
      console.error(`Error finding paginated ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create new record
   */
  async create(data: TInsert): Promise<T> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert(data as any)
        .select()
        .single();

      if (error) {
        throw this.createRepositoryError(error);
      }

      return result as T;
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create multiple records
   */
  async createMany(data: TInsert[]): Promise<T[]> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert(data as any[])
        .select();

      if (error) {
        throw this.createRepositoryError(error);
      }

      return (result as T[]) || [];
    } catch (error) {
      console.error(`Error creating multiple ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update record by ID
   */
  async update(id: string, data: TUpdate): Promise<T | null> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows found
        }
        throw this.createRepositoryError(error);
      }

      return result as T;
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete record by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw this.createRepositoryError(error);
      }

      return true;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete records by user ID
   */
  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw this.createRepositoryError(error);
      }

      return true;
    } catch (error) {
      console.error(`Error deleting ${this.tableName} by user ID:`, error);
      throw error;
    }
  }

  /**
   * Count records
   */
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { count, error } = await query;

      if (error) {
        throw this.createRepositoryError(error);
      }

      return count || 0;
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        throw this.createRepositoryError(error);
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error(`Error checking if ${this.tableName} exists:`, error);
      throw error;
    }
  }

  /**
   * Execute raw query
   */
  protected async executeQuery(query: string, params?: any[]): Promise<any> {
    try {
      const { data, error } = await this.client.rpc('execute_sql', {
        query,
        params: params || [],
      });

      if (error) {
        throw this.createRepositoryError(error);
      }

      return data;
    } catch (error) {
      console.error(`Error executing query on ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create standardized repository error
   */
  protected createRepositoryError(error: any): RepositoryError {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error.details || error,
    };
  }

  /**
   * Validate required fields
   */
  protected validateRequired(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missingFields.length > 0) {
      throw {
        code: 'VALIDATION_ERROR',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        details: { missingFields },
      };
    }
  }

  /**
   * Validate data types
   */
  protected validateTypes(data: any, typeValidations: Record<string, string>): void {
    const invalidFields: string[] = [];

    Object.entries(typeValidations).forEach(([field, expectedType]) => {
      const value = data[field];
      if (value !== undefined && value !== null) {
        const actualType = typeof value;
        if (actualType !== expectedType) {
          invalidFields.push(`${field} (expected ${expectedType}, got ${actualType})`);
        }
      }
    });

    if (invalidFields.length > 0) {
      throw {
        code: 'TYPE_VALIDATION_ERROR',
        message: `Invalid field types: ${invalidFields.join(', ')}`,
        details: { invalidFields },
      };
    }
  }

  /**
   * Sanitize data before database operations
   */
  protected sanitizeData(data: any): any {
    const sanitized = { ...data };

    // Remove undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });

    // Trim string values
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      }
    });

    return sanitized;
  }
}