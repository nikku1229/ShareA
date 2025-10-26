import React from "react";
import { useState } from "react";
import Header from "../components/Header";
import { Link } from "react-router-dom";
import FullLogo from "../assets/Logos/ShareA-Logo-full.png";
import RoomIcon from "../assets/Icons/RoomIcon.svg";
import HamburgerIcon from "../assets/Icons/HamburgerIcon.svg";
import Sidebar from "../components/Sidebar";

function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <div className="container">
        <Header />

        <div className="home-full-logo">
          <h1>
            <Link to="/">
              <img src={FullLogo} alt="ShareA Logo" />
            </Link>
          </h1>
        </div>

        <div className="rooms-credentials">
          <div className="create room-sections">
            <div className="text-area">
              <h2>Create Room</h2>
              <img src={RoomIcon} alt="Room Icon" />
            </div>
            <div className="room-input-area">
              <input type="text" placeholder="Enter password to create" />
            </div>
            <div className="room-btn-area">
              <button className="room-btn">Create</button>
            </div>
          </div>

          <div className="seperator"></div>

          <div className="join room-sections">
            <div className="text-area">
              <h2>Join Room</h2>
              <img src={RoomIcon} alt="Room Icon" />
            </div>
            <div className="room-input-area">
              <input type="text" placeholder="Enter room id" />
              <input type="text" placeholder="Enter room password" />
            </div>
            <div className="room-btn-area">
              <button className="room-btn">Join</button>
            </div>
          </div>
        </div>

        {sidebarOpen ? (
          <Sidebar sidebarToggle={sidebarToggle} />
        ) : (
          <div className="sidebar-hamburger-icon" onClick={sidebarToggle}>
            <img src={HamburgerIcon} alt="Hamburger Icon" />
          </div>
        )}
      </div>
    </>
  );
}

export default Home;
