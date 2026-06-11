import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SaveReceivedData from "../components/SaveReceivedData";
import SaveSentData from "../components/SaveSentData";
import { useApp } from "../context/AppContext";
import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../context/SocketContext";
import FullLogo from "../assets/Logos/ShareA-Logo-full.png";
import RoomIcon from "../assets/Icons/RoomIcon.svg";
import HamburgerIcon from "../assets/Icons/HamburgerIcon.svg";
import EyeBtn from "../assets/Icons/EyeIcon.svg";
import EyeCloseBtn from "../assets/Icons/EyeOffIcon.svg";

function Home() {
  const {
    loggedInUser,
    setLoggedInUser,
    createRoomPassword,
    setCreateRoomPassword,
    roomCode,
    setRoomCode,
    joinedRoomPassword,
    setJoinedRoomPassword,
    error,
    showToast,
  } = useApp();

  const { createRoom, joinRoom } = useRoom();
  const { disconnectSocket } = useSocket();

  const [toggleSendBlock, setToggleSendBlock] = useState(false);
  const [toggleReceivedBlock, setToggleReceivedBlock] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [togglePasswordInput, setTogglePasswordInput] = useState(false);
  const [toggleJoinPasswordInput, setToggleJoinPasswordInput] = useState(false);

  const sidebarToggle = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  const toggleSendBlockFunction = () => {
    if (toggleReceivedBlock) setToggleReceivedBlock(false);
    setToggleSendBlock(!toggleSendBlock);
    sidebarToggle();
  };

  const toggleReceivedBlockFunction = () => {
    if (toggleSendBlock) setToggleSendBlock(false);
    setToggleReceivedBlock(!toggleReceivedBlock);
    sidebarToggle();
  };

  const logoutUser = () => {
    localStorage.removeItem("loggedInUser");
    setLoggedInUser(null);
    showToast("Logout successful");
    disconnectSocket();
  };

  return (
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
        <form
          className="create room-sections"
          onSubmit={(e) => {
            e.preventDefault();
            createRoom(createRoomPassword);
          }}
        >
          <div className="text-area">
            <h2>Create Room</h2>
            <img src={RoomIcon} alt="Room Icon" />
          </div>
          <div className="room-input-area">
            <div className="password">
              <input
                type={togglePasswordInput ? "text" : "password"}
                placeholder="Enter password..."
                value={createRoomPassword}
                onChange={(e) => setCreateRoomPassword(e.target.value)}
                required
              />
              <img
                src={togglePasswordInput ? EyeBtn : EyeCloseBtn}
                alt={togglePasswordInput ? "Hide" : "Show"}
                className="eye-toggle-btn"
                onClick={() => setTogglePasswordInput(!togglePasswordInput)}
              />
            </div>
          </div>
          <div className="room-btn-area">
            <button className="room-btn">Create</button>
          </div>
        </form>

        <div className="seperator"></div>

        <form
          className="join room-sections"
          onSubmit={(e) => {
            e.preventDefault();
            joinRoom(roomCode, joinedRoomPassword);
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
              required
            />
            <div className="password">
              <input
                type={toggleJoinPasswordInput ? "text" : "password"}
                placeholder="Enter room password"
                value={joinedRoomPassword}
                onChange={(e) => setJoinedRoomPassword(e.target.value)}
                required
              />
              <img
                src={toggleJoinPasswordInput ? EyeBtn : EyeCloseBtn}
                alt={toggleJoinPasswordInput ? "Hide" : "Show"}
                className="eye-toggle-btn"
                onClick={() =>
                  setToggleJoinPasswordInput(!toggleJoinPasswordInput)
                }
              />
            </div>
          </div>
          <div className="room-btn-area">
            <button className="room-btn">Join</button>
          </div>
        </form>
      </div>

      {sidebarOpen ? (
        <Sidebar
          sidebarToggle={sidebarToggle}
          toggleSendBlockFunction={toggleSendBlockFunction}
          toggleReceivedBlockFunction={toggleReceivedBlockFunction}
        />
      ) : (
        <div className="sidebar-hamburger-icon" onClick={sidebarToggle}>
          <img src={HamburgerIcon} alt="Menu" />
        </div>
      )}

      {toggleSendBlock && (
        <SaveSentData
          toggleSendBlockFunction={toggleSendBlockFunction}
          loggedInUser={loggedInUser}
          setLoggedInUser={setLoggedInUser}
        />
      )}

      {toggleReceivedBlock && (
        <SaveReceivedData
          toggleReceivedBlockFunction={toggleReceivedBlockFunction}
          loggedInUser={loggedInUser}
          setLoggedInUser={setLoggedInUser}
        />
      )}
    </div>
  );
}

export default Home;
