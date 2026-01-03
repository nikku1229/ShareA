import React, { useEffect } from "react";
import SidebarCloseIcon from "../assets/Icons/SidebarCloseIcon.svg";
import CrossIcon from "../assets/Icons/CrossIcon.svg";

function SaveReceivedData({
  toggleReceivedBlockFunction,
  loggedInUser,
  setLoggedInUser,
}) {
  const deleteFromReceive = (index) => () => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (!raw) return;

      const user = JSON.parse(raw);
      const updatedReceivedData = [...(user.data?.saveReceivedData || [])];
      updatedReceivedData.splice(index, 1);
      const updatedUser = {
        ...user,
        data: {
          saveReceivedData: updatedReceivedData,
          saveSentData: user.data?.saveSentData || [],
        },
      };
      setLoggedInUser(updatedUser);
      localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("❌ Error deleting received file:", err);
    }
  };

  return (
    <>
      <div className="save-data-block">
        <div className="top-head">
          <div className="column-1"></div>
          <div className="column-2">
            <h2>Received Files</h2>
          </div>
          <div className="column-3">
            <div className="close-btn" onClick={toggleReceivedBlockFunction}>
              <img src={SidebarCloseIcon} alt="Close" />
            </div>
          </div>
        </div>

        <div className="data-area">
          <ul>
            {!loggedInUser ? (
              <>
                <div className="no-data-area">
                  <h2>You have to login to save data.</h2>
                  <p>
                    <strong>Note: </strong>Data will be removed after logout.
                  </p>
                </div>
              </>
            ) : (
              <>
                {loggedInUser?.data?.saveReceivedData?.length === 0 ? (
                  <div className="no-data-area">
                    <h2>No received files yet.</h2>
                  </div>
                ) : (
                  <>
                    {loggedInUser?.data?.saveReceivedData?.map(
                      (item, index) => (
                        <>
                          <li key={index}>
                            <div className="index-space">
                              <p className="index">{index + 1}.</p>
                              <p className="file">{item.FileName}</p>
                            </div>
                            <span>{item.FileSize} bytes</span>
                            <p className="index-room">{item.RoomCode}</p>
                            <span
                              className="img-span"
                              onClick={deleteFromReceive(index)}
                            >
                              <img src={CrossIcon} alt="Delete" />
                            </span>
                          </li>
                          <div className="seperator"></div>
                        </>
                      )
                    )}
                  </>
                )}
              </>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

export default SaveReceivedData;
