import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const useProgress = () => {
  const [problems, setProblems] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const subjects = ['Mathematics', 'Digital Logic', 'Computer Organization', 'Programming', 'Theory of Computation'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      // Fetch problems
      const problemsRef = collection(db, 'problems');
      try {
        const problemsSnap = await getDocs(problemsRef);
        const problemsList = problemsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProblems(problemsList);
      } catch (problemsError) {
        console.error("Error fetching problems:", problemsError);
        setError(problemsError);
      }

      // Fetch user progress
      try {
        const progressRef = doc(db, 'userProgress', auth.currentUser.uid);
        const progressSnap = await getDoc(progressRef);
        
        if (progressSnap.exists()) {
          setUserProgress(progressSnap.data());
        } else {
          setUserProgress({
            completedProblems: [],
            totalProblems: 0
          });
        }
      } catch (progressError) {
        console.error("Error fetching user progress:", progressError);
        setError(progressError);
      }
    } catch (error) {
      console.error("An unknown error occurred:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallProgress = () => {
    if (!userProgress?.completedProblems || problems.length === 0) return 0;
    return (userProgress.completedProblems.length / problems.length) * 100;
  };

  const calculateOverallAccuracy = () => {
    if (!userProgress?.completedProblems || userProgress.completedProblems.length === 0) return 0;
    const totalScore = userProgress.completedProblems.reduce((acc, curr) => acc + curr.score, 0);
    return (totalScore / userProgress.completedProblems.length) * 100;
  };

  const calculateSubjectProgress = (subject) => {
    if (!userProgress?.completedProblems || problems.length === 0) {
      return { completion: 0, accuracy: 0, total: 0, completed: 0 };
    }

    const subjectProblems = problems.filter(p => p.subject === subject);
    const completedSubjectProblems = userProgress.completedProblems.filter(
      p => p.subject === subject
    );

    const completion = (completedSubjectProblems.length / subjectProblems.length) * 100;
    const accuracy = completedSubjectProblems.length > 0
      ? (completedSubjectProblems.reduce((acc, curr) => acc + curr.score, 0) / completedSubjectProblems.length) * 100
      : 0;

    return {
      completion,
      accuracy,
      total: subjectProblems.length,
      completed: completedSubjectProblems.length
    };
  };

  const getSubjectsProgress = () => {
    return subjects.map(subject => ({
      subject,
      ...calculateSubjectProgress(subject)
    }));
  };

  const getDifficultyStats = () => {
    const stats = { Easy: 0, Medium: 0, Hard: 0 };
    if (!userProgress?.completedProblems) return stats;

    userProgress.completedProblems.forEach(prob => {
      const problem = problems.find(p => p.id === prob.id);
      if (problem) {
        stats[problem.difficulty] = (stats[problem.difficulty] || 0) + 1;
      }
    });

    return stats;
  };

  const getRecentActivity = () => {
    if (!userProgress?.completedProblems) return [];
    
    return [...userProgress.completedProblems]
      .sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt))
      .slice(0, 5)
      .map(activity => {
        const problem = problems.find(p => p.id === activity.id);
        return {
          ...activity,
          problemDetails: problem
        };
      });
  };

  const getTopicAnalysis = () => {
    if (!userProgress?.completedProblems || problems.length === 0) {
      return [];
    }

    // Get all unique topics
    const topics = new Set(problems.map(p => p.topic));
    const topicAnalysis = [];

    topics.forEach(topic => {
      const topicProblems = problems.filter(p => p.topic === topic);
      const completedTopicProblems = userProgress.completedProblems.filter(
        p => {
          const problem = problems.find(prob => prob.id === p.id);
          return problem && problem.topic === topic;
        }
      );

      if (topicProblems.length > 0) {
        const completion = (completedTopicProblems.length / topicProblems.length) * 100;
        const accuracy = completedTopicProblems.length > 0
          ? (completedTopicProblems.reduce((acc, curr) => acc + curr.score, 0) / completedTopicProblems.length) * 100
          : 0;

        topicAnalysis.push({
          topic,
          subject: topicProblems[0].subject,
          completion,
          accuracy,
          total: topicProblems.length,
          completed: completedTopicProblems.length,
          averageAttempts: completedTopicProblems.length > 0
            ? completedTopicProblems.length / topicProblems.length
            : 0
        });
      }
    });

    return topicAnalysis;
  };

  const getPerformanceInsights = () => {
    const topicAnalysis = getTopicAnalysis();
    const insights = {
      needsImprovement: [],
      goodProgress: [],
      suggestions: []
    };

    // Analyze each topic
    topicAnalysis.forEach(topic => {
      if (topic.completion > 0) {  // Only analyze attempted topics
        if (topic.accuracy < 60) {
          insights.needsImprovement.push({
            ...topic,
            reason: 'Low accuracy',
            suggestion: `Review the concepts in ${topic.topic} as your accuracy is below 60%`
          });
        } else if (topic.accuracy > 80) {
          insights.goodProgress.push({
            ...topic,
            reason: 'High accuracy',
            suggestion: 'Keep up the good work!'
          });
        }
      }
    });

    // Find topics with no attempts
    const unattempedTopics = topicAnalysis.filter(t => t.completion === 0);
    if (unattempedTopics.length > 0) {
      insights.suggestions.push({
        type: 'unattempted',
        topics: unattempedTopics,
        suggestion: 'Start practicing these topics to improve your overall performance'
      });
    }

    // Find topics with low completion rate
    const lowCompletionTopics = topicAnalysis.filter(t => t.completion > 0 && t.completion < 30);
    if (lowCompletionTopics.length > 0) {
      insights.suggestions.push({
        type: 'lowCompletion',
        topics: lowCompletionTopics,
        suggestion: 'Try to complete more problems in these topics'
      });
    }

    // Find subjects that need attention
    const subjectProgress = subjects.map(subject => ({
      subject,
      ...calculateSubjectProgress(subject)
    }));

    const lowPerformingSubjects = subjectProgress.filter(s => s.accuracy < 60 && s.completion > 0);
    if (lowPerformingSubjects.length > 0) {
      insights.suggestions.push({
        type: 'subjectImprovement',
        subjects: lowPerformingSubjects,
        suggestion: 'Focus on improving your performance in these subjects'
      });
    }

    return insights;
  };

  return {
    loading,
    error,
    problems,
    userProgress,
    subjects,
    calculateOverallProgress,
    calculateOverallAccuracy,
    calculateSubjectProgress,
    getSubjectsProgress,
    getDifficultyStats,
    getRecentActivity,
    getTopicAnalysis,
    getPerformanceInsights,
    refreshProgress: fetchData
  };
};

export default useProgress;
