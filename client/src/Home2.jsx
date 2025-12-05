import { Link } from "react-router-dom";
import "./home2.css";

const Home2 = () => {
  return (
    <header className="cover">
    <div className="teacher-home">
      {/* Hero Section */}
      <div className="hero-section">
        <h1>Welcome, Educators!</h1>
        <p>
          Empower your students with well-structured tests and track their performance effortlessly.
        </p>
        <Link to="/testcreation">
          <button className="cta-button">
            Create a Test
          </button>
        </Link>
      </div>
      
      {/* Features Section */}
      <div className="features-section">
        <FeatureCard
          title="Easy Test Creation"
          description="Design quizzes with ease, set deadlines, and assign to students."
        />
        <FeatureCard
          title="Performance Analytics"
          description="Get detailed reports on student progress and insights on strengths and weaknesses."
        />
        <FeatureCard
          title="Student Management"
          description="Monitor student activity, review submissions, and provide feedback."
        />
      </div>
    </div>
    </header>
  );
};

const FeatureCard = ({ title, description }) => {
  return (
    <div className="feature-card">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
};

export default Home2;
