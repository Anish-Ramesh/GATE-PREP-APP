import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LandingPage from "./LandingPage";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Home from "./Home";
import { auth, db } from "./firebase";
import Discuss from "./Discuss";
import Dashboard from "./components/Dashboard/Dashboard";
import Quiz from "./components/Quiz/Quiz";
import Navigation from "./components/Navigation/Navigation";
import Problems from "./components/Problems/Problems";
import TestRoom from "./components/TestRoom/TestRoom";
import Contest from "./components/Contest/Contest";
import TestPage from "./components/TestPage/TestPage"; // Import TestPage component
import TestCreation from "./components/TestCreation/TestCreation";
import Home2 from "./Home2";
import UserProfile from "./UserProfile";
import { doc, getDoc } from "firebase/firestore";
import { initializeDatabase } from "./utils/initializeDB";

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      setRoleError(null); // Reset error on auth change

      if (user) {
        setRoleLoading(true);
        try {
          let role = null;

          // Check if user exists in Students collection
          const studentDoc = await getDoc(doc(db, "Students", user.uid));
          if (studentDoc.exists()) {
            role = "student";
          } else {
            // If not found in Students, check in Teachers collection
            const teacherDoc = await getDoc(doc(db, "Teachers", user.uid));
            if (teacherDoc.exists()) {
              role = "teacher";
            }
          }

          if (role) {
            setUserRole(role);
            await initializeDatabase();
          } else {
            console.warn("User role not found in Firestore.");
            // Don't set error here, just leave role as null. 
            // The UI will handle "user but no role" state.
          }
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          setRoleError("Failed to fetch user permissions. Please check your connection or contact support.");
          toast.error("Error fetching user role.");
        } finally {
          setRoleLoading(false);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading || (user && roleLoading)) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="error-screen" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Error</h2>
        <p>{roleError}</p>
        <button onClick={() => auth.signOut()} style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Navigation user={user} />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={user ? (userRole ? <Navigate to={userRole === "teacher" ? "/home2" : "/home"} /> : <div className="loading-screen">Checking permissions...</div>) : <LoginForm />}
            />
            <Route
              path="/register"
              element={user ? (userRole ? <Navigate to={userRole === "teacher" ? "/home2" : "/home"} /> : <div className="loading-screen">Checking permissions...</div>) : <RegisterForm />}
            />
            <Route
              path="/home"
              element={user && userRole === "student" ? <Home /> : <Navigate to="/login" />}
            />
            <Route
              path="/home2"
              element={user && userRole === "teacher" ? <Home2 /> : <Navigate to="/login" />}
            />
            <Route
              path="/problems"
              element={user ? <Problems /> : <Navigate to="/login" />}
            />
            <Route
              path="/quiz"
              element={user ? <Quiz /> : <Navigate to="/login" />}
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/discuss"
              element={user ? <Discuss /> : <Navigate to="/login" />}
            />
            <Route
              path="/testcreation"
              element={user ? <TestCreation /> : <Navigate to="/login" />}
            />
            <Route
              path="/contest"
              element={user ? <Contest /> : <Navigate to="/login" />}
            />
            <Route
              path="/test-room"
              element={user ? <TestRoom /> : <Navigate to="/login" />}
            />
            <Route
              path="/test/:id"
              element={user ? <TestRoom /> : <Navigate to="/login" />}
            />
            <Route
              path="/test"
              element={user ? <TestPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/profile"
              element={user ? <UserProfile /> : <Navigate to="/login" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <ToastContainer position="bottom-right" />
      </Router>
    </>
  );
}

export default App;
