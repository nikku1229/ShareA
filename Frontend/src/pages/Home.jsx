import React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SaveReceivedData from "../components/SaveReceivedData";
import SaveSentData from "../components/SaveSentData";
import users from "../context/User";
import FullLogo from "../assets/Logos/ShareA-Logo-full.png";
import RoomIcon from "../assets/Icons/RoomIcon.svg";
import HamburgerIcon from "../assets/Icons/HamburgerIcon.svg";

function Home({
  loggedInUser,
  setLoggedInUser,
  createRoom,
  createRoomPassword,
  setCreateRoomPassword,
  joinRoom,
  roomCode,
  setRoomCode,
  joinedRoomPassword,
  setJoinedRoomPassword,
  error,
}) {
  const [toggleSendBlock, setToggleSendBlock] = useState(false);
  const [toggleReceivedBlock, setToggleReceivedBlock] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSendBlockFunction = () => {
    if (toggleReceivedBlock) {
      setToggleReceivedBlock(false);
    }
    setToggleSendBlock(!toggleSendBlock);
    sidebarToggle();
  };
  const toggleReceivedBlockFunction = () => {
    if (toggleSendBlock) {
      setToggleSendBlock(false);
    }
    setToggleReceivedBlock(!toggleReceivedBlock);
    sidebarToggle();
  };

  useEffect(() => {
    setLoggedInUser(users);
  }, []);

  const logoutUser = () => {
    localStorage.removeItem("loggedInUser");
    setLoggedInUser(null);
  };

  return (
    <>
      <div className="container">
        <Header loggedInUser={loggedInUser} logoutUser={logoutUser} />

        <div className="home-full-logo">
          <h1>
            <Link to="/">
              <img src={FullLogo} alt="ShareA Logo" />
            </Link>
          </h1>
        </div>

        <div className="rooms-credentials">
          <div>
            <form
              className="create room-sections"
              action="#"
              onSubmit={(e) => {
                e.preventDefault();
                createRoom();
              }}
            >
              <div className="text-area">
                <h2>Create Room</h2>
                <img src={RoomIcon} alt="Room Icon" />
              </div>
              <div className="room-input-area">
                <input
                  type="password"
                  placeholder="Enter password to create"
                  value={createRoomPassword}
                  onChange={(e) => setCreateRoomPassword(e.target.value)}
                  name="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="room-btn-area">
                <button className="room-btn">Create</button>
              </div>
            </form>
          </div>

          <div className="seperator"></div>

          <div>
            <form
              className="join room-sections"
              action="#"
              onSubmit={(e) => {
                e.preventDefault();
                joinRoom();
              }}
            >
              <div className="text-area">
                <h2>Join Room</h2>
                <img src={RoomIcon} alt="Room Icon" />
              </div>
              <div className="room-input-area">
                <input
                  type="text"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  name="roomCode"
                  autoComplete="new-roomCode"
                  required
                />

                <input
                  type="password"
                  placeholder="Enter room password"
                  value={joinedRoomPassword}
                  onChange={(e) => setJoinedRoomPassword(e.target.value)}
                  name="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="room-btn-area">
                <button className="room-btn">Join</button>
              </div>
            </form>
          </div>

          <div className="room-error-msg">
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>
        </div>

        {sidebarOpen ? (
          <Sidebar
            sidebarToggle={sidebarToggle}
            toggleSendBlockFunction={toggleSendBlockFunction}
            toggleReceivedBlockFunction={toggleReceivedBlockFunction}
          />
        ) : (
          <div className="sidebar-hamburger-icon" onClick={sidebarToggle}>
            <img src={HamburgerIcon} alt="Hamburger Icon" />
          </div>
        )}

        {toggleSendBlock && (
          <>
            <SaveSentData
              toggleSendBlockFunction={toggleSendBlockFunction}
              loggedInUser={loggedInUser}
              setLoggedInUser={setLoggedInUser}
            />
          </>
        )}
        {toggleReceivedBlock && (
          <>
            <SaveReceivedData
              toggleReceivedBlockFunction={toggleReceivedBlockFunction}
              loggedInUser={loggedInUser}
              setLoggedInUser={setLoggedInUser}
            />
          </>
        )}
      </div>
    </>
  );
}

export default Home;
