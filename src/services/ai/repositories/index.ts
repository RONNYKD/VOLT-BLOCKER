/**
 * AI Repositories - Main export file for all repository classes
 */

export { BaseRepository } from './BaseRepository';
export type { RepositoryError, QueryOptions, PaginatedResult } from './BaseRepository';

export { userRecoveryProfileRepository } from './UserRecoveryProfileRepository';
export type { UserRecoveryProfileInsert, UserRecoveryProfileUpdate } from './UserRecoveryProfileRepository';

export { dailyCheckInRepository } from './DailyCheckInRepository';
export type { DailyCheckInInsert, DailyCheckInUpdate } from './DailyCheckInRepository';

export { milestoneRepository } from './MilestoneRepository';
export type { MilestoneInsert, MilestoneUpdate } from './MilestoneRepository';

// Re-export types from the main types file
export * from '../types';