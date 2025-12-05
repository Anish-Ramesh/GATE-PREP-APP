import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaBook, FaCheckCircle, FaClock, FaLightbulb, FaExclamationTriangle, FaTrophy, FaArrowRight } from 'react-icons/fa';
import useProgress from './hooks/useProgress';
import './Home.css';

const Home = ({ user }) => {
  const navigate = useNavigate();
  const {
    loading,
    calculateOverallProgress,
    calculateOverallAccuracy,
    getSubjectsProgress,
    getDifficultyStats,
    getRecentActivity,
    getPerformanceInsights
  } = useProgress();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading your progress...</p>
      </div>
    );
  }

  const subjectsProgress = getSubjectsProgress();
  const difficultyStats = getDifficultyStats();
  const recentActivity = getRecentActivity();
  const performanceInsights = getPerformanceInsights();

  return (
    <div className="home-container">
      <h1>Welcome back, {user?.email}</h1>

      {/* Overall Progress Section */}
      <section className="overall-progress">
        <h2><FaChartLine /> Overall Progress</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <FaCheckCircle />
              <h3>Completion Rate</h3>
            </div>
            <div className="stat-value">{calculateOverallProgress().toFixed(1)}%</div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${calculateOverallProgress()}%` }}
              ></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <FaBook />
              <h3>Average Accuracy</h3>
            </div>
            <div className="stat-value">{calculateOverallAccuracy().toFixed(1)}%</div>
            <div className="progress-bar">
              <div 
                className="progress-fill accuracy"
                style={{ width: `${calculateOverallAccuracy()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Subject Progress Section */}
      <section className="subject-progress">
        <h2><FaBook /> Subject Progress</h2>
        <div className="subject-grid">
          {subjectsProgress.map(({ subject, completion, accuracy, total, completed }) => (
            <div key={subject} className="subject-card">
              <h3>{subject}</h3>
              <div className="progress-stats">
                <div className="progress-item">
                  <label>Completion</label>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${completion}%` }}
                    >
                      <span>{completion.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="progress-item">
                  <label>Accuracy</label>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill accuracy"
                      style={{ width: `${accuracy}%` }}
                    >
                      <span>{accuracy.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="completion-text">
                  {completed} / {total} completed
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="recent-activity">
        <h2><FaClock /> Recent Activity</h2>
        <div className="activity-list">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="activity-card">
                <div className="activity-header">
                  <span className={`difficulty ${activity.problemDetails?.difficulty.toLowerCase()}`}>
                    {activity.problemDetails?.difficulty}
                  </span>
                  <span className="timestamp">
                    {new Date(activity.attemptedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3>{activity.problemDetails?.title}</h3>
                <div className="activity-details">
                  <span className="subject">{activity.problemDetails?.subject}</span>
                  <span className="score">Score: {(activity.score * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>No recent activity. Start solving problems to track your progress!</p>
              <button onClick={() => navigate('/problems')} className="start-button">
                Start Practicing
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Performance Insights Section */}
      <section className="performance-insights">
        <h2><FaLightbulb /> Personalized Suggestions</h2>
        
        {/* Areas Needing Improvement */}
        {performanceInsights.needsImprovement.length > 0 && (
          <div className="insight-card warning">
            <div className="insight-header">
              <FaExclamationTriangle />
              <h3>Areas Needing Improvement</h3>
            </div>
            <div className="topics-grid">
              {performanceInsights.needsImprovement.map((topic, index) => (
                <div key={index} className="topic-card needs-improvement">
                  <h4>{topic.topic}</h4>
                  <div className="topic-stats">
                    <span>Accuracy: {topic.accuracy.toFixed(1)}%</span>
                    <span>Completion: {topic.completion.toFixed(1)}%</span>
                  </div>
                  <p>{topic.suggestion}</p>
                  <button 
                    onClick={() => navigate('/problems', { 
                      state: { filterTopic: topic.topic } 
                    })}
                    className="practice-button"
                  >
                    Practice Now <FaArrowRight />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strong Performance Areas */}
        {performanceInsights.goodProgress.length > 0 && (
          <div className="insight-card success">
            <div className="insight-header">
              <FaTrophy />
              <h3>Strong Performance Areas</h3>
            </div>
            <div className="topics-grid">
              {performanceInsights.goodProgress.map((topic, index) => (
                <div key={index} className="topic-card good-progress">
                  <h4>{topic.topic}</h4>
                  <div className="topic-stats">
                    <span>Accuracy: {topic.accuracy.toFixed(1)}%</span>
                    <span>Completion: {topic.completion.toFixed(1)}%</span>
                  </div>
                  <p>{topic.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {performanceInsights.suggestions.length > 0 && (
          <div className="suggestions-section">
            <h3>Recommended Actions</h3>
            <div className="suggestions-grid">
              {performanceInsights.suggestions.map((suggestion, index) => (
                <div key={index} className={`suggestion-card ${suggestion.type}`}>
                  {suggestion.type === 'unattempted' && (
                    <>
                      <h4>Unexplored Topics</h4>
                      <ul>
                        {suggestion.topics.slice(0, 3).map((topic, i) => (
                          <li key={i}>
                            {topic.topic} ({topic.subject})
                            <button 
                              onClick={() => navigate('/problems', { 
                                state: { filterTopic: topic.topic } 
                              })}
                              className="start-practice"
                            >
                              Start Practice
                            </button>
                          </li>
                        ))}
                        {suggestion.topics.length > 3 && (
                          <li className="more-topics">
                            +{suggestion.topics.length - 3} more topics
                          </li>
                        )}
                      </ul>
                    </>
                  )}

                  {suggestion.type === 'lowCompletion' && (
                    <>
                      <h4>Topics to Focus On</h4>
                      <ul>
                        {suggestion.topics.slice(0, 3).map((topic, i) => (
                          <li key={i}>
                            {topic.topic} (Completed: {topic.completion.toFixed(1)}%)
                            <button 
                              onClick={() => navigate('/problems', { 
                                state: { filterTopic: topic.topic } 
                              })}
                              className="continue-practice"
                            >
                              Continue Practice
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {suggestion.type === 'subjectImprovement' && (
                    <>
                      <h4>Subjects Needing Attention</h4>
                      <ul>
                        {suggestion.subjects.map((subject, i) => (
                          <li key={i}>
                            {subject.subject} (Accuracy: {subject.accuracy.toFixed(1)}%)
                            <button 
                              onClick={() => navigate('/problems', { 
                                state: { filterSubject: subject.subject } 
                              })}
                              className="review-subject"
                            >
                              Review Subject
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <p className="suggestion-text">{suggestion.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Quick Stats Section */}
      <section className="quick-stats">
        <h2>Problem Solving Stats</h2>
        <div className="difficulty-stats">
          {Object.entries(difficultyStats).map(([difficulty, count]) => (
            <div key={difficulty} className={`difficulty-card ${difficulty.toLowerCase()}`}>
              <h3>{difficulty}</h3>
              <div className="count">{count}</div>
              <div className="label">Solved</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
