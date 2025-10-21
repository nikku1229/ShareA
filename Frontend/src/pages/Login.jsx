import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import faviconLogo from "../assets/Logos/ShareA-favicon.png";
import Logo from "../assets/Logos/ShareA-Logo-full.png";
import GoogleIcon from "../assets/Icons/GoogleIcon.svg";
import EmailIcon from "../assets/Icons/EmailIcon.svg";
import BackButton from "../components/BackButton.jsx";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      alert("No user found. Please register first.");
      return;
    }

    localStorage.setItem("loggedInUser", JSON.stringify(user));
    alert(`Welcome ${user.name}!`);
    navigate("/");
  };

  return (
    <>
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
              <Link>
                <img src={GoogleIcon} alt="google-icon" />
              </Link>
              <Link>
                <img src={EmailIcon} alt="google-icon" />
              </Link>
            </div>
            <p className="change-page-msg">
              Don’t have an account? <Link to="/register">Sign up</Link>
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
