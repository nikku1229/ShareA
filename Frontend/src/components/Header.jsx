import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import faviconLogo from "../assets/Logos/ShareA-favicon.png";
import UserIcon from "../assets/Icons/UserIcon.svg";

function Header({ loggedInUser, logoutUser }) {
  const [profileShow, setProfileShow] = useState(false);

  const toggleUsersProfile = () => {
    setProfileShow(!profileShow);
  };

  return (
    <>
      <header className="header">
        <div className="logo-favicon">
          <Link to="/">
            <img src={faviconLogo} alt="ShareA Favicon" loading="lazy" />
          </Link>
        </div>

        <div className="header-buttons">
          {!loggedInUser ? (
            <>
              <Link to="/login" className="header-btn">
                Login
              </Link>
              <Link to="/register" className="header-btn">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <div className="user-details">
                <div className="user-btn" onClick={toggleUsersProfile}>
                  <img src={UserIcon} alt="User Icon" />
                </div>

                {profileShow && (
                  <div className="profile-details">
                    <div className="profile-name">
                      <p>{loggedInUser.name}</p>
                    </div>
                    <div className="logout-btn">
                      <button onClick={logoutUser}>Logout</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}

export default Header;
