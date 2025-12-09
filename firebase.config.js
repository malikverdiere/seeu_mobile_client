import { initializeApp, getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { getMessaging } from '@react-native-firebase/messaging';

// Initialize Firebase - do this only once
let app;
try {
  app = getApp();
} catch (error) {
  app = initializeApp();
}

// Export initialized services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const messaging = getMessaging(app);
export const onHttpsCallable = (name) => httpsCallable(functions, name);

export default app;