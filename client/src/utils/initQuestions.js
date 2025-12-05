import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Helper functions
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = array => [...array].sort(() => Math.random() - 0.5);

// Initialize questions in Firebase
export const initializeQuestions = async () => {
  try {
    console.log('Starting question initialization...');
    
    // Check if questions already exist
    const questionsRef = collection(db, 'problems');
    const existingQuestions = await getDocs(questionsRef);
    
    if (!existingQuestions.empty) {
      console.log(`Found ${existingQuestions.size} existing questions, skipping initialization`);
      return;
    }

    console.log('No existing questions found, starting generation...');
    const questions = [];
    let questionId = 1;

    // Generate questions for each subject
    Object.entries(questionGenerators).forEach(([subject, topics]) => {
      Object.entries(topics).forEach(([topic, generators]) => {
        // Calculate questions per generator to reach approximately 100 questions per subject
        const totalGenerators = Object.keys(topics).reduce((sum, t) => sum + topics[t].length, 0);
        const questionsPerGenerator = Math.ceil(100 / totalGenerators);

        generators.forEach(generator => {
          for (let i = 0; i < questionsPerGenerator; i++) {
            const { text, options } = generator.generate();
            
            const question = {
              id: `Q${questionId.toString().padStart(4, '0')}`,
              subject,
              topic,
              title: `${topic} - Question ${i + 1}`,
              text,
              difficulty: ['Easy', 'Medium', 'Hard'][getRandomInt(0, 2)],
              options: shuffleArray(options),
              createdAt: new Date().toISOString()
            };

            questions.push(question);
            questionId++;
          }
        });
      });
    });

    console.log(`Generated total of ${questions.length} questions, starting upload...`);

    // Upload questions to Firebase in batches
    const batchSize = 50;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      console.log(`Uploading batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(questions.length/batchSize)}...`);
      await Promise.all(batch.map(question => addDoc(questionsRef, question)));
      console.log(`Uploaded questions ${i + 1} to ${Math.min(i + batchSize, questions.length)}`);
    }

    console.log('Successfully initialized all questions!');
  } catch (error) {
    console.error('Error initializing questions:', error);
    throw error;
  }
};

