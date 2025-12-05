import React, { useState, useEffect } from 'react';
import { FaFilter, FaSort, FaChartLine, FaSearch } from 'react-icons/fa';
import QuestionAttempt from './QuestionAttempt';
import useProgress from '../../hooks/useProgress';
import './Problems.css';

const Problems = () => {
  const {
    loading,
    problems,
    userProgress,
    subjects,
    calculateOverallProgress,
    calculateSubjectProgress,
    refreshProgress
  } = useProgress();

  const [filteredProblems, setFilteredProblems] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [filters, setFilters] = useState({
    subject: 'all',
    difficulty: 'all',
    status: 'all',
    searchQuery: ''
  });
  const [sortBy, setSortBy] = useState('default');

  // Constants
  const difficulties = ['Easy', 'Medium', 'Hard'];

  // Handle question attempt
  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
  };

  const handleQuestionClose = () => {
    setSelectedQuestion(null);
  };

  const handleQuestionSubmit = async (score) => {
    await refreshProgress();
  };

  // Apply filters and sorting
  useEffect(() => {
    if (!problems) return;

    console.log('Applying filters and sorting...');
    let filtered = [...problems];

    // Apply subject filter
    if (filters.subject !== 'all') {
      filtered = filtered.filter(p => p.subject === filters.subject);
    }

    // Apply difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(p => p.difficulty === filters.difficulty);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      const completed = userProgress?.completedProblems || [];
      if (filters.status === 'completed') {
        filtered = filtered.filter(p => completed.some(cp => cp.id === p.id));
      } else {
        filtered = filtered.filter(p => !completed.some(cp => cp.id === p.id));
      }
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.subject.toLowerCase().includes(query) ||
        p.topic.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'difficulty':
        filtered.sort((a, b) => {
          const order = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          return order[a.difficulty] - order[b.difficulty];
        });
        break;
      case 'subject':
        filtered.sort((a, b) => a.subject.localeCompare(b.subject));
        break;
      case 'completion':
        filtered.sort((a, b) => {
          const completedA = userProgress?.completedProblems?.some(p => p.id === a.id) || false;
          const completedB = userProgress?.completedProblems?.some(p => p.id === b.id) || false;
          return completedB - completedA;
        });
        break;
      default:
        break;
    }

    console.log('Filtered problems:', filtered.length);
    setFilteredProblems(filtered);
  }, [filters, sortBy, problems, userProgress]);

  if (loading) {
    return (
      <div className="problems-loading">
        <div className="loading-spinner"></div>
        <p>Loading problems...</p>
      </div>
    );
  }

  return (
    <div className="problems-container">
      {/* Progress Overview */}
      <div className="progress-overview">
        <h2><FaChartLine className="icon" /> Overall Progress</h2>
        <div className="progress-stats">
          <div className="progress-bars">
            <div className="progress-item">
              <label>Completion Progress</label>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${calculateOverallProgress()}%` }}
                >
                  <span className="progress-text">{calculateOverallProgress().toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Progress */}
      <div className="subject-progress">
        <h2>Subject-wise Progress</h2>
        <div className="subject-grid">
          {subjects.map(subject => {
            const { completion, accuracy, total, completed } = calculateSubjectProgress(subject);
            return (
              <div key={subject} className="subject-card">
                <h3>{subject}</h3>
                <div className="progress-bars">
                  <div className="progress-item">
                    <label>Completion</label>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${completion}%` }}
                      >
                        <span className="progress-text">{completion.toFixed(1)}%</span>
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
                        <span className="progress-text">{accuracy.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="subject-stats">
                  <span>Total: {total}</span>
                  <span>Completed: {completed}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h2><FaFilter className="icon" /> Filters</h2>
          <button 
            className="reset-filters"
            onClick={() => setFilters({
              subject: 'all',
              difficulty: 'all',
              status: 'all',
              searchQuery: ''
            })}
          >
            Reset Filters
          </button>
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Subject</label>
            <select 
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Difficulty</label>
            <select 
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            >
              <option value="all">All Difficulties</option>
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sort By</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="difficulty">Difficulty</option>
              <option value="subject">Subject</option>
              <option value="completion">Completion Status</option>
            </select>
          </div>
          <div className="search-group">
            <label><FaSearch /> Search Problems</label>
            <input
              type="text"
              placeholder="Search by title, subject, or topic..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Problems Grid */}
      <div className="problems-grid">
        {filteredProblems.length === 0 ? (
          <div className="no-problems">
            No problems match your filters. Try adjusting your search criteria.
          </div>
        ) : (
          filteredProblems.map((problem, index) => {
            const isCompleted = userProgress?.completedProblems?.some(p => p.id === problem.id);
            const score = userProgress?.completedProblems?.find(p => p.id === problem.id)?.score || 0;
            
            return (
              <div 
                key={`${problem.id}-${index}`} 
                className={`problem-card ${isCompleted ? 'attempted' : ''}`}
                onClick={() => handleQuestionClick(problem)}
              >
                <div className="problem-header">
                  <span className="problem-topic">{problem.topic}</span>
                  <span className={`problem-difficulty ${problem.difficulty.toLowerCase()}`}>
                    {problem.difficulty}
                  </span>
                </div>
                <div className="problem-content">
                  <h3>{problem.title}</h3>
                  <p>{problem.description}</p>
                </div>
                <div className="problem-footer">
                  <span className="problem-subject">{problem.subject}</span>
                  <span className={`problem-status ${isCompleted ? 'attempted' : 'unattempted'}`}>
                    {isCompleted ? `Score: ${(score * 100).toFixed(0)}%` : 'Not Attempted'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Question Attempt Modal */}
      {selectedQuestion && (
        <QuestionAttempt
          question={selectedQuestion}
          onClose={handleQuestionClose}
          onSubmit={handleQuestionSubmit}
        />
      )}
    </div>
  );
};

export default Problems;
