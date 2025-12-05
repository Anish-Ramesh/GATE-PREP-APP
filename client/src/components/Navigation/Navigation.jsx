import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../../firebase'; // Make sure db is imported from Firebase config
import { toast } from 'react-toastify';
import { FaHome, FaChartLine, FaBook, FaQuestionCircle, FaDatabase, FaSignOutAlt, FaComments, FaTrophy, FaPlus } from 'react-icons/fa';
import { doc, getDoc } from "firebase/firestore"; // Make sure to import getDoc from Firestore
import './Navigation.css';

const Navigation = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          let userRef;
          const studentRef = doc(db, "Students", user.uid);  // Ensure you're using 'db' here
          const teacherRef = doc(db, "Teachers", user.uid);  // Ensure you're using 'db' here

          const studentSnap = await getDoc(studentRef);
          const teacherSnap = await getDoc(teacherRef);

          if (studentSnap.exists()) {
            setRole("student");
          } else if (teacherSnap.exists()) {
            setRole("teacher");
          }
        } catch (error) {
          console.error("Error fetching user role in Navigation:", error);
          // Don't show toast here to avoid duplicate toasts with App.jsx
        }
      }
    };
    fetchUserRole();
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Successfully logged out!");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed. Please try again!");
    }
  };

  // Don't show navigation on landing, login, and register pages
  if (["/", "/login", "/register"].includes(location.pathname)) {
    return null;
  }

  const studentNavLinks = [
    { path: '/home', icon: <FaHome />, text: 'Home' },
    { path: '/dashboard', icon: <FaChartLine />, text: 'Dashboard' },
    { path: '/problems', icon: <FaDatabase />, text: 'Problems' },
    { path: '/quiz', icon: <FaQuestionCircle />, text: 'Quiz' },
    { path: '/contest', icon: <FaTrophy />, text: 'Contest' },
    { path: '/discuss', icon: <FaComments />, text: 'Discuss' }
  ];

  const teacherNavLinks = [
    { path: '/contest', icon: <FaTrophy />, text: 'Contest' },
    { path: '/testcreation', icon: <FaPlus />, text: 'Contest Create' },
    { path: '/discuss', icon: <FaComments />, text: 'Discuss' },
  ];

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <Link to="/home" className="nav-logo">
          BreakiT!
        </Link>

        <div className="nav-links">
          {(role === 'student' ? studentNavLinks : teacherNavLinks).map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.text}</span>
            </Link>
          ))}
        </div>

        <div className="user-section">
          {user && (
            <>
              <div className="user-info">
                <Link to="/profile" className="user-avatar-container">
                  <div className="user-avatar">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div className="custom-tooltip">{user.email}</div>
                </Link>

              </div>
              <button onClick={handleLogout} className="logout-button">
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
