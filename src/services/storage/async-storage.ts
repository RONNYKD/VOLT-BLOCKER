/**
 * AsyncStorage service for local data persistence
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../../utils/logger';

/**
 * Set a string value in storage
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    logger.error(`Error setting item ${key} in AsyncStorage:`, error);
    throw error;
  }
};

/**
 * Get a string value from storage
 */
export const getItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    logger.error(`Error getting item ${key} from AsyncStorage:`, error);
    throw error;
  }
};

/**
 * Set an object value in storage (serialized as JSON)
 */
export const setObject = async <T>(key: string, value: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    logger.error(`Error setting object ${key} in AsyncStorage:`, error);
    throw error;
  }
};

/**
 * Get an object value from storage (parsed from JSON)
 */
export const getObject = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) as T : null;
  } catch (error) {
    logger.error(`Error getting object ${key} from AsyncStorage:`, error);
    throw error;
  }
};

/**
 * Remove an item from storage
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logger.error(`Error removing item ${key} from AsyncStorage:`, error);
    throw error;
  }
};

/**
 * Clear all storage
 */
export const clear = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    logger.error('Error clearing AsyncStorage:', error);
    throw error;
  }
};

/**
 * Get all keys in storage
 */
export const getAllKeys = async (): Promise<string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return [...keys]; // Convert readonly array to mutable array
  } catch (error) {
    logger.error('Error getting all keys from AsyncStorage:', error);
    throw error;
  }
};