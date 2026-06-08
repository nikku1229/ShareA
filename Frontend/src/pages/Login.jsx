import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import faviconLogo from "../assets/Logos/ShareA-favicon.png";
import Logo from "../assets/Logos/ShareA-Logo-full.png";
import GoogleIcon from "../assets/Icons/GoogleIcon.svg";
import EmailIcon from "../assets/Icons/EmailIcon.svg";
import BackButton from "../components/BackButton.jsx";
import Toast from "../components/Toast.jsx";
import { useApp } from "../context/AppContext.jsx";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { showToast, popUp } = useApp();

  const handleLogin = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const existUser = users.find((u) => u.email === email);

    if (!existUser) {
      showToast("No user found. Please register first.", "error");
      return;
    }

    const isMatch = users.find((u) => u.password === password);

    if (!isMatch) {
      showToast("Incorrect password.", "error");
      return;
    }

    const user = users.find(
      (u) => u.email === email && u.password === password,
    );

    if (!user) {
      return;
    }

    localStorage.setItem("loggedInUser", JSON.stringify(user));
    window.dispatchEvent(new Event("storage"));
    showToast("Login successful! Welcome back!", "success");
    navigate("/");
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
          <div className="alternate-form-section login-msg">
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
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>

          <div className="form-section">
            <h1>Login</h1>
            <form onSubmit={handleLogin} className="form">
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
                Login
              </button>
            </form>
          </div>
        </div>

        <BackButton />
      </div>
    </>
  );
}

export default Login;
