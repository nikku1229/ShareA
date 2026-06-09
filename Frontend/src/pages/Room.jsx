import React, { useState, useEffect, useCallback, useRef } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import FileProgress from "../components/FileProgress";
import UserList from "../components/UserList";
import SaveReceivedData from "../components/SaveReceivedData";
import SaveSentData from "../components/SaveSentData";
import { useApp } from "../context/AppContext";
import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../context/SocketContext";
import { useFileTransfer } from "../hooks/useFileTransfer";
import CopyIcon from "../assets/Icons/CopyIcon.svg";
import LeaveIcon from "../assets/Icons/LeaveIcon.svg";
import HamburgerIcon from "../assets/Icons/HamburgerIcon.svg";
import UploadIcon from "../assets/Icons/UploadIcon.svg";
import SendIcon from "../assets/Icons/SendIcon.svg";
import ReceivedIcon from "../assets/Icons/ReceivedIcon.svg";
import DownloadIcon from "../assets/Icons/DownloadIcon.svg";

function Room() {
  const {
    loggedInUser,
    setLoggedInUser,
    roomCode,
    joinedRoom,
    setPopUp,
    sentFiles,
    receivedFiles,
    uploadProgress,
    downloadProgress,
    showToast,
  } = useApp();

  const { leaveRoom } = useRoom();
  const { sendFile } = useFileTransfer();
  const { disconnectSocket } = useSocket();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatEnable, setChatEnable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toggleSendBlock, setToggleSendBlock] = useState(false);
  const [toggleReceivedBlock, setToggleReceivedBlock] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem("loggedInUser");
    if (raw) setLoggedInUser(JSON.parse(raw));
  }, [setLoggedInUser]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnectSocket();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [disconnectSocket]);

  const logoutUser = () => {
    localStorage.removeItem("loggedInUser");
    setLoggedInUser(null);
    disconnectSocket();
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    showToast("Room code copied!", "success");
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
    if (file) {
      sendFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      sendFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container">
      <Header loggedInUser={loggedInUser} logoutUser={logoutUser} />

      {sidebarOpen ? (
        <Sidebar
          sidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          joinedRoom={joinedRoom}
          chatToggle={() => setChatEnable(!chatEnable)}
          toggleSendBlockFunction={() => {
            setToggleReceivedBlock(false);
            setToggleSendBlock(!toggleSendBlock);
            setSidebarOpen(false);
          }}
          toggleReceivedBlockFunction={() => {
            setToggleSendBlock(false);
            setToggleReceivedBlock(!toggleReceivedBlock);
            setSidebarOpen(false);
          }}
        />
      ) : (
        <div
          className="sidebar-hamburger-icon"
          onClick={() => setSidebarOpen(true)}
        >
          <img src={HamburgerIcon} alt="Menu" />
        </div>
      )}

      <div className="leave-room-btn">
        <button onClick={leaveRoom}>
          <img src={LeaveIcon} alt="Leave" />
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
                <span onClick={copyRoomCode}>
                  <img src={CopyIcon} alt="Copy" />
                </span>
              </h1>
            </div>
          </div>

          <div className="room-area">
            {chatEnable && <ChatBox onClose={() => setChatEnable(false)} />}

            <div className="data-area">
              <div className="upload-box">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`drop-zone ${isDragging ? "dragging" : ""}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    id="customFile"
                    className="file-send-input"
                  />
                  <label htmlFor="customFile">
                    <img src={UploadIcon} alt="Upload" />
                    <p>{isDragging ? "Drop here" : "Upload"}</p>
                  </label>
                </div>
              </div>

              <FileProgress title="Sending..." progress={uploadProgress} />
              <FileProgress title="Receiving..." progress={downloadProgress} />

              <div className={`data-blocks ${chatEnable ? "col-layout" : ""}`}>
                <div className="data-block">
                  <div className="title">
                    <h3>Send Files</h3>
                    <div className="block-icon">
                      <img src={SendIcon} alt="Send" />
                    </div>
                  </div>
                  <div className="list-file">
                    <ul>
                      {sentFiles.length ? (
                        sentFiles.map((f, i) => (
                          <div key={i} className="list-item">
                            <li className="sended">
                              <p>{i + 1}.</p>
                              <p className="text-ellipsis">{f.fileName}</p>
                            </li>
                            <div className="seperator"></div>
                          </div>
                        ))
                      ) : (
                        <div className="no-data">
                          <p>No Send Data Present</p>
                        </div>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="data-block">
                  <div className="title">
                    <h3>Receive Files</h3>
                    <div className="block-icon">
                      <img src={ReceivedIcon} alt="Receive" />
                    </div>
                  </div>
                  <div className="list-file">
                    <ul>
                      {receivedFiles.length ? (
                        receivedFiles.map((f, i) => (
                          <div key={i} className="list-item">
                            <li className="received">
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
                          <p>No Received Data Present</p>
                        </div>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <UserList />
        </>
      )}

      {toggleSendBlock && (
        <SaveSentData
          toggleSendBlockFunction={() => setToggleSendBlock(false)}
          loggedInUser={loggedInUser}
          setLoggedInUser={setLoggedInUser}
        />
      )}
      {toggleReceivedBlock && (
        <SaveReceivedData
          toggleReceivedBlockFunction={() => setToggleReceivedBlock(false)}
          loggedInUser={loggedInUser}
          setLoggedInUser={setLoggedInUser}
        />
      )}
    </div>
  );
}

export default Room;
