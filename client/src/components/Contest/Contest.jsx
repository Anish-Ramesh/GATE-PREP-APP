import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { FaTrophy, FaBullseye, FaUsers, FaClock } from 'react-icons/fa';
import './Contest.css';
import TestResultsModal from './TestResultsModal';

const isTestAttempted = (test, userId) => {
    return test.submissions?.some(submission => submission.userId === userId) ?? false;
};

const Contest = () => {
    const [tests, setTests] = useState([]);
    const [testPerformance, setTestPerformance] = useState({});
    const [selectedTest, setSelectedTest] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();
    const currentUser = auth.currentUser;

    useEffect(() => {
        // Listen for tests
        const testsRef = collection(db, 'Tests');
        const q = query(testsRef, orderBy('startTime', 'desc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const testsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                startTime: doc.data().startTime?.toDate(),
                endTime: doc.data().endTime?.toDate()
            }));
            setTests(testsList);

            // Calculate performance for each test
            const performanceData = {};
            for (const test of testsList) {
                const performance = await calculateTestPerformance(test);
                performanceData[test.id] = performance;
            }
            setTestPerformance(performanceData);
        });

        return () => unsubscribe();
    }, []);

    const getTestStatus = (startTime, endTime) => {
        const now = new Date();
        if (now < startTime) return 'upcoming';
        if (now >= startTime && now <= endTime) return 'active';
        return 'completed';
    };

    const handleTestClick = (test) => {
        const status = getTestStatus(test.startTime, test.endTime);
        const attempted = isTestAttempted(test, currentUser?.uid);


        if (status === 'active' && !attempted) {
            navigate(`/test/${test.id}`);
        } else if (attempted || status === 'completed') {
            setSelectedTest(test);
            setShowResults(true);
        }
    };

    const handleCloseResults = () => {
        setShowResults(false);
        setSelectedTest(null);
    };

    const formatDate = (date) => {
        return date?.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeRemaining = (startTime) => {
        const now = new Date();
        const diff = startTime - now;

        if (diff <= 0) return '';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `Starts in: ${days}d ${hours}h ${minutes}m`;
    };

    const calculateTestPerformance = async (test) => {
        if (!test.submissions || !test.submissions.length) return null;


        try {
            let totalParticipants = test.submissions.length;
            let totalScore = 0;
            let userScore = null;
            let userAccuracy = null;

            const correctAnswers = {
                mcq1: '4',        // Correct answer for mcq1
                mcq2: '1',        // Correct answer for mcq2
                nat1: 'Paris',    // Correct answer for nat1
                nat2: 'Chennai'   // Correct answer for nat2
            };

            // Calculate scores based on submissions
            test.submissions.forEach(submission => {

                if (submission.answers && typeof submission.answers === 'object' && Object.keys(submission.answers).length > 0) {
                    let score = 0;
                    Object.keys(correctAnswers).forEach(key => {
                        if (submission.answers[key] === correctAnswers[key]) {
                            score += 1; // Increment score for each correct answer
                        }
                    });
                    totalScore += score;

                    if (submission.userId === currentUser?.uid) {
                        userScore = score;
                        userAccuracy = (score / Object.keys(correctAnswers).length) * 100;
                    }
                }
            });


            if (totalParticipants === 0 || !test.submissions[0] || !test.submissions[0].answers || Object.keys(test.submissions[0].answers).length === 0) {
                return {
                    averageScore: 0,
                    averageAccuracy: 0,
                    totalParticipants,
                    userScore,
                    userAccuracy
                };
            }

            const averageScore = totalScore / totalParticipants;
            const averageAccuracy = (totalScore / (totalParticipants * Object.keys(correctAnswers).length)) * 100;


            return {
                averageScore,
                averageAccuracy,
                totalParticipants,
                userScore,
                userAccuracy
            };
        } catch (error) {
            console.error('Error calculating test performance:', error);
            return null;
        }
    };

    return (
        <div className="contest-container">
            {showResults && selectedTest && (
                <TestResultsModal
                    test={selectedTest}
                    performance={testPerformance[selectedTest.id]}
                />
            )}
            <div className="contest-header">
                <h1 className="contest-title">Contests</h1>
            </div>

            <div className="tests-grid">
                {tests.map((test) => {
                    const status = getTestStatus(test.startTime, test.endTime);
                    const performance = testPerformance[test.id];

                    return (
                        <div
                            key={test.id}
                            className={`test-card ${status}`}
                            onClick={() => handleTestClick(test)}
                        >
                            <h2 className="test-title">{test.title}</h2>
                            <div className="test-details">
                                <div className="test-time-info">
                                    <FaClock className="icon" />
                                    <div>
                                        <p><strong>Start:</strong> {formatDate(test.startTime)}</p>
                                        <p><strong>End:</strong> {formatDate(test.endTime)}</p>
                                        <p><strong>Duration:</strong> {
                                            Math.floor((test.endTime - test.startTime) / (1000 * 60))
                                        } minutes</p>
                                    </div>
                                </div>

                                {status === 'completed' && performance && (
                                    <div className="test-performance">
                                        <div className="performance-stat">
                                            <FaUsers className="icon" />
                                            <span>{performance.totalParticipants} Participants</span>
                                        </div>

                                        <div className="performance-stat">
                                            <FaTrophy className="icon" />
                                            <span>Avg Score: {performance.averageScore.toFixed(1)}</span>
                                        </div>

                                        <div className="performance-stat">
                                            <FaBullseye className="icon" />
                                            <span>Avg Accuracy: {performance.averageAccuracy.toFixed(1)}%</span>
                                        </div>

                                        {performance.userScore !== null && (
                                            <div className="user-performance">
                                                <h3>Your Performance</h3>
                                                <p>Score: {performance.userScore}</p>
                                                <p>Accuracy: {performance.userAccuracy.toFixed(1)}%</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {status === 'upcoming' && (
                                    <p className="time-remaining">{getTimeRemaining(test.startTime)}</p>
                                )}
                                <div className={`status-badge ${status} ${isTestAttempted(test, currentUser?.uid) ? 'attempted' : ''}`}>
                                    {isTestAttempted(test, currentUser?.uid) ? 'Attempted' : status.charAt(0).toUpperCase() + status.slice(1)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Contest;
