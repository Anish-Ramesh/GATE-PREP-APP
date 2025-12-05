import { db, auth } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';

// User Progress Functions
export const getUserProgress = async (userId) => {
  try {
    const userProgressRef = doc(db, 'userProgress', userId);
    const userProgressDoc = await getDoc(userProgressRef);
    return userProgressDoc.exists() ? userProgressDoc.data() : null;
  } catch (error) {
    console.error('Error getting user progress:', error);
    throw error;
  }
};

export const updateStudyTime = async (userId, minutes) => {
  try {
    const userProgressRef = doc(db, 'userProgress', userId);
    const userProgressDoc = await getDoc(userProgressRef);
    
    if (userProgressDoc.exists()) {
      await updateDoc(userProgressRef, {
        totalStudyHours: (userProgressDoc.data().totalStudyHours || 0) + (minutes / 60),
        lastActive: serverTimestamp()
      });
    } else {
      await addDoc(userProgressRef, {
        userId,
        totalStudyHours: minutes / 60,
        totalQuizzesTaken: 0,
        subjectProgress: {},
        lastActive: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating study time:', error);
    throw error;
  }
};

// Quiz Functions
export const getQuizQuestions = async (subject, topicFilter = null, count = 10) => {
  try {
    let q = query(
      collection(db, 'questions'),
      where('subject', '==', subject),
      orderBy('createdAt')
    );
    
    if (topicFilter) {
      q = query(q, where('topic', '==', topicFilter));
    }
    
    const snapshot = await getDocs(q);
    const questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Randomly select 'count' questions
    return questions
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  } catch (error) {
    console.error('Error getting quiz questions:', error);
    throw error;
  }
};

export const submitQuizResult = async (quizData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Add quiz result
    const resultRef = await addDoc(collection(db, 'quizResults'), {
      ...quizData,
      userId: user.uid,
      timestamp: serverTimestamp()
    });

    // Update user progress
    const userProgressRef = doc(db, 'userProgress', user.uid);
    const userProgressDoc = await getDoc(userProgressRef);
    
    if (userProgressDoc.exists()) {
      const data = userProgressDoc.data();
      const subjectProgress = data.subjectProgress || {};
      
      // Update subject progress
      if (!subjectProgress[quizData.subject]) {
        subjectProgress[quizData.subject] = {
          totalAttempts: 0,
          totalScore: 0,
          bestScore: 0
        };
      }
      
      const currentSubject = subjectProgress[quizData.subject];
      currentSubject.totalAttempts += 1;
      currentSubject.totalScore += quizData.score;
      currentSubject.bestScore = Math.max(currentSubject.bestScore, quizData.score);
      
      await updateDoc(userProgressRef, {
        subjectProgress,
        totalQuizzesTaken: (data.totalQuizzesTaken || 0) + 1,
        lastActive: serverTimestamp()
      });
    }

    return resultRef.id;
  } catch (error) {
    console.error('Error submitting quiz result:', error);
    throw error;
  }
};

// Analytics Functions
export const getPerformanceAnalytics = async (userId) => {
  try {
    // Get quiz results
    const resultsQuery = query(
      collection(db, 'quizResults'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const resultsSnapshot = await getDocs(resultsQuery);
    const results = resultsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get user progress
    const progressDoc = await getDoc(doc(db, 'userProgress', userId));
    const progress = progressDoc.exists() ? progressDoc.data() : null;

    // Calculate analytics
    const analytics = {
      recentQuizzes: results,
      overallProgress: progress,
      subjectWiseAnalysis: {},
      weakTopics: [],
      strongTopics: []
    };

    // Process quiz results for detailed analysis
    results.forEach(result => {
      if (!analytics.subjectWiseAnalysis[result.subject]) {
        analytics.subjectWiseAnalysis[result.subject] = {
          attempts: 0,
          averageScore: 0,
          topicScores: {}
        };
      }

      const subjectAnalysis = analytics.subjectWiseAnalysis[result.subject];
      subjectAnalysis.attempts += 1;
      subjectAnalysis.averageScore = 
        (subjectAnalysis.averageScore * (subjectAnalysis.attempts - 1) + result.score) / 
        subjectAnalysis.attempts;

      // Process topic scores
      result.topicScores?.forEach(topic => {
        if (!subjectAnalysis.topicScores[topic.name]) {
          subjectAnalysis.topicScores[topic.name] = {
            correct: 0,
            total: 0
          };
        }
        subjectAnalysis.topicScores[topic.name].correct += topic.correct;
        subjectAnalysis.topicScores[topic.name].total += topic.total;
      });
    });

    // Identify weak and strong topics
    Object.entries(analytics.subjectWiseAnalysis).forEach(([subject, analysis]) => {
      Object.entries(analysis.topicScores).forEach(([topic, scores]) => {
        const percentage = (scores.correct / scores.total) * 100;
        const topicData = { subject, topic, percentage };
        
        if (percentage < 60) {
          analytics.weakTopics.push(topicData);
        } else if (percentage > 80) {
          analytics.strongTopics.push(topicData);
        }
      });
    });

    return analytics;
  } catch (error) {
    console.error('Error getting performance analytics:', error);
    throw error;
  }
};
