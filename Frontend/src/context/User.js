function users() {
  try {
    const raw = localStorage.getItem("loggedInUser");
    if (!raw) return; // no user stored yet
    const userDetail = JSON.parse(raw);
    if (userDetail) {
      const normalized = {
        ...userDetail,
        data: {
          saveSentData: userDetail.data?.saveSentData || [],
          saveReceivedData: userDetail.data?.saveReceivedData || [],
        },
      };
      return normalized;
    }
    return userDetail;
  } catch (err) {
    console.error("Failed parsing loggedInUser from localStorage:", err);

    return err;
  }
}

export default users();
