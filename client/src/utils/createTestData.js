import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export const createTestData = async () => {
    try {
        // Sample MCQ and NAT questions
        const mcqQuestions = [
            {
                questionText: "What is 2 + 2?",
                options: ["1", "2", "3", "4"],
                correctAnswer: "4",
                type: "mcq"
            },
            {
                questionText: "Which planet is known as the Red Planet?",
                options: ["Venus", "Mars", "Jupiter", "Saturn"],
                correctAnswer: "Mars",
                type: "mcq"
            }
        ];

        const natQuestions = [
            {
                questionText: "What is the capital of France? (Type the answer)",
                correctAnswer: "Paris",
                type: "nat"
            },
            {
                questionText: "How many sides does a triangle have? (Type the number)",
                correctAnswer: "3",
                type: "nat"
            }
        ];

        // Add MCQ questions
        const mcqRefs = await Promise.all(
            mcqQuestions.map(question => 
                addDoc(collection(db, 'MCQ_Questions'), question)
            )
        );

        // Add NAT questions
        const natRefs = await Promise.all(
            natQuestions.map(question => 
                addDoc(collection(db, 'NAT_Questions'), question)
            )
        );

        // Create test with current time
        const now = Timestamp.now();
        const thirtyMinutesLater = Timestamp.fromMillis(now.toMillis() + 30 * 60 * 1000);

        // Create the test
        const testRef = await addDoc(collection(db, 'Tests'), {
            title: "Sample Test",
            startTime: now,
            endTime: thirtyMinutesLater,
            mcqQuestions: mcqRefs.map(ref => ref.id),
            natQuestions: natRefs.map(ref => ref.id),
            submissions: []
        });

        console.log('Test created successfully with ID:', testRef.id);
        return testRef.id;
    } catch (error) {
        console.error('Error creating test:', error);
        throw error;
    }
};
