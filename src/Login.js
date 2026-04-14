import { useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbzjznc0s5r8WB19L5IBOVtBx78y337B1_nhNsFpsrrbE4RaH3MZ0zKJfHUlXKIB_DmS/exec";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const cleanPhone = String(phone || "").trim();
    const cleanName = String(name || "").trim();

    setError("");

    if (!cleanPhone) {
      setError("Enter phone number");
      return;
    }

    if (mode === "register" && !cleanName) {
      setError("Enter name");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "getUsers" }),
        });

        const users = await res.json();

        if (!Array.isArray(users)) {
          setError("Could not load users");
          setLoading(false);
          return;
        }

        const user = users.find(
          (u) => String(u.phone || "").trim() === cleanPhone
        );

        if (!user) {
          setError("Phone not found");
          setLoading(false);
          return;
        }

        localStorage.setItem("currentUser", JSON.stringify(user));
        onLogin(user);
      } else {
        const checkRes = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "getUsers" }),
        });

        const users = await checkRes.json();

        if (Array.isArray(users)) {
          const existing = users.find(
            (u) => String(u.phone || "").trim() === cleanPhone
          );

          if (existing) {
            localStorage.setItem("currentUser", JSON.stringify(existing));
            onLogin(existing);
            setLoading(false);
            return;
          }
        }

        const createRes = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "addUser",
            name: cleanName,
            phone: cleanPhone,
          }),
        });

        const createResult = await createRes.json();

        if (!createResult?.success) {
          setError("Could not register user");
          setLoading(false);
          return;
        }

        const reloadRes = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "getUsers" }),
        });

        const reloadedUsers = await reloadRes.json();

        if (!Array.isArray(reloadedUsers)) {
          setError("User created, but could not log in");
          setLoading(false);
          return;
        }

        const newUser = reloadedUsers.find(
          (u) => String(u.phone || "").trim() === cleanPhone
        );

        if (!newUser) {
          setError("User created, but could not find account");
          setLoading(false);
          return;
        }

        localStorage.setItem("currentUser", JSON.stringify(newUser));
        onLogin(newUser);
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="login-screen">
      <img src="logo/aalogo.png" alt="AA HOME PRO" className="logo" />
      <h2 className="title">PROJECTS</h2>

      <div className="login-card">
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Log in
          </button>

          <button
            type="button"
            className={`login-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {mode === "register" && (
          <input
            className="login-input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          className="login-input"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button
          type="button"
          className="login-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Please wait..." : "Enter"}
        </button>

        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}
