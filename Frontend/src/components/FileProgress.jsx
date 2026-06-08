import React from "react";

const FileProgress = ({ title, progress }) => {
  if (Object.keys(progress).length === 0) return null;

  return (
    <div className="progress-area">
      <h3>{title}</h3>
      <ul>
        {Object.keys(progress).map((fileName) => (
          <li key={fileName}>
            <div className="progress-detail">
              <p>{fileName}</p>
              <span>{progress[fileName]}%</span>
            </div>
            <progress value={progress[fileName]} max="100"></progress>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileProgress;
