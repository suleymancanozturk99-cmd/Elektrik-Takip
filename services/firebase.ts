import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: "AIzaSyDj3wuBl9tVTpfiY0d8bteLaG0dVitdlhA",
  authDomain: "elektrikci-8cb43.firebaseapp.com",
  projectId: "elektrikci-8cb43",
  storageBucket: "elektrikci-8cb43.appspot.com",
  messagingSenderId: "880417928580",
  appId: "1:880417928580:web:34b641b19d1437b52dd9d1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth (optional)
export const auth = getAuth(app);

// Device ID generation for data separation
export const getDeviceId = (): string => {
  // Generate unique device ID
  const deviceId = Device.modelName + '_' + Constants.installationId;
  return deviceId.replace(/[^a-zA-Z0-9]/g, '_');
};

export default app;