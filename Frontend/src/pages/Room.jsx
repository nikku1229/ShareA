import React from "react";
import { useState, useEffect } from "react";
import socket from "../socket";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SaveReceivedData from "../components/SaveReceivedData";
import SaveSentData from "../components/SaveSentData";
import CopyIcon from "../assets/Icons/CopyIcon.svg";
import LeaveIcon from "../assets/Icons/LeaveIcon.svg";
import HamburgerIcon from "../assets/Icons/HamburgerIcon.svg";
import UploadIcon from "../assets/Icons/UploadIcon.svg";
import SendIcon from "../assets/Icons/SendIcon.svg";
import ReceivedIcon from "../assets/Icons/ReceivedIcon.svg";
import DownloadIcon from "../assets/Icons/DownloadIcon.svg";

function Room({
  roomCode,
  joinedRoom,
  setpopUp,
  leaveRoom,
  sendFile,
  sentFiles,
  receivedFiles,
  users,
  socket,
  uploadProgress,
  downloadProgress,
  chat,
  sendMessage,
  message,
  setMessage,
  // deleteFromSent,
}) {
  const [loggedInUser, setLoggedInUser] = useState();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatEnable, setChatEnable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toggleSendBlock, setToggleSendBlock] = useState(false);
  const [toggleReceivedBlock, setToggleReceivedBlock] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      const userDetail = JSON.parse(raw);
      setLoggedInUser(userDetail);
    } catch (err) {
      console.error("Failed parsing loggedInUser from localStorage:", err);
    }
  }, []);

  const logoutUser = () => {
    localStorage.removeItem("loggedInUser");
    setLoggedInUser(null);
  };

  const sidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const chatToggle = () => {
    setChatEnable(!chatEnable);
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

  const copyRoomCode = (roomCode) => {
    navigator.clipboard.writeText(roomCode);
    setpopUp("✅ Room code copied!");
    setTimeout(() => setpopUp(""), 2000); // hide after 2 seconds
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) sendFile(file);
  };

  return (
    <>
      <div className="container">
        <Header loggedInUser={loggedInUser} logoutUser={logoutUser} />

        {sidebarOpen ? (
          <Sidebar
            sidebarToggle={sidebarToggle}
            joinedRoom={joinedRoom}
            chatToggle={chatToggle}
            toggleSendBlockFunction={toggleSendBlockFunction}
            toggleReceivedBlockFunction={toggleReceivedBlockFunction}
          />
        ) : (
          <div className="sidebar-hamburger-icon" onClick={sidebarToggle}>
            <img src={HamburgerIcon} alt="Hamburger Icon" />
          </div>
        )}

        <div className="leave-room-btn">
          <button
            onClick={() => {
              leaveRoom();
            }}
          >
            <img src={LeaveIcon} alt="Leave Icon" />
          </button>
        </div>

        {roomCode && joinedRoom && (
          <>
            <div className="room-code-detail">
              <div className="room-code">
                <h1>
                  <span>
                    ROOM <span className="roomcode">{roomCode}</span>
                  </span>
                  <span
                    onClick={() => {
                      copyRoomCode(roomCode);
                    }}
                  >
                    <img src={CopyIcon} alt="Copy Icon" />
                  </span>
                </h1>
              </div>
            </div>

            <div className="room-area">
              {chatEnable && (
                <div className="chat-container">
                  <div className="chatbox-block">
                    <div className="chat-title">
                      <div className="space-column"></div>
                      <div className="title-column">
                        <h2>Chat Here</h2>
                      </div>
                      <div
                        className="chat-toggle-column"
                        onClick={() => {
                          chatToggle();
                        }}
                      >
                        <img src={LeaveIcon} alt="Leave Chat" />
                      </div>
                    </div>

                    <div className="chat-box">
                      <div className="chat-display">
                        {chat.map((c, i) => (
                          <div
                            key={i}
                            className={`chat-message ${
                              c.user === "system"
                                ? "system"
                                : c.user === socket
                                ? "me"
                                : "other"
                            }`}
                          >
                            <div className="bubble">
                              <p>{c.text}</p>
                              {/* {c.user !== "system" && (
                                <span className="time">
                                  {new Date().toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )} */}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="chat-input">
                      <form
                        action=""
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage();
                        }}
                      >
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Type message..."
                          required
                        />
                        <button>Send</button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              <div className="data-area">
                <div className="upload-box">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`drop-zone ${isDragging ? "dragging" : ""}`}
                  >
                    <input
                      type="file"
                      onChange={sendFile}
                      id="customFile"
                      className="file-send-input"
                    />
                    <label htmlFor="customFile">
                      <img src={UploadIcon} alt="Upload Icon" />
                      <p>{isDragging ? "Upload" : "Upload"}</p>
                    </label>
                  </div>
                </div>

                {Object.keys(uploadProgress).length > 0 && (
                  <div className="progress-area">
                    <h3>Sending...</h3>
                    <ul>
                      {Object.keys(uploadProgress).map((fileName) => (
                        <li key={fileName}>
                          <div className="progress-detail">
                            <p>{fileName}</p>
                            <span>{uploadProgress[fileName]}%</span>
                          </div>
                          <progress
                            value={uploadProgress[fileName]}
                            max="100"
                          ></progress>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Object.keys(downloadProgress).length > 0 && (
                  <div className="progress-area">
                    <h3>Receiving...</h3>
                    <ul>
                      {Object.keys(downloadProgress).map((fileName) => (
                        <li key={fileName}>
                          <div className="progress-detail">
                            <p>{fileName}</p>
                            <span>{downloadProgress[fileName]}%</span>
                          </div>
                          <progress
                            value={downloadProgress[fileName]}
                            max="100"
                          ></progress>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div
                  className={`data-blocks ${chatEnable ? "col-layout" : ""}`}
                >
                  <div className="data-block">
                    <div className="title">
                      <span>
                        <h3>Send Files</h3>
                      </span>
                      <span className="block-icon">
                        <img src={SendIcon} alt="Send Icon" />
                      </span>
                    </div>
                    <div className="list-file">
                      <ul>
                        {sentFiles.length !== 0 ? (
                          sentFiles.map((f, i) => (
                            <div className="list-item">
                              <li key={i} className="sended">
                                <p>{i + 1}.</p>
                                <p className="text-ellipsis">{f.fileName}</p>
                              </li>
                              <div className="seperator"></div>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="no-data">
                              <h3>No Send Data Present</h3>
                            </div>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="data-block">
                    <div className="title">
                      <span>
                        <h3>Receive Files</h3>
                      </span>
                      <span className="block-icon">
                        <img src={ReceivedIcon} alt="Send Icon" />
                      </span>
                    </div>
                    <div className="list-file">
                      <ul>
                        {receivedFiles.length !== 0 ? (
                          receivedFiles.map((f, i) => (
                            <div className="list-item">
                              <li key={i} className="received">
                                <div className="r-file-info">
                                  <p>{i + 1}.</p>
                                  <p className="text-ellipsis">{f.fileName}</p>
                                </div>
                                <a href={f.url} download={f.fileName}>
                                  <img src={DownloadIcon} alt="Download Icon" />
                                </a>
                              </li>
                              <div className="seperator"></div>
                            </div>
                          ))
                        ) : (
                          <div className="no-data">
                            <h3>No Received Data Present</h3>
                          </div>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sidebar-user-details">
              <ul>
                {users.map((user) => (
                  <li
                    key={user.id}
                    className={`sidebar-user  ${
                      user.id === socket ? "me" : ""
                    }`}
                  >
                    {user.id === socket
                      ? loggedInUser
                        ? `(${user.id.slice(0, 3)}) ${loggedInUser.name}`
                        : "Me"
                      : `User ${user.id.slice(0, 3)}`}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {toggleSendBlock && (
          <>
            <SaveSentData
              toggleSendBlockFunction={toggleSendBlockFunction}
              loggedInUser={loggedInUser}
              setLoggedInUser={setLoggedInUser}
              // deleteFromSent={deleteFromSent}
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

export default Room;
