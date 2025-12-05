import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css"; 

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container no-scroll">
      <div className="landing-content">
        <h1 className="landing-title">WELCOME TO BreakiT!</h1>
        <p className="landing-subtext">
          Crack your way to success with <strong>BreakIt</strong>—your ultimate guide for expert <strong>GATE</strong> and <strong>GRE</strong> strategies and smart preparation.
        </p>
        <button className="glow-button fade-in-button" onClick={() => navigate('/login')}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
