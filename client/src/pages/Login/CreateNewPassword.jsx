import React, { useState } from "react";
import hideIcon from "../../assets/hide.png";
import showIcon from "../../assets/show.png";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuthentication, setUserType } from "../../features/Authentication/authenticatorSlice.mjs";
import { updatePassword } from '../../features/users/userSlice.mjs';

export const CreateNewPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    } 
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      const userId = localStorage.getItem('auth_token'); 
      const role = localStorage.getItem('user_role');

      dispatch(setAuthentication(true));
      dispatch(setUserType("society"));
      navigate("/society-dashboard");
    } catch (error) {
      setError(error || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-new-password">
      <div className="form-container">
        <img className="logo" alt="Logo" src={logo} />
        <h2 className="title">Create New Password</h2>

        <div className="input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="password-input"
          />
          <div className="toggle-icon" onClick={() => setShowPassword(!showPassword)}>
            <img src={showPassword ? showIcon : hideIcon} alt="Toggle visibility" />
          </div>
        </div>

        <div className="input-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="password-input"
          />
          <div className="toggle-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            <img src={showConfirmPassword ? showIcon : hideIcon} alt="Toggle visibility" />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          className="confirm-button" 
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Confirm Changes"}
        </button>
      </div>
    </div>
  );
};
