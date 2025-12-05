import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import DiscussionCard from './components/Discussion/DiscussionCard';
import './Discuss.css';

const Discuss = () => {
  const [discussions, setDiscussions] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', subject: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const subjects = [
    'Computer Networks',
    'Operating Systems',
    'Database Management',
    'Data Structures',
    'Algorithms',
    'General'
  ];

  // Effect for fetching discussions
  useEffect(() => {
    fetchDiscussions();
  }, []);

  // Effect for chat scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchDiscussions = async () => {
    try {
      const q = query(
        collection(db, 'discussions'),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const discussionData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiscussions(discussionData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching discussions:', err);
      setError('Failed to load discussions. Please try again later.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('Please sign in to post discussions');
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.subject) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const discussionRef = collection(db, 'discussions');
      await addDoc(discussionRef, {
        title: newPost.title,
        content: newPost.content,
        subject: newPost.subject,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0] || 'Anonymous',
        userEmail: auth.currentUser.email,
        timestamp: serverTimestamp(),
        replies: []
      });

      setNewPost({ title: '', content: '', subject: '' });
      fetchDiscussions();
      setError(null);
    } catch (err) {
      console.error('Error creating discussion:', err);
      setError('Failed to create discussion. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading discussions...</div>;
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessage = { role: 'user', content: userInput };
    setChatMessages(prev => [...prev, newMessage]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `user_input=${encodeURIComponent(userInput)}`,
      });

      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setError('Failed to get AI response. Please try again.');
    } finally {
      setUserInput('');
      setIsChatLoading(false);
    }
  };

  return (
    <div className="discuss-container">
      <div className="discuss-header">
        <div className="header-content">
          <h1>{showAIChat ? 'AI Assistant' : 'Community Discussions'}</h1>
          <p>{showAIChat ? 'Get instant help from our AI tutor' : 'Share your doubts and help others learn'}</p>
        </div>
        <button
          className={`toggle-btn ${showAIChat ? 'ai-active' : ''}`}
          onClick={() => setShowAIChat(!showAIChat)}
        >
          {showAIChat ? 'Switch to Community' : 'Switch to AI Chat'}
        </button>
      </div>

      {!showAIChat ? (
        <>
          <div className="new-discussion">
            <h2>Start a New Discussion</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Subject:</label>
                <select
                  className="white-background"
                  value={newPost.subject}
                  onChange={(e) => setNewPost({ ...newPost, subject: e.target.value })}
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="What's your question?"
                  required
                />
              </div>

              <div className="form-group">
                <label>Content:</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Provide more details about your question..."
                  required
                  rows="4"
                />
              </div>

              <button type="submit" className="submit-btn">Post Discussion</button>
            </form>
          </div>

          <div className="discussions-list">
            <h2>Recent Discussions</h2>
            {discussions.map(discussion => (
              <DiscussionCard
                key={discussion.id}
                discussion={discussion}
                onReplyAdded={fetchDiscussions}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="ai-chat-container">
          <div className="chat-messages" ref={chatContainerRef}>
            {chatMessages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
            {isChatLoading && (
              <div className="message assistant">
                <div className="message-content">Thinking...</div>
              </div>
            )}
          </div>
          <form onSubmit={handleChatSubmit} className="chat-input-form">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask your question here..."
              disabled={isChatLoading}
            />
            <button type="submit" disabled={isChatLoading || !userInput.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Discuss;
