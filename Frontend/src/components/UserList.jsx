import React from "react";
import { useApp } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";

const UserList = () => {
  const { usersList, loggedInUser } = useApp();
  const { socket } = useSocket();

  return (
    <div className="sidebar-user-details">
      <ul>
        {usersList.map((user) => (
          <li
            key={user.id}
            className={`sidebar-user ${user.id === socket.id ? "me" : ""}`}
          >
            {user.id === socket.id
              ? loggedInUser
                ? `(${user.id.slice(0, 3)}) ${loggedInUser.name}`
                : "Me"
              : `User ${user.id.slice(0, 3)}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
