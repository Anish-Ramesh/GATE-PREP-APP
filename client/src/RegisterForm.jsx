import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./Register.css";
import {auth, db} from "./firebase";
import { setDoc,doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

const RegisterForm = () => {
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({ name: "",userName: "",email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDropdownToggle = (open) => {
    setIsDropdownOpen(open);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const role = userType;
    const{name,profileName,email,password} = formData;

    const profileNameRegex = /^[a-zA-Z0-9_]+$/;
    if (!profileNameRegex.test(profileName)) {
    toast.warning("Profile name must contain only letters, numbers, and underscores.");
    return;
    }

    const allowedDomain = "citchennai.net"; 
    const emailDomain = email.split("@")[1];

    if (emailDomain !== allowedDomain) {
      toast.warning("Only users with a '@citchennai.net' email can register.");
      return;
    }

    try{

      const isProfileNameTaken = async (profileName) => {
        const studentsRef = collection(db, "Students");
        const teachersRef = collection(db, "Teachers");
      
        const studentQuery = query(studentsRef, where("ProfileName", "==", profileName));
        const teacherQuery = query(teachersRef, where("ProfileName", "==", profileName));
      
        const studentSnap = await getDocs(studentQuery);
        const teacherSnap = await getDocs(teacherQuery);
      
        return !studentSnap.empty || !teacherSnap.empty;
      };

      if (await isProfileNameTaken(profileName)) {
        toast.warning("Profile name is already taken. Please choose another.");
        return;
      }
      
      await createUserWithEmailAndPassword(auth,email,password);
      const user = auth.currentUser;
      console.log(user);
      if(user){
        const collectionName = userType === "student" ? "Students" : "Teachers";
        await setDoc(doc(db,collectionName,user.uid),{
          Email:user.email,
          Name:name,
          ProfileName: profileName,
          Role:role,
          Uid:user.uid
        });
      }
      console.log("User Registered Successfully");
      toast.success("Registered Successfully!")
      navigate("/home");
    }
    catch(error){
      console.log(error.message);
      toast.warning(error.message);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Register</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          
          {/* User Role Selection */}
                    <div 
                      className={`role-dropdown-container ${isDropdownOpen ? "expanded" : ""}`} 
                    >
                      <label className="role-label">
                        <FaUser className="icon" /> Select Role:
                        <select 
                          value={userType} 
                          onChange={(e) => setUserType(e.target.value)} 
                          onFocus={() => handleDropdownToggle(true)}
                          onBlur={() => handleDropdownToggle(false)}
                          className="role-dropdown"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                        </select>
                      </label>
                    </div>

          {/* Name Field */}
          <div className="input-group">
            <FaUser className="icon" />
            <input 
              type="text" 
              name="name" 
              placeholder="Full Name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>

          {/* Profile Name Field */}
          <div className="input-group">
            <FaUser className="icon" />
              <input 
                type="text" 
                name="profileName" 
                placeholder="User Name" 
                value={formData.profileName} 
                onChange={handleChange} 
                autoComplete="off"
                required 
              />
          </div>

          {/* Email Field */}
          <div className="input-group">
            <FaEnvelope className="icon" />
            <input 
              type="email" 
              name="email" 
              placeholder="Email Address" 
              value={formData.email} 
              onChange={handleChange}
              autoComplete="off" 
              required 
            />
          </div>

          {/* Password Field */}
          <div className="input-group">
            <FaLock className="icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder="Password" 
              value={formData.password} 
              onChange={handleChange} 
              autoComplete="off"
              required 
            />
            <span 
              className="toggle-password" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "👁️" : "🔒"}
            </span>
          </div>

          {/* Register Button */}
          <button type="submit" className="register-button">Register</button>

          {/* Already have an account? */}
          <p className="login-link">Already have an account? <a href="/login">Login</a></p>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
