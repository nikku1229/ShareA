import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import faviconLogo from "../assets/Logos/ShareA-favicon.png";
import Logo from "../assets/Logos/ShareA-Logo-full.png";
import GoogleIcon from "../assets/Icons/GoogleIcon.svg";
import EmailIcon from "../assets/Icons/EmailIcon.svg";
import BackButton from "../components/BackButton.jsx";
import Toast from "../components/Toast.jsx";
import { useApp } from "../context/AppContext";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { showToast, popUp } = useApp();

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast("All fields are required!", "error");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userExists = users.some((u) => u.email === email);

    if (userExists) {
      showToast("User already registered. Please login.", "error");
      return;
    }

    users.push({ name, email, password });
    localStorage.setItem("users", JSON.stringify(users));
    showToast("Registration successful! Please login now.", "success");
    navigate("/login");
  };

  const handleMessage = () => {
    showToast("This will coming soon!");
  };

  return (
    <>
      {popUp && <Toast popUp={popUp} />}
      <div className="container">
        <div className="header">
          <div className="logo-favicon">
            <Link to="/">
              <img src={faviconLogo} alt="ShareA Favicon" loading="lazy" />
            </Link>
          </div>
        </div>

        <div className="form-box">
          <div className="form-section">
            <h1>Sign Up</h1>
            <form onSubmit={handleRegister} className="form">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-input"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
              <button type="submit" className="form-button">
                SignUp
              </button>
            </form>
          </div>
          <div className="alternate-form-section signup-msg">
            <div className="primary-logo">
              <Link to="/">
                <img src={Logo} alt="ShareA Logo" />
              </Link>
            </div>
            <div className="options-section">
              <Link onClick={handleMessage}>
                <img src={GoogleIcon} alt="google-icon" />
              </Link>
              <Link onClick={handleMessage}>
                <img src={EmailIcon} alt="google-icon" />
              </Link>
            </div>
            <p className="change-page-msg">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>

        <BackButton />
      </div>
    </>
  );
}

export default Register;
