/**
 * VOLT App Entry Point
 */
import { AppRegistry } from 'react-native';
import App from '../App';
import { name as appName } from '../app.json';
import { logger } from './utils/logger';

// Initialize app dependencies
const initializeApp = () => {
  // Set up logging
  if (__DEV__) {
    logger.setLogLevel('debug');
  } else {
    logger.setLogLevel('info');
  }
  
  logger.info('VOLT App initializing...');
};

// Initialize the app
initializeApp();

// Register the app
AppRegistry.registerComponent(appName, () => App);