import React from "react";
import { Link } from "react-router-dom";
import faviconLogo from "../assets/Logos/ShareA-favicon.png";

function Header() {
  return (
    <>
      <header className="header">
        <div className="logo-favicon">
          <Link to="/">
            <img src={faviconLogo} alt="ShareA Favicon" loading="lazy" />
          </Link>
        </div>

        <div className="header-buttons">
          <Link to="/login" className="header-btn">
            Login
          </Link>
          <Link to="/register" className="header-btn">
            Sign Up
          </Link>
        </div>
      </header>
    </>
  );
}

export default Header;
