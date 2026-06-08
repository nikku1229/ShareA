import React from "react";
import { useApp } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import LeaveIcon from "../assets/Icons/LeaveIcon.svg";

const ChatBox = ({ onClose }) => {
  const { chat, message, setMessage, roomCode } = useApp();
  const { socket } = useSocket();

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { roomCode, msg: message });
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      <div className="chatbox-block">
        <div className="chat-title">
          <div className="space-column"></div>
          <div className="title-column">
            <h2>Chat Here</h2>
          </div>
          <div className="chat-toggle-column" onClick={onClose}>
            <img src={LeaveIcon} alt="Close Chat" />
          </div>
        </div>

        <div className="chat-box">
          <div className="chat-display">
            {chat.map((c, i) => (
              <div
                key={i}
                className={`chat-message ${c.user === "system" ? "system" : c.user === socket.id ? "me" : "other"}`}
              >
                <div className="bubble">
                  <p>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-input">
          <form
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
  );
};

export default ChatBox;
