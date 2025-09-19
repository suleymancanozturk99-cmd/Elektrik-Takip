import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDj3wuBl9tVTpfiY0d8bteLaG0dVitdlhA",
  authDomain: "elektrikci-8cb43.firebaseapp.com",
  databaseURL: "https://elektrikci-8cb43-default-rtdb.firebaseio.com/",
  projectId: "elektrikci-8cb43",
  storageBucket: "elektrikci-8cb43.appspot.com",
  messagingSenderId: "880417928580",
  appId: "1:880417928580:web:34b641b19d1437b52dd9d1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

// Initialize Auth (optional)
export const auth = getAuth(app);

// Consistent device ID generation
export const getDeviceId = (): string => {
  try {
    // Create consistent device ID using available device info
    const deviceInfo = {
      model: Device.modelName || 'Unknown',
      platform: Platform.OS,
      installation: Constants.installationId || 'default',
    };
    
    // Create a more readable device ID
    const deviceId = `${deviceInfo.platform}_${deviceInfo.model}_${deviceInfo.installation}`
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    
    return deviceId;
  } catch (error) {
    // Fallback to a simple ID if device info is not available
    return `device_${Platform.OS}_${Date.now()}`;
  }
};

export default app;