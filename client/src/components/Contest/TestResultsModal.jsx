import React from 'react';
import './TestResultsModal.css';

const TestResultsModal = ({ test, performance }) => {
    return (
        <div className="modal">
            <div className="modal-content">
                <h2>{test.name} Results</h2>
                <p>Average Score: {performance?.averageScore}</p>
                <p>Average Accuracy: {performance?.averageAccuracy}%</p>
                <p>Your Score: {performance?.userScore}</p>
                <p>Your Accuracy: {performance?.userAccuracy}%</p>
                <button onClick={() => window.location.reload()}>Close</button>
            </div>
        </div>
    );
};

export default TestResultsModal;
