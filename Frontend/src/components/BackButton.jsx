import React from "react";
import { Link } from "react-router-dom";

function BackButton() {
  return (
    <>
      <Link to="/">
        <div className="back-button">
          <p>Back</p>
        </div>
      </Link>
    </>
  );
}

export default BackButton;
