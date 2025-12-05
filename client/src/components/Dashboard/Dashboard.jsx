import React, { useState, useEffect } from 'react';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import './Dashboard.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  useEffect(() => {
    fetchQuizResults();
  }, [selectedTimeRange]);

  const fetchQuizResults = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'quizResults'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      // Sort by timestamp
      results.sort((a, b) => b.timestamp - a.timestamp);

      // Filter by time range if needed
      const filteredResults = filterByTimeRange(results, selectedTimeRange);
      setQuizResults(filteredResults);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const filterByTimeRange = (results, range) => {
    const now = new Date();
    switch (range) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return results.filter(result => result.timestamp >= weekAgo);
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return results.filter(result => result.timestamp >= monthAgo);
      default:
        return results;
    }
  };

  const calculateStats = () => {
    if (!quizResults.length) return { average: 0, highest: 0, total: 0 };

    const scores = quizResults.map(result => result.percentage);
    return {
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      highest: Math.max(...scores),
      total: quizResults.length
    };
  };

  const getSubjectPerformance = () => {
    const subjectScores = {};
    quizResults.forEach(result => {
      if (!subjectScores[result.subject]) {
        subjectScores[result.subject] = {
          scores: [],
          attempts: 0
        };
      }
      subjectScores[result.subject].scores.push(result.percentage);
      subjectScores[result.subject].attempts++;
    });

    return Object.entries(subjectScores).map(([subject, data]) => ({
      subject,
      average: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      attempts: data.attempts
    }));
  };

  const getTopicPerformance = () => {
    const topicScores = {};
    quizResults.forEach(result => {
      result.answers.forEach(answer => {
        if (!topicScores[answer.topic]) {
          topicScores[answer.topic] = { correct: 0, total: 0 };
        }
        topicScores[answer.topic].total++;
        if (answer.isCorrect) {
          topicScores[answer.topic].correct++;
        }
      });
    });

    return Object.entries(topicScores).map(([topic, data]) => ({
      topic,
      percentage: (data.correct / data.total) * 100
    }));
  };

  const getDifficultyPerformance = () => {
    const difficultyScores = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    };

    quizResults.forEach(result => {
      result.answers.forEach(answer => {
        const difficulty = answer.difficulty.toLowerCase();
        difficultyScores[difficulty].total++;
        if (answer.isCorrect) {
          difficultyScores[difficulty].correct++;
        }
      });
    });

    return Object.entries(difficultyScores).map(([difficulty, data]) => ({
      difficulty,
      percentage: data.total ? (data.correct / data.total) * 100 : 0
    }));
  };

  const stats = calculateStats();
  const subjectPerformance = getSubjectPerformance();
  const topicPerformance = getTopicPerformance();
  const difficultyPerformance = getDifficultyPerformance();

  const progressChartData = {
    labels: quizResults.map(result => 
      new Date(result.timestamp).toLocaleDateString()
    ).reverse(),
    datasets: [{
      label: 'Quiz Scores',
      data: quizResults.map(result => result.percentage).reverse(),
      fill: true,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4
    }]
  };

  const subjectChartData = {
    labels: subjectPerformance.map(item => item.subject),
    datasets: [{
      label: 'Average Score',
      data: subjectPerformance.map(item => item.average),
      backgroundColor: 'rgba(54, 162, 235, 0.8)'
    }]
  };

  const topicRadarData = {
    labels: topicPerformance.map(item => item.topic),
    datasets: [{
      label: 'Topic Performance',
      data: topicPerformance.map(item => item.percentage),
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgb(255, 99, 132)',
      pointBackgroundColor: 'rgb(255, 99, 132)',
      pointBorderColor: '#fff',
    }]
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your performance data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Performance Dashboard</h1>
        <div className="time-range-selector">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="all">All Time</option>
            <option value="month">Last 30 Days</option>
            <option value="week">Last 7 Days</option>
          </select>
        </div>
      </div>

      <div className="stats-section">
        <h2>Problem Solving Stats</h2>
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Quizzes Taken</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{quizResults.reduce((acc, result) => acc + result.answers.length, 0)}</span>
            <span className="stat-label">Questions Answered</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.average.toFixed(1)}%</span>
            <span className="stat-label">Average Score</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.highest}%</span>
            <span className="stat-label">Highest Score</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card progress-chart">
          <h2>Progress Over Time</h2>
          <div className="chart-container">
            <Line
              data={progressChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="chart-card subject-performance">
          <h2>Subject Performance</h2>
          <div className="chart-container">
            <Bar
              data={subjectChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="chart-card topic-performance">
          <h2>Topic Mastery</h2>
          <div className="chart-container radar-container">
            <Radar
              data={topicRadarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      font: {
                        size: 14
                      }
                    }
                  }
                },
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      stepSize: 20,
                      font: {
                        size: 12
                      }
                    },
                    pointLabels: {
                      font: {
                        size: 14
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="chart-card difficulty-breakdown">
          <h2>Performance by Difficulty</h2>
          <div className="difficulty-stats">
            {difficultyPerformance.map(({ difficulty, percentage }) => (
              <div key={difficulty} className={`difficulty-stat ${difficulty}`}>
                <div className="difficulty-label">
                  <span className="difficulty-icon">
                    {difficulty === 'easy' ? '🟢' : difficulty === 'medium' ? '🟡' : '🔴'}
                  </span>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </div>
                <div className="difficulty-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${percentage}%` }}
                  >
                    <span className="progress-value">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="performance-insights">
        <h2>Performance Insights</h2>
        <div className="insights-grid">
          {subjectPerformance.map(subject => (
            <div key={subject.subject} className="insight-card">
              <h3>{subject.subject}</h3>
              <div className="insight-stats">
                <div className="insight-stat">
                  <span className="stat-label">Average Score</span>
                  <span className="stat-value">{subject.average.toFixed(1)}%</span>
                </div>
                <div className="insight-stat">
                  <span className="stat-label">Attempts</span>
                  <span className="stat-value">{subject.attempts}</span>
                </div>
              </div>
              <div className="performance-indicator">
                <div 
                  className="indicator-bar"
                  style={{ 
                    width: `${subject.average}%`,
                    backgroundColor: subject.average >= 80 ? '#4caf50' : 
                                   subject.average >= 60 ? '#ff9800' : '#f44336'
                  }}
                  data-value={`${subject.average.toFixed(1)}%`}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="recent-quizzes">
        {quizResults.map(result => (
          <div key={result.id} className="recent-quiz">
            <div className="quiz-result-header">
              <h4>{result.subject}</h4>
              <div className="quiz-score">Score: {result.score}%</div>
            </div>
            <div className="quiz-meta">
              <span className="time-info">Duration: {Math.floor(result.timeSpent / 60)} min {result.timeSpent % 60} sec</span>
              <span className="time-info">Date: {new Date(result.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
