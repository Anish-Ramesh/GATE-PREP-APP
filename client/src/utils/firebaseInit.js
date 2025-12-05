import { db } from '../firebase';
import { collection, addDoc, setDoc, doc, getDocs } from 'firebase/firestore';

// GATE subjects
const subjects = [
  {
    name: 'Engineering Mathematics',
    topics: ['Calculus', 'Linear Algebra', 'Probability', 'Statistics', 'Differential Equations']
  },
  {
    name: 'Digital Logic',
    topics: ['Boolean Algebra', 'Combinational Circuits', 'Sequential Circuits', 'Computer Arithmetic']
  },
  {
    name: 'Computer Organization',
    topics: ['Processor Architecture', 'Memory Organization', 'I/O Systems', 'Pipelining']
  },
  {
    name: 'Programming and Data Structures',
    topics: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Algorithms']
  },
  {
    name: 'Operating Systems',
    topics: ['Process Management', 'Memory Management', 'File Systems', 'Deadlocks']
  },
];

// Sample questions for each subject
const sampleQuestions = [
  {
    subject: 'Engineering Mathematics',
    topic: 'Calculus',
    question: 'What is the derivative of ln(x) with respect to x?',
    options: ['1/x', 'x', 'e^x', 'ln(x)'],
    correctAnswer: '1/x',
    explanation: 'The derivative of ln(x) is 1/x. This can be proven using the chain rule.',
    difficulty: 'medium'
  },
  {
    subject: 'Digital Logic',
    topic: 'Boolean Algebra',
    question: 'What is the result of XOR operation between 1 and 1?',
    options: ['0', '1', 'undefined', 'depends on implementation'],
    correctAnswer: '0',
    explanation: 'XOR returns 1 only when inputs are different. When both inputs are 1, XOR returns 0.',
    difficulty: 'easy'
  },
  // Add more sample questions for each subject
];

// Initialize Firestore collections
export const initializeFirestore = async () => {
  try {
    // Initialize Subjects collection
    for (const subject of subjects) {
      await addDoc(collection(db, 'subjects'), subject);
    }

    // Initialize Questions collection
    for (const question of sampleQuestions) {
      await addDoc(collection(db, 'questions'), {
        ...question,
        createdAt: new Date(),
        active: true
      });
    }

    // Create initial collections structure
    const collections = [
      {
        name: 'quizResults',
        structure: {
          userId: 'string',
          subject: 'string',
          score: 'number',
          duration: 'number',
          timestamp: 'date',
          topicScores: 'array'
        }
      },
      {
        name: 'userProgress',
        structure: {
          userId: 'string',
          subjectProgress: 'map',
          totalQuizzesTaken: 'number',
          totalStudyHours: 'number',
          lastActive: 'date'
        }
      },
      {
        name: 'studyMaterials',
        structure: {
          subject: 'string',
          topic: 'string',
          title: 'string',
          content: 'string',
          type: 'string', // 'notes', 'video', 'practice'
          difficulty: 'string'
        }
      }
    ];

    // Create a sample document in each collection to establish structure
    for (const col of collections) {
      const sampleDoc = doc(collection(db, col.name), 'structure');
      await setDoc(sampleDoc, {
        _structureInfo: col.structure,
        _isStructureDocument: true,
        createdAt: new Date()
      });
    }

    console.log('Firebase collections initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase collections:', error);
    return false;
  }
};

// Helper function to add a new question
export const addQuestion = async (questionData) => {
  try {
    const docRef = await addDoc(collection(db, 'questions'), {
      ...questionData,
      createdAt: new Date(),
      active: true
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding question:', error);
    throw error;
  }
};

// Helper function to record quiz result
export const recordQuizResult = async (resultData) => {
  try {
    const docRef = await addDoc(collection(db, 'quizResults'), {
      ...resultData,
      timestamp: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error recording quiz result:', error);
    throw error;
  }
};

// Helper function to update user progress
export const updateUserProgress = async (userId, progressData) => {
  try {
    const userProgressRef = doc(db, 'userProgress', userId);
    await setDoc(userProgressRef, {
      ...progressData,
      lastActive: new Date()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
};

// Helper function to check questions in Firebase
export const checkQuestions = async () => {
  try {
    const questionsRef = collection(db, 'problems');
    const querySnapshot = await getDocs(questionsRef);
    
    const stats = {
      total: querySnapshot.size,
      bySubject: {}
    };

    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.subject) {
        if (!stats.bySubject[data.subject]) {
          stats.bySubject[data.subject] = 0;
        }
        stats.bySubject[data.subject]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error checking questions:', error);
    throw error;
  }
};
