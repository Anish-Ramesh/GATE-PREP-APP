import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion, Timestamp, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { FaClock } from 'react-icons/fa';
import './TestRoom.css';

const TestRoom = () => {
    const [activeTest, setActiveTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentAnswers, setCurrentAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [userRole, setUserRole] = useState(null); // To store if the user is a student or teacher
    const currentUser = auth.currentUser;
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) return;

        // Fetch user role from Firestore
        const checkUserRole = async () => {
            try {
                const teacherRef = doc(db, 'Teachers', currentUser.uid);
                const teacherSnap = await getDoc(teacherRef);
                
                if (teacherSnap.exists()) {
                    setUserRole('teacher'); // User is a teacher
                } else {
                    const studentRef = doc(db, 'Students', currentUser.uid);
                    const studentSnap = await getDoc(studentRef);

                    if (studentSnap.exists()) {
                        setUserRole('student'); // User is a student
                    } else {
                        setUserRole('unknown'); // Unknown role
                    }
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        };

        checkUserRole();
    }, [currentUser]);

    useEffect(() => {
        const testsRef = collection(db, 'Tests');
        const q = query(testsRef, orderBy('startTime', 'desc'), limit(1));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (!snapshot.empty) {
                const testData = snapshot.docs[0].data();
                const testId = snapshot.docs[0].id;
                
                const now = Timestamp.now().toMillis();
                const startTime = testData.startTime.toMillis();
                const endTime = testData.endTime.toMillis();

                const userSubmission = testData.submissions?.find(submission => submission.userId === currentUser?.uid);
                if (userSubmission) {
                    setHasSubmitted(true);
                } else if (now >= startTime && now <= endTime) {
                    setActiveTest({ id: testId, ...testData });
                    setTimeLeft(Math.floor((endTime - now) / 1000));
                    fetchQuestions(testData.mcqQuestions, testData.natQuestions);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);

            return () => clearInterval(timer);
        } else if (timeLeft === 0 && activeTest && userRole === 'student') {
            submitTest();
        }
    }, [timeLeft]);

    const fetchQuestions = async (mcqIds, natIds) => {
        try {
            const mcqQuestions = await Promise.all(
                mcqIds.map(async (id) => {
                    const docRef = doc(db, 'MCQ_Questions', id);
                    const docSnap = await getDoc(docRef);
                    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data(), type: 'mcq' } : null;
                })
            );

            const natQuestions = await Promise.all(
                natIds.map(async (id) => {
                    const docRef = doc(db, 'NAT_Questions', id);
                    const docSnap = await getDoc(docRef);
                    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data(), type: 'nat' } : null;
                })
            );

            setQuestions([...mcqQuestions, ...natQuestions].filter(q => q !== null));
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        if (userRole === 'student') {
            setCurrentAnswers(prev => ({
                ...prev,
                [questionId]: answer
            }));
        }
    };

    const submitTest = async () => {
        if (!activeTest || !currentUser || userRole !== 'student') return;

        try {
            const submissionRef = doc(db, 'Tests', activeTest.id);
            await updateDoc(submissionRef, {
                submissions: arrayUnion({
                    userId: currentUser.uid,
                    answers: currentAnswers,
                    submittedAt: Timestamp.now()
                })
            });

            setHasSubmitted(true);
            navigate('/dashboard');
        } catch (error) {
            console.error("Error submitting test:", error);
        }
    };

    if (hasSubmitted) {
        return (
            <div className="test-room-container">
                <div className="no-test-message">
                    You have already submitted this test.
                </div>
            </div>
        );
    }

    if (!activeTest) {
        return (
            <div className="test-room-container">
                <div className="no-test-message">
                    No active test at the moment.
                </div>
            </div>
        );
    }

    return (
        <div className="test-room-container">
            <div className="test-header">
                <h2 className="test-title">{activeTest.title}</h2>
                <div className="timer">
                    <FaClock />
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
            </div>

            <div className="questions-container">
                {questions.map((question) => (
                    <div key={question.id} className="question-card">
                        <div className={`question-type-badge ${question.type}`}>
                            {question.type === 'mcq' ? 'Multiple Choice' : 'Fill in the Blank'}
                        </div>
                        <p className="question-text">{question.questionText}</p>
                        
                        {question.type === 'mcq' ? (
                            <div className="options-grid">
                                {question.options.map((option, index) => (
                                    <label key={index} className="option-item">
                                        <input
                                            type="radio"
                                            name={question.id}
                                            value={option}
                                            checked={currentAnswers[question.id] === option}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            disabled={userRole === 'teacher'} // Disable inputs for teachers
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={currentAnswers[question.id] || ''}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                placeholder="Type your answer here..."
                                className="nat-input"
                                disabled={userRole === 'teacher'} // Disable input for teachers
                            />
                        )}
                    </div>
                ))}
            </div>

            {userRole === 'student' && (
                <button
                    onClick={submitTest}
                    className="submit-button"
                >
                    Submit Test
                </button>
            )}
        </div>
    );
};

export default TestRoom;
