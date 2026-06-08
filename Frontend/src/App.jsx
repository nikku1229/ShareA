import { useEffect } from "react";
import { useApp } from "./context/AppContext";
import { SocketProvider } from "./context/SocketContext";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Toast from "./components/Toast";
import "./index.css";

const AppContent = () => {
  const { joinedRoom, popUp } = useApp();

  useEffect(() => {
    const API_BASE =
      import.meta.env.VITE_Backend_URl ||
      import.meta.env.VITE_Local_Backend_URL ||
      "http://localhost:5000";
    fetch(`${API_BASE}/api`).catch((err) =>
      console.error("Frontend error:", err),
    );
  }, []);

  return (
    <>
      {!joinedRoom ? <Home /> : <Room />}
      {popUp && <Toast popUp={popUp} />}
    </>
  );
};

function App() {
  return <AppContent />;
}

export default App;
