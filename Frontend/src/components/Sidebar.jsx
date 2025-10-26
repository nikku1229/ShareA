import React from "react";
import SidebarCloseIcon from "../assets/Icons/SidebarCloseIcon.svg";
import { Link } from "react-router-dom";

function Sidebar({ sidebarToggle }) {
  return (
    <>
      <div className="sidebar-section">
        <div className="toggle-sidebar-btn">
          <div className="sidebar-close-btn" onClick={sidebarToggle}>
            <img src={SidebarCloseIcon} alt="Sidebar Close Icon" />
          </div>
        </div>

        <div className="sidebar-links">
          <ul>
            <li><Link>Send Files</Link></li>
            <li><Link>Received Files</Link></li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
