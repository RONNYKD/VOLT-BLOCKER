import '../utils/buffer-polyfill';
import EncryptedStorage from 'react-native-encrypted-storage';
import { encrypt, decrypt } from '../utils/encryption';

export class SecureStorage {
  static async setItem(key: string, value: string): Promise<void> {
    try {
      const encryptedValue = await encrypt(value);
      await EncryptedStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Error storing secure item:', error);
      throw error;
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      const encryptedValue = await EncryptedStorage.getItem(key);
      if (!encryptedValue) return null;
      return await decrypt(encryptedValue);
    } catch (error) {
      console.error('Error retrieving secure item:', error);
      throw error;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await EncryptedStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing secure item:', error);
      throw error;
    }
  }

  static async clear(): Promise<void> {
    try {
      await EncryptedStorage.clear();
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      throw error;
    }
  }
}
