// Helper functions
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = array => [...array].sort(() => Math.random() - 0.5);

// Question generators for each subject and topic
export const questionGenerators = {
  'Mathematics': {
    'Calculus': [
      {
        generate: () => {
          const coefficient = getRandomInt(2, 8);
          const power = 2;
          const correctDerivative = coefficient * power;
          
          return {
            text: `Find the derivative of f(x) = ${coefficient}x^${power}`,
            options: shuffleArray([
              { text: `${correctDerivative}x^1`, displayText: `Option A: ${correctDerivative}x^1`, isCorrect: true },
              { text: `${coefficient}x^${power + 1}`, displayText: `Option B: ${coefficient}x^${power + 1}`, isCorrect: false },
              { text: `${correctDerivative}x^${power}`, displayText: `Option C: ${correctDerivative}x^${power}`, isCorrect: false },
              { text: `${coefficient}x^1`, displayText: `Option D: ${coefficient}x^1`, isCorrect: false }
            ])
          };
        }
      },
      {
        generate: () => {
          const coefficient = getRandomInt(1, 5);
          const correctIntegral = coefficient / 2;
          
          return {
            text: `Find the integral of f(x) = ${coefficient}x`,
            options: shuffleArray([
              { text: `${correctIntegral}x^2 + C`, displayText: `Option A: ${correctIntegral}x^2 + C`, isCorrect: true },
              { text: `${coefficient}x^2 + C`, displayText: `Option B: ${coefficient}x^2 + C`, isCorrect: false },
              { text: `${coefficient}x + C`, displayText: `Option C: ${coefficient}x + C`, isCorrect: false },
              { text: `${correctIntegral}x + C`, displayText: `Option D: ${correctIntegral}x + C`, isCorrect: false }
            ])
          };
        }
      }
    ],
    'Linear Algebra': [
      {
        generate: () => {
          const matrixSize = getRandomInt(2, 4);
          return {
            text: `What is the rank of a ${matrixSize}×${matrixSize} identity matrix?`,
            options: shuffleArray([
              { text: `${matrixSize}`, displayText: `Option A: ${matrixSize}`, isCorrect: true },
              { text: `${matrixSize - 1}`, displayText: `Option B: ${matrixSize - 1}`, isCorrect: false },
              { text: `${matrixSize + 1}`, displayText: `Option C: ${matrixSize + 1}`, isCorrect: false },
              { text: '0', displayText: 'Option D: 0', isCorrect: false }
            ])
          };
        }
      }
    ],
    'Probability': [
      {
        generate: () => {
          const totalTrials = getRandomInt(20, 50);
          const successfulTrials = getRandomInt(10, totalTrials - 5);
          const probability = (successfulTrials / totalTrials).toFixed(2);
          
          return {
            text: `In a sample of ${totalTrials} trials, if ${successfulTrials} are successful, what is the probability of success?`,
            options: shuffleArray([
              { text: probability, displayText: `Option A: ${probability}`, isCorrect: true },
              { text: (parseFloat(probability) + 0.05).toFixed(2), displayText: `Option B: ${(parseFloat(probability) + 0.05).toFixed(2)}`, isCorrect: false },
              { text: (parseFloat(probability) + 0.09).toFixed(2), displayText: `Option C: ${(parseFloat(probability) + 0.09).toFixed(2)}`, isCorrect: false },
              { text: (parseFloat(probability) - 0.05).toFixed(2), displayText: `Option D: ${(parseFloat(probability) - 0.05).toFixed(2)}`, isCorrect: false }
            ])
          };
        }
      }
    ]
  },
  'Digital Logic': {
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
    ],
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
    ]
  },

  'Computer Organization': {
    'CPU Architecture': [
      {
        generate: () => {
          const frequency = getRandomInt(20, 40) / 10;
          const correctPeriod = (1000 / frequency).toFixed(2);
          
          return {
            text: `A CPU runs at ${frequency} GHz. What is its clock period in nanoseconds?`,
            options: shuffleArray([
              { text: correctPeriod, displayText: `Option A: ${correctPeriod} ns`, isCorrect: true },
              { text: (correctPeriod * 0.9).toFixed(2), displayText: `Option B: ${(correctPeriod * 0.9).toFixed(2)} ns`, isCorrect: false },
              { text: (correctPeriod * 1.1).toFixed(2), displayText: `Option C: ${(correctPeriod * 1.1).toFixed(2)} ns`, isCorrect: false },
              { text: (correctPeriod * 0.5).toFixed(2), displayText: `Option D: ${(correctPeriod * 0.5).toFixed(2)} ns`, isCorrect: false }
            ])
          };
        }
      }
    ],
    'Memory Systems': [
      {
        generate: () => {
          const cacheSize = getRandomInt(32, 128);
          const associativity = getRandomInt(2, 8);
          const blockSize = 64;
          const correctSets = (cacheSize * 1024) / (associativity * blockSize);
          
          return {
            text: `A ${cacheSize}KB cache is ${associativity}-way set associative with ${blockSize}B blocks. How many sets are there?`,
            options: shuffleArray([
              { text: correctSets, displayText: `Option A: ${correctSets} sets`, isCorrect: true },
              { text: correctSets * 2, displayText: `Option B: ${correctSets * 2} sets`, isCorrect: false },
              { text: correctSets / 2, displayText: `Option C: ${correctSets / 2} sets`, isCorrect: false },
              { text: correctSets * 4, displayText: `Option D: ${correctSets * 4} sets`, isCorrect: false }
            ])
          };
        }
      }
    ]
  },

  'Programming': {
    'Time Complexity': [
      {
        generate: () => {
          const algorithms = [
            { name: 'Binary Search', complexity: 'O(log n)' },
            { name: 'Quick Sort', complexity: 'O(n log n)' },
            { name: 'Bubble Sort', complexity: 'O(n²)' },
            { name: 'Linear Search', complexity: 'O(n)' }
          ];
          const algo = algorithms[getRandomInt(0, algorithms.length - 1)];
          
          return {
            text: `What is the time complexity of ${algo.name} in the average case?`,
            options: shuffleArray([
              { text: 'O(log n)', displayText: 'Option A: O(log n)', isCorrect: algo.complexity === 'O(log n)' },
              { text: 'O(n)', displayText: 'Option B: O(n)', isCorrect: algo.complexity === 'O(n)' },
              { text: 'O(n log n)', displayText: 'Option C: O(n log n)', isCorrect: algo.complexity === 'O(n log n)' },
              { text: 'O(n²)', displayText: 'Option D: O(n²)', isCorrect: algo.complexity === 'O(n²)' }
            ])
          };
        }
      }
    ],
    'Data Structures': [
      {
        generate: () => {
          const operations = [
            { name: 'insertion', structure: 'Binary Search Tree', complexity: 'O(log n)' },
            { name: 'deletion', structure: 'Binary Search Tree', complexity: 'O(log n)' },
            { name: 'search', structure: 'Hash Table', complexity: 'O(1)' },
            { name: 'worst-case insertion', structure: 'Hash Table', complexity: 'O(n)' }
          ];
          const op = operations[getRandomInt(0, operations.length - 1)];
          
          return {
            text: `What is the time complexity of ${op.name} in a balanced ${op.structure}?`,
            options: shuffleArray([
              { text: 'O(1)', displayText: 'Option A: O(1)', isCorrect: op.complexity === 'O(1)' },
              { text: 'O(log n)', displayText: 'Option B: O(log n)', isCorrect: op.complexity === 'O(log n)' },
              { text: 'O(n)', displayText: 'Option C: O(n)', isCorrect: op.complexity === 'O(n)' },
              { text: 'O(n log n)', displayText: 'Option D: O(n log n)', isCorrect: false }
            ])
          };
        }
      }
    ]
  },

  'Theory of Computation': {
    'Automata Theory': [
      {
        generate: () => {
          const n = getRandomInt(3, 8);
          const correctStates = n + 1;
          
          return {
            text: `How many states are needed in a minimal DFA that accepts strings of exactly ${n} zeros?`,
            options: shuffleArray([
              { text: correctStates.toString(), displayText: `Option A: ${correctStates} states`, isCorrect: true },
              { text: n.toString(), displayText: `Option B: ${n} states`, isCorrect: false },
              { text: (n + 2).toString(), displayText: `Option C: ${n + 2} states`, isCorrect: false },
              { text: (n * 2).toString(), displayText: `Option D: ${n * 2} states`, isCorrect: false }
            ])
          };
        }
      }
    ],
    'Regular Languages': [
      {
        generate: () => {
          const languages = [
            { description: 'all strings that start and end with the same symbol', isRegular: true },
            { description: 'all strings with equal number of 0s and 1s', isRegular: false },
            { description: 'all strings that contain at least one 1', isRegular: true },
            { description: 'strings of form aⁿ bⁿ', isRegular: false }
          ];
          const lang = languages[getRandomInt(0, languages.length - 1)];
          
          return {
            text: `Is the language "${lang.description}" regular?`,
            options: [
              { text: 'Yes', displayText: 'Option A: Yes', isCorrect: lang.isRegular },
              { text: 'No', displayText: 'Option B: No', isCorrect: !lang.isRegular },
              { text: 'Cannot determine', displayText: 'Option C: Cannot determine', isCorrect: false },
              { text: 'Depends on alphabet', displayText: 'Option D: Depends on alphabet', isCorrect: false }
            ]
          };
        }
      }
    ]
  }
};
