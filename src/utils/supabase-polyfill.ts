/**
 * Supabase polyfill for React Native
 * Fixes module resolution issues with storage client
 */

// Polyfill for missing modules that aren't needed in our mobile app
if (typeof global !== 'undefined') {
  // Polyfill for storage client (we don't use file storage in mobile app)
  (global as any).StorageClient = (global as any).StorageClient || class StorageClient {
    constructor() {
      console.warn('StorageClient not available in React Native - file storage disabled');
    }
  };
}

// Export empty object to satisfy imports
export {};