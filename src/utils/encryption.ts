import '../utils/buffer-polyfill';
import { NativeModules } from 'react-native';
import { Buffer } from 'buffer';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export async function encrypt(text: string): Promise<string> {
  try {
    const iv = await NativeModules.VoltCrypto.generateRandomBytes(IV_LENGTH);
    const salt = await NativeModules.VoltCrypto.generateRandomBytes(SALT_LENGTH);
    const key = await NativeModules.VoltCrypto.deriveKey(salt, KEY_LENGTH, ITERATIONS);
    
    const encrypted = await NativeModules.VoltCrypto.encrypt(
      text,
      key,
      iv,
      ALGORITHM
    );
    
    // Combine the salt, iv, and encrypted data
    const combined = Buffer.concat([
      Buffer.from(salt, 'base64'),
      Buffer.from(iv, 'base64'),
      Buffer.from(encrypted.ciphertext, 'base64'),
      Buffer.from(encrypted.tag, 'base64')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const data = Buffer.from(encryptedData, 'base64');
    
    // Extract the components
    const salt = data.slice(0, SALT_LENGTH).toString('base64');
    const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH).toString('base64');
    const tag = data.slice(data.length - TAG_LENGTH).toString('base64');
    const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH, data.length - TAG_LENGTH).toString('base64');
    
    const key = await NativeModules.VoltCrypto.deriveKey(salt, KEY_LENGTH, ITERATIONS);
    
    const decrypted = await NativeModules.VoltCrypto.decrypt(
      ciphertext,
      key,
      iv,
      tag,
      ALGORITHM
    );
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}
