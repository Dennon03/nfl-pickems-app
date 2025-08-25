import React, { useState } from "react";
import nflBackground from "../images/nflBackground.jpg";
import { supabase } from "../supabaseClient";

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
      const { data, error: selectError } = await supabase
        .from("users")
        .select("*")
        .eq("username", trimmedUsername)
        .maybeSingle();

      if (selectError) {
        setError(selectError.message);
        return;
      }

      let user = data;

      if (!user) {
        const create = window.confirm(
          `Username "${trimmedUsername}" not found. Would you like to create a new account?`
        );
        if (!create) return;

        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert([{ username: trimmedUsername }])
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
          return;
        }

        user = newUser;
      }

      onLogin(user);
    } catch (err) {
      console.error(err);
      setError("Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <img
        src={nflBackground}
        alt="Background"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
        }}
      />

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
          padding: "0 20px",
          gap: "1rem",
        }}
      >
        <h2
          style={{
            color: "#fff",
            fontSize: "3rem",
            textAlign: "center",
            textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
            margin: 0,
          }}
        >
          Login
        </h2>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
          placeholder="Enter username"
          disabled={loading}
          style={{
            padding: "12px 15px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            outline: "none",
            width: "80%",
            maxWidth: "400px",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            color: "#000",
            fontSize: "1rem",
            textAlign: "center",
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#ff6600",
            color: "#fff",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            width: "80%",
            maxWidth: "250px",
          }}
        >
          {loading ? "Joining..." : "Join Game"}
        </button>

        {error && (
          <p
            style={{
              color: "red",
              marginTop: "10px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
