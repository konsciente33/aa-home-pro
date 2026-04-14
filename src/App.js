import { useState, useEffect } from "react";
import Login from "./Login";
import Worker from "./Worker";
import Admin from "./Admin";
import "./styles.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("worker");

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    setView("worker");
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div>
      <div className="top-bar">
        <span className="user-pill">
          {user.name} • {user.phone}
        </span>

        <button className="logout-btn" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <div className="top-switch">
        <button
          className={`switch-btn ${view === "worker" ? "active" : ""}`}
          onClick={() => setView("worker")}
        >
          Worker
        </button>

        <button
          className={`switch-btn ${view === "admin" ? "active" : ""}`}
          onClick={() => setView("admin")}
        >
          Admin
        </button>
      </div>

      {view === "worker" ? <Worker currentUser={user} /> : <Admin />}
    </div>
  );
}
