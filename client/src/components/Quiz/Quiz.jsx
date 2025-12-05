import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import './Quiz.css';

const MAX_QUESTIONS = 100;
const MAX_DURATION = 90; // 1.5 hours in minutes
const DEFAULT_QUESTIONS = 25;
const DEFAULT_DURATION = 30;

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTIONS);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [subjects] = useState([
    'Computer Networks',
    'Operating Systems',
    'Database Management',
    'Data Structures',
    'Algorithms'
  ]);

  useEffect(() => {
    console.log('Quiz component mounted');
    if (timeLeft > 0 && quizStarted && !quizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quizStarted && !quizCompleted) {
      handleQuizSubmit();
    }
  }, [timeLeft, quizStarted, quizCompleted]);

  const fetchQuestions = async (subject) => {
    try {
      console.log('Fetching questions for subject:', subject);
      setError(null);
      const q = query(
        collection(db, 'questions'),
        where('subject', '==', subject)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Found', querySnapshot.size, 'questions');
      
      const fetchedQuestions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (fetchedQuestions.length === 0) {
        setError('No questions found for this subject. Please initialize the question bank first.');
        setLoading(false);
        return false;
      }

      if (fetchedQuestions.length < questionCount) {
        setError(`Not enough questions available. Found ${fetchedQuestions.length} questions, need ${questionCount}.`);
        setLoading(false);
        return false;
      }

      // Randomly select questionCount questions
      const shuffled = fetchedQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, questionCount);
      
      setQuestions(selectedQuestions);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Error fetching questions. Please try again.');
      setLoading(false);
      return false;
    }
  };

  const startQuiz = async () => {
    if (!selectedSubject) {
      setError('Please select a subject');
      return;
    }
    if (!questionCount || questionCount < 1 || questionCount > MAX_QUESTIONS) {
      setError(`Please select between 1 and ${MAX_QUESTIONS} questions`);
      return;
    }
    if (!duration || duration < 1 || duration > MAX_DURATION) {
      setError(`Please select between 1 and ${MAX_DURATION} minutes`);
      return;
    }
    setLoading(true);
    const success = await fetchQuestions(selectedSubject);
    if (success) {
      setQuizStarted(true);
      setTimeLeft(duration * 60); // Convert minutes to seconds
      setScore(0);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setQuizCompleted(false);
      setSelectedAnswer('');
    }
  };

  const handleAnswerSelect = (answer) => {
    console.log('Selected answer:', answer);
    setSelectedAnswer(answer);
    setAnswers({
      ...answers,
      [currentQuestionIndex]: answer
    });
  };

  const handleNextQuestion = () => {
    console.log('Next question clicked');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(answers[currentQuestionIndex + 1] || '');
    }
  };

  const handlePreviousQuestion = () => {
    console.log('Previous question clicked');
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] || '');
    }
  };

  const saveQuizResult = async (finalScore, totalQuestions) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const timeSpent = duration * 60 - timeLeft;
      const quizResult = {
        userId: user.uid,
        subject: selectedSubject,
        score: finalScore,
        totalQuestions,
        percentage: (finalScore / totalQuestions) * 100,
        timestamp: serverTimestamp(),
        timeSpent,
        timePerQuestion: timeSpent / totalQuestions,
        answers: Object.entries(answers).map(([index, answer]) => ({
          questionId: questions[index].id,
          userAnswer: answer,
          correctAnswer: questions[index].correctAnswer,
          isCorrect: answer === questions[index].correctAnswer,
          topic: questions[index].topic,
          difficulty: questions[index].difficulty
        }))
      };

      await addDoc(collection(db, 'quizResults'), quizResult);
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  };

  const handleQuizSubmit = async () => {
    console.log('Quiz submit clicked');
    let finalScore = 0;
    Object.entries(answers).forEach(([index, answer]) => {
      if (answer === questions[index].correctAnswer) {
        finalScore++;
      }
    });
    
    setScore(finalScore);
    setQuizCompleted(true);
    await saveQuizResult(finalScore, questions.length);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="quiz-loading">Loading quiz...</div>;
  }

  if (!quizStarted) {
    return (
      <div className="quiz-start-container">
        <h1>GATE Practice Quiz</h1>
        {error && <div className="error-message">{error}</div>}
        
        <div className="quiz-settings">
          <div className="setting-group">
            <h2>Select Subject</h2>
            <select 
              value={selectedSubject} 
              onChange={(e) => {
                const value = e.target.value;
                console.log('Selected subject:', value);
                setSelectedSubject(value);
                setError(null);
              }}
              className="quiz-select"
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <h2>Number of Questions</h2>
            <div className="number-input-container">
              <input
                type="number"
                min="1"
                max={MAX_QUESTIONS}
                value={questionCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setQuestionCount(value);
                  setError(null);
                }}
                className="number-input"
              />
              <span className="input-label">questions (max {MAX_QUESTIONS})</span>
            </div>
          </div>

          <div className="setting-group">
            <h2>Quiz Duration</h2>
            <div className="number-input-container">
              <input
                type="number"
                min="1"
                max={MAX_DURATION}
                value={duration}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setDuration(value);
                  setError(null);
                }}
                className="number-input"
              />
              <span className="input-label">minutes (max {MAX_DURATION})</span>
            </div>
          </div>

          <button 
            onClick={startQuiz}
            className="start-quiz-btn"
            disabled={loading}
          >
            {loading ? 'Loading Questions...' : 'Start Quiz'}
          </button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const timeSpent = duration * 60 - timeLeft;
    return (
      <div className="quiz-completed">
        <h2>Quiz Completed!</h2>
        <div className="score-card">
          <p>Your Score: {score} out of {questions.length}</p>
          <p>Percentage: {((score / questions.length) * 100).toFixed(2)}%</p>
          <p>Time Spent: {Math.floor(timeSpent / 60)} minutes {timeSpent % 60} seconds</p>
          <p>Average Time per Question: {(timeSpent / questions.length).toFixed(1)} seconds</p>
        </div>
        <div className="review-section">
          <h3>Review Your Answers</h3>
          {questions.map((question, index) => (
            <div key={index} className={`review-question ${
              answers[index] === question.correctAnswer ? 'correct' : 'incorrect'
            }`}>
              <p><strong>Q{index + 1}:</strong> {question.text}</p>
              <p>Your Answer: {answers[index] || 'Not answered'}</p>
              <p>Correct Answer: {question.correctAnswer}</p>
              <p>Topic: {question.topic}</p>
              <p>Difficulty: {question.difficulty}</p>
            </div>
          ))}
        </div>
        <button className="start-quiz-btn" onClick={() => {
          setQuizStarted(false);
          setSelectedSubject('');
          setLoading(false);
        }}>
          Take Another Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h2>{selectedSubject}</h2>
        <div className="quiz-info">
          <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
          <p className="timer">Time Left: {formatTime(timeLeft)}</p>
        </div>
      </div>

      <div className="question-card">
        <p className="question-text">{questions[currentQuestionIndex].text}</p>
        <div className="options-container">
          {questions[currentQuestionIndex].options.map((option, index) => (
            <button
              key={index}
              className={`option-btn ${selectedAnswer === option ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="navigation-buttons">
        <button
          className="nav-btn"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>
        {currentQuestionIndex === questions.length - 1 ? (
          <button
            className="submit-btn"
            onClick={handleQuizSubmit}
          >
            Submit Quiz
          </button>
        ) : (
          <button
            className="nav-btn"
            onClick={handleNextQuestion}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
