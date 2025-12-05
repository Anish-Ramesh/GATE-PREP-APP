// Import question generators
import { questionGenerators } from './questionGenerators.js';

// Test function to generate and display sample questions
function testQuestionGenerators() {
  console.log('Testing question generators for all subjects...\n');

  // Test each subject
  Object.entries(questionGenerators).forEach(([subject, topics]) => {
    console.log(`=== ${subject} Questions ===`);

    // Test each topic in the subject
    Object.entries(topics).forEach(([topic, generators]) => {
      console.log(`\n--- ${topic} ---`);

      // Generate 2 sample questions for each topic
      generators.forEach((generator, idx) => {
        for (let i = 0; i < 2; i++) {
          const question = generator.generate();
          console.log(`\nQuestion ${i + 1}: ${question.text}`);
          console.log('Options:');
          question.options.forEach(opt => {
            console.log(opt.displayText);
            // Verify correct answer is marked
            if (opt.isCorrect) {
              console.log(`(Correct Answer: ${opt.text})`);
            }
          });
        }
      });
    });
    console.log('\n');
  });
}

testQuestionGenerators();
