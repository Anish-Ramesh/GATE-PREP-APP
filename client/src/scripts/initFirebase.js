import { initializeFirestore } from '../utils/firebaseInit';

const initializeDatabase = async () => {
  try {
    console.log('Starting Firebase initialization...');
    const success = await initializeFirestore();
    
    if (success) {
      console.log('Firebase initialization completed successfully!');
    } else {
      console.error('Firebase initialization failed.');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }
};

// Run initialization
initializeDatabase();