// Function to get questions for a specific subject
export const getQuestionsBySubject = async (subject) => {
  try {
    const questionsRef = collection(db, 'problems');
    const q = query(questionsRef, where('subject', '==', subject));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

// Question generators for each subject and topic
export const questionGenerators = {
  Mathematics: {
    Calculus: [
      {
        generate: () => {
          const a = getRandomInt(2, 10);
          const b = getRandomInt(2, 5);
          return {
            text: `Find the derivative of f(x) = ${a}x^${b}`,
            options: [
              { text: `${a * b}x^${b-1}`, displayText: `Option A: ${a * b}x^${b-1}`, isCorrect: true },
              { text: `${a}x^${b+1}`, displayText: `Option B: ${a}x^${b+1}`, isCorrect: false },
              { text: `${a * b}x^${b}`, displayText: `Option C: ${a * b}x^${b}`, isCorrect: false },
              { text: `${a}x^${b-1}`, displayText: `Option D: ${a}x^${b-1}`, isCorrect: false }
            ]
          };
        }
      },
      {
        generate: () => {
          const values = [2, 3, 4, 5];
          const a = values[getRandomInt(0, 3)];
          return {
            text: `Find the integral of f(x) = ${a}x`,
            options: [
              { text: `${a/2}x^2 + C`, displayText: `Option A: ${a/2}x^2 + C`, isCorrect: true },
              { text: `${a}x^2 + C`, displayText: `Option B: ${a}x^2 + C`, isCorrect: false },
              { text: `${a}x + C`, displayText: `Option C: ${a}x + C`, isCorrect: false },
              { text: `${a/2}x + C`, displayText: `Option D: ${a/2}x + C`, isCorrect: false }
            ]
          };
        }
      }
    ],
    Probability: [
      {
        generate: () => {
          const total = getRandomInt(20, 50);
          const success = getRandomInt(5, total-5);
          const probability = (success/total).toFixed(2);
          return {
            text: `In a sample of ${total} trials, if ${success} are successful, what is the probability of success?`,
            options: [
              { text: probability, displayText: `Option A: ${probability}`, isCorrect: true },
              { text: (success/(total-5)).toFixed(2), displayText: `Option B: ${(success/(total-5)).toFixed(2)}`, isCorrect: false },
              { text: ((success+2)/total).toFixed(2), displayText: `Option C: ${((success+2)/total).toFixed(2)}`, isCorrect: false },
              { text: ((success-2)/total).toFixed(2), displayText: `Option D: ${((success-2)/total).toFixed(2)}`, isCorrect: false }
            ]
          };
        }
      }
    ]
  },
  'Digital Logic': {
    'Boolean Algebra': [
      {
        generate: () => {
          const operations = ['AND', 'OR', 'XOR', 'NAND', 'NOR'];
          const op = operations[getRandomInt(0, operations.length-1)];
          const truthTable = {
            'AND': '1', 'OR': '1', 'XOR': '0', 'NAND': '0', 'NOR': '0'
          };
          return {
            text: `What is the result of 1 ${op} 1?`,
            options: [
              { text: truthTable[op], displayText: `Option A: ${truthTable[op]}`, isCorrect: true },
              { text: op === 'AND' ? '0' : '1', displayText: `Option B: ${op === 'AND' ? '0' : '1'}`, isCorrect: false },
              { text: 'X', displayText: 'Option C: X', isCorrect: false },
              { text: 'Z', displayText: 'Option D: Z', isCorrect: false }
            ]
          };
        }
      }
    ],
    'Logic Gates': [
      {
        generate: () => {
          const gates = ['NAND', 'NOR', 'XOR'];
          const gate = gates[getRandomInt(0, gates.length-1)];
          const transistorCounts = {
            'NAND': 4, 'NOR': 4, 'XOR': 8
          };
          return {
            text: `How many transistors are typically used in a ${gate} gate?`,
            options: [
              { text: `${transistorCounts[gate]} transistors`, displayText: `Option A: ${transistorCounts[gate]} transistors`, isCorrect: true },
              { text: `${transistorCounts[gate] + 2} transistors`, displayText: `Option B: ${transistorCounts[gate] + 2} transistors`, isCorrect: false },
              { text: `${transistorCounts[gate] - 2} transistors`, displayText: `Option C: ${transistorCounts[gate] - 2} transistors`, isCorrect: false },
              { text: `${transistorCounts[gate] * 2} transistors`, displayText: `Option D: ${transistorCounts[gate] * 2} transistors`, isCorrect: false }
            ]
          };
        }
      }
    ]
  },
  'Computer Organization': {
    'CPU Architecture': [
      {
        generate: () => {
          const freq = getRandomInt(24, 36) / 10; // 2.4 to 3.6 GHz
          const period = (1000/freq).toFixed(2);
          return {
            text: `A CPU runs at ${freq} GHz. What is its clock period in nanoseconds?`,
            options: [
              { text: `${period} ns`, displayText: `Option A: ${period} ns`, isCorrect: true },
              { text: `${(1000/(freq+0.4)).toFixed(2)} ns`, displayText: `Option B: ${(1000/(freq+0.4)).toFixed(2)} ns`, isCorrect: false },
              { text: `${(1000/(freq-0.4)).toFixed(2)} ns`, displayText: `Option C: ${(1000/(freq-0.4)).toFixed(2)} ns`, isCorrect: false },
              { text: `${(1000/(freq*2)).toFixed(2)} ns`, displayText: `Option D: ${(1000/(freq*2)).toFixed(2)} ns`, isCorrect: false }
            ]
          };
        }
      }
    ],
    'Memory Systems': [
      {
        generate: () => {
          const size = getRandomInt(2, 8) * 32; // 64 to 256 KB
          const ways = getRandomInt(2, 8);
          const blockSize = 64; // bytes
          const sets = (size * 1024) / (blockSize * ways);
          return {
            text: `A ${size}KB cache is ${ways}-way set associative with ${blockSize}B blocks. How many sets are there?`,
            options: [
              { text: `${sets} sets`, displayText: `Option A: ${sets} sets`, isCorrect: true },
              { text: `${sets * 2} sets`, displayText: `Option B: ${sets * 2} sets`, isCorrect: false },
              { text: `${sets / 2} sets`, displayText: `Option C: ${sets / 2} sets`, isCorrect: false },
              { text: `${sets * 4} sets`, displayText: `Option D: ${sets * 4} sets`, isCorrect: false }
            ]
          };
        }
      }
    ]
  },
  'Programming': {
    'Time Complexity': [
      {
        generate: () => {
          const sizes = [100, 1000, 10000];
          const n = sizes[getRandomInt(0, sizes.length-1)];
          return {
            text: `What is the time complexity of binary search on a sorted array of size ${n}?`,
            options: [
              { text: 'O(log n)', displayText: 'Option A: O(log n)', isCorrect: true },
              { text: 'O(n)', displayText: 'Option B: O(n)', isCorrect: false },
              { text: 'O(n log n)', displayText: 'Option C: O(n log n)', isCorrect: false },
              { text: 'O(n²)', displayText: 'Option D: O(n²)', isCorrect: false }
            ]
          };
        }
      }
    ],
    'Data Structures': [
      {
        generate: () => {
          const operations = ['insertion', 'deletion', 'search'];
          const op = operations[getRandomInt(0, operations.length-1)];
          return {
            text: `What is the time complexity of ${op} in a balanced Binary Search Tree?`,
            options: [
              { text: 'O(log n)', displayText: 'Option A: O(log n)', isCorrect: true },
              { text: 'O(1)', displayText: 'Option B: O(1)', isCorrect: false },
              { text: 'O(n)', displayText: 'Option C: O(n)', isCorrect: false },
              { text: 'O(n log n)', displayText: 'Option D: O(n log n)', isCorrect: false }
            ]
          };
        }
      }
    ]
  },
  'Theory of Computation': {
    'Automata Theory': [
      {
        generate: () => {
          const states = getRandomInt(3, 6);
          return {
            text: `How many states are needed in a minimal DFA that accepts strings of exactly ${states} zeros?`,
            options: [
              { text: `${states + 1} states`, displayText: `Option A: ${states + 1} states`, isCorrect: true },
              { text: `${states} states`, displayText: `Option B: ${states} states`, isCorrect: false },
              { text: `${states + 2} states`, displayText: `Option C: ${states + 2} states`, isCorrect: false },
              { text: `${states * 2} states`, displayText: `Option D: ${states * 2} states`, isCorrect: false }
            ]
          };
        }
      }
    ]
  }
};

// Subject definitions
// Test function to generate sample questions
export const generateSampleQuestions = () => {
  const questions = [];
  let questionId = 1;

  // Generate sample questions for each subject and topic
  Object.entries(questionGenerators).forEach(([subject, topics]) => {
    Object.entries(topics).forEach(([topic, templates]) => {
      // Generate 2 questions per template
      templates.forEach((template, templateIndex) => {
        for (let i = 0; i < 2; i++) {
          const { text, options } = template.generate();
          
          const question = {
            id: `Q${questionId.toString().padStart(4, '0')}`,
            subject,
            topic,
            title: `${topic} - Question ${questionId}`,
            text,
            difficulty: ['Easy', 'Medium', 'Hard'][getRandomInt(0, 2)],
            options: shuffleArray(options),
            createdAt: new Date().toISOString()
          };

          questions.push(question);
          questionId++;
        }
      });
    });
  });

  return questions;
};
