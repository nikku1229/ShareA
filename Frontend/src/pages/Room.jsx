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
    sentFiles,
    receivedFiles,
    uploadProgress,
    downloadProgress,
    showToast,
  } = useApp();

  const { leaveRoom } = useRoom();
  const { sendFiles, getQueueStatus, activeUploads, queuedFiles } =
    useFileTransfer();
  const { disconnectSocket } = useSocket();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatEnable, setChatEnable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toggleSendBlock, setToggleSendBlock] = useState(false);
  const [toggleReceivedBlock, setToggleReceivedBlock] = useState(false);
  const [queueInfo, setQueueInfo] = useState({ queued: 0, active: 0 });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem("loggedInUser");
    if (raw) setLoggedInUser(JSON.parse(raw));
  }, [setLoggedInUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      const status = getQueueStatus();
      setQueueInfo(status);
    }, 500);

    return () => clearInterval(interval);
  }, [getQueueStatus]);

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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      sendFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      sendFiles(files);
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
                    multiple
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
                      {sentFiles.length !== 0 ? (
                        sentFiles.slice().map((f, i) => (
                          <div key={f.transferId || i} className="list-item">
                            <li className="sended">
                              <p>{sentFiles.length - i}.</p>
                              <p className="text-ellipsis" title={f.fileName}>
                                {f.fileName.length > 30
                                  ? f.fileName.substring(0, 27) + "..."
                                  : f.fileName}
                              </p>
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
                      {receivedFiles.length !== 0 ? (
                        receivedFiles.slice().map((f, i) => (
                          <div key={f.transferId || i} className="list-item">
                            <li className="received">
                              <div className="r-file-info">
                                <p>{receivedFiles.length - i}.</p>
                                <p className="text-ellipsis" title={f.fileName}>
                                  {f.fileName.length > 30
                                    ? f.fileName.substring(0, 27) + "..."
                                    : f.fileName}
                                </p>
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
