import React, { useState } from 'react';
import { auth, db } from '../../firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import './Discussion.css';

const DiscussionCard = ({ discussion, onReplyAdded }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [error, setError] = useState(null);

  const handleReply = async () => {
    if (replyContent.trim() !== '') {
      try {
        const discussionRef = doc(db, 'discussions', discussion.id);

        // Create a new reply object with current timestamp
        const newReply = {
          content: replyContent,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0] || 'Anonymous',
          userEmail: auth.currentUser.email,
          timestamp: new Date().toISOString(),
        };

        // Add the new reply to the discussion's replies array
        await updateDoc(discussionRef, {
          replies: arrayUnion(newReply),
        });

        setReplyContent('');
        setShowReplyForm(false);
        setError(null);
        if (onReplyAdded) onReplyAdded();
        console.log('Reply added successfully!');
      } catch (error) {
        console.error('Error adding reply:', error);
        setError('Failed to add reply. Please try again.');
      }
    } else {
      setError('Reply cannot be empty');
    }
  };

  return (
    <div className="discussion-card">
      <div className="discussion-header">
        <h3>{discussion.title}</h3>
        <span className="subject-tag">{discussion.subject}</span>
      </div>
      <p className="discussion-content">{discussion.content}</p>
      <div className="discussion-meta">
        <span className="author">Posted by {discussion.userName === 'Anonymous' && discussion.userEmail ? discussion.userEmail.split('@')[0] : discussion.userName}</span>
        <span className="timestamp">
          {discussion.timestamp?.toDate ? discussion.timestamp.toDate().toLocaleDateString() : new Date(discussion.timestamp).toLocaleDateString()}
        </span>
      </div>

      <div className="discussion-replies">
        {discussion.replies && discussion.replies.length > 0 && (
          <div className="replies-section">
            <h4>Replies ({discussion.replies.length})</h4>
            {discussion.replies.map((reply, index) => (
              <div key={index} className="reply-card">
                <p className="reply-content">{reply.content}</p>
                <div className="reply-meta">
                  <span className="author">Replied by {reply.userName === 'Anonymous' && reply.userEmail ? reply.userEmail.split('@')[0] : reply.userName}</span>
                  <span className="timestamp">
                    {reply.timestamp?.toDate ? reply.timestamp.toDate().toLocaleDateString() : new Date(reply.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showReplyForm ? (
          <button
            className="reply-btn"
            onClick={() => setShowReplyForm(true)}
          >
            Reply to Discussion
          </button>
        ) : (
          <form onSubmit={(e) => e.preventDefault()} className="reply-form">
            {error && <div className="error-message">{error}</div>}
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows="3"
              required
            />
            <div className="reply-actions">
              <button type="button" className="submit-btn" onClick={handleReply}>
                Post Reply
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent('');
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DiscussionCard;
