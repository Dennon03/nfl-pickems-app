import React, { useState } from "react";
import axios from "axios";
import nflBackground from "../images/nflBackground.jpg";
import { API_BASE } from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Username cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE}/login`, { username: trimmedUsername });
      console.log(res.data); // debug
      onLogin(res.data);
    } catch (err) {
      console.error(err); // debug full error
      if (err.response?.status === 404 && err.response.data?.canCreate) {
        if (window.confirm(`User "${trimmedUsername}" not found. Create new account?`)) {
          try {
            const createRes = await axios.post(`${API_BASE}/create-user`, { username: trimmedUsername });
            onLogin(createRes.data);
          } catch (createErr) {
            console.error(createErr);
            setError(createErr.response?.data?.error || "Failed to create user. Please try again.");
          }
        } else {
          setError("Login cancelled. Please enter a valid username.");
        }
      } else {
        console.error(err);
        setError(err.response?.data?.error || "Failed to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Background image */}
      <img
        src={nflBackground}
        alt="Background"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill", 
          zIndex: -1,
        }}
      />

      {/* Login form */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <h2 style={{ color: "#ffffffff",fontSize: "4rem" , textShadow: "2px 2px 4px rgba(0,0,0,0.7)" }}>Login</h2>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
          placeholder="Enter username"
          disabled={loading}
          style={{
            padding: "10px 15px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            outline: "none",
            width: "250px",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            color: "#000",
            fontSize: "16px",
            textAlign: "center",
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "hsla(24, 100%, 50%, 1.00)",
            color: "#fff",
            fontSize: "16px",
            cursor: "pointer",
            width: "150px",
          }}
        >
          {loading ? "Joining..." : "Join Game"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "10px", fontWeight: "bold" }}>{error}</p>
        )}
      </div>
    </div>
  );
}
