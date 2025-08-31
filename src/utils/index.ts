/**
 * Utilities index file
 * Exports all utility functions and classes
 */

// Storage utilities
export * from './storage';
export * from './migrations';
export * from './validation';
export * from './error-handling';
export * from './storage-test';
export * from './storage-init';

// Secure storage utilities
export * from './secure-storage';
export * from './secure-cleanup';
export * from './secure-storage-test';

// App state management
export * from './app-state-manager';

// Re-export commonly used functions
export { storage } from './storage';
export { migrations } from './migrations';
export { validate } from './validation';
export { errorHandler } from './error-handling';
export { runStorageTests, testPersistence } from './storage-test';
export { initializeStorage, isStorageReady, getStorageStatus, resetStorage } from './storage-init';
export { secureStorage } from './secure-storage';
export { secureCleanup } from './secure-cleanup';
export { runSecureStorageTests, testSecureStoragePerformance } from './secure-storage-test';
export { appStateManager } from './app-state-manager';