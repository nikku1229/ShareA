import React, { createContext, useContext, useState, useEffect } from "react";
import socket from "../socket";
import getUsers from "./User";

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [roomCode, setRoomCode] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [sentFiles, setSentFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [joinedRoomPassword, setJoinedRoomPassword] = useState("");
  const [createRoomPassword, setCreateRoomPassword] = useState("");
  const [error, setError] = useState("");
  const [popUp, setPopUp] = useState("");
  const [usersList, setUsersList] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    const user = getUsers();
    if (user) setLoggedInUser(user);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const user = getUsers();
      if (user) setLoggedInUser(user);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const showToast = (message, type = "info") => {
    const prefix = type === "success" ? "✅" : type === "error" ? "❌" : "🔔";
    setPopUp(`${prefix} ${message}`);
    setTimeout(() => setPopUp(""), 2000);
  };

  const showNotification = (title, body) => {
    showToast(`${title}: ${body}`);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  const value = {
    roomCode,
    setRoomCode,
    joinedRoom,
    setJoinedRoom,
    message,
    setMessage,
    chat,
    setChat,
    receivedFiles,
    setReceivedFiles,
    sentFiles,
    setSentFiles,
    uploadProgress,
    setUploadProgress,
    downloadProgress,
    setDownloadProgress,
    joinedRoomPassword,
    setJoinedRoomPassword,
    createRoomPassword,
    setCreateRoomPassword,
    error,
    setError,
    usersList,
    setUsersList,
    loggedInUser,
    setLoggedInUser,
    popUp,
    showToast,
    showNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
