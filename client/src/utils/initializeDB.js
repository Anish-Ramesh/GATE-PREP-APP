import { initializeQuestions } from './initQuestions.js';

// Function to initialize the database
export const initializeDatabase = async () => {
  try {
    console.log('Starting database initialization...');
    
    // Initialize questions
    console.log('Initializing questions...');
    await initializeQuestions();
    console.log('Questions initialized successfully!');
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
