import React, { useState } from "react";
import "./TestCreation.css";
import { db } from "../../firebase";
import { collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";

const TestCreation = () => {
  const [testName, setTestName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionType, setQuestionType] = useState("MCQ");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [topic, setTopic] = useState("");

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      questionText: question,
      type: questionType.toLowerCase(),
      options: questionType === "MCQ" ? options : [],
      correctAnswer: questionType === "MCQ" ? correctAnswer : parseFloat(correctAnswer),
      difficulty,
      topic,
    };

    setQuestions([...questions, newQuestion]);
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setTopic("");
  };

  const handleDeleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!testName || !startTime || !endTime || questions.length === 0) {
      alert("Please fill in all fields and add at least one question.");
      return;
    }

    try {
      const testDetails = {
        title: testName,
        startTime: Timestamp.fromDate(new Date(startTime)),
        endTime: Timestamp.fromDate(new Date(endTime)),
        description,
        createdAt: Timestamp.now(),
      };

      const testRef = await addDoc(collection(db, "Tests"), testDetails);
      const testId = testRef.id;

      const mcqIds = [];
      const natIds = [];

      const addQuestions = questions.map(async (questionItem) => {
        const questionData = {
          ...questionItem,
          testId,
          createdAt: Timestamp.now(),
        };

        let collectionName;
        switch (questionItem.type) {
          case "mcq":
            collectionName = "MCQ_Questions";
            break;
          case "nat":
            collectionName = "NAT_Questions";
            break;
          default:
            throw new Error(`Unknown question type: ${questionItem.type}`);
        }

        const docRef = await addDoc(collection(db, collectionName), questionData);
        if (questionItem.type === "mcq") mcqIds.push(docRef.id);
        else natIds.push(docRef.id);
      });

      await Promise.all(addQuestions);

      await setDoc(doc(db, "Tests", testId), {
        ...testDetails,
        id: testId,
        mcqQuestions: mcqIds,
        natQuestions: natIds,
      });

      alert("Test and Questions added successfully!");
      setTestName("");
      setStartTime("");
      setEndTime("");
      setDescription("");
      setQuestions([]);
    } catch (error) {
      console.error("Error saving test:", error);
      alert(`Failed to save test: ${error.message}`);
    }
  };

  return (
    <div className="test-creation-container">
      <h2>Create a New Test</h2>
      <label>Test Name:</label>
      <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} />

      <label>Start Time:</label>
      <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />

      <label>End Time:</label>
      <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

      <label>Description:</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

      <h2>Add a Question</h2>
      <label>Question Type:</label>
      <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
        <option value="MCQ">MCQ</option>
        <option value="NAT">NAT</option>
      </select>

      <label>Question:</label>
      <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} />

      {questionType === "MCQ" && (
        <>
          <label>Options:</label>
          {options.map((opt, index) => (
            <input key={index} type="text" value={opt} onChange={(e) => handleOptionChange(index, e.target.value)} />
          ))}
        </>
      )}

      <label>Correct Answer:</label>
      <input type="text" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} />

      <label>Difficulty Level:</label>
      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>

      <label>Topic:</label>
      <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} />

      <button onClick={handleAddQuestion}>Add Question</button>
      <button onClick={handleSubmit}>Save Test & Questions</button>
      
      <h3>Added Questions:</h3>
      {questions.map((q, index) => (
        <div key={index}>
          <p>{q.questionText}</p>
          <p>{q.type.toUpperCase()} - Difficulty: {q.difficulty} - Topic: {q.topic}</p>
          <button onClick={() => handleDeleteQuestion(index)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default TestCreation;
