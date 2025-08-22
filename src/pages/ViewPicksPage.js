import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../api";

export default function ViewPicksPage({ user }) {
  const [savedPicks, setSavedPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false); 
  

  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const week = query.get("week") || 1;

  useEffect(() => {
    const fetchSavedPicks = async () => {
      try {
        const res = await axios.get(`${API_BASE}/user-saved-picks`, {
          params: { userId: user.id, week },
        });
        setSavedPicks(res.data);
      } catch (err) {
        setError("Failed to load saved picks");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedPicks();
  }, [user.id, week]);

  const handlePickChange = (gameId, newPick) => {
    setSavedPicks((prev) =>
      prev.map((pick) =>
        pick.game_id === gameId ? { ...pick, picked_team: newPick } : pick
      )
    );
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const picksPayload = {};
      savedPicks.forEach((pick) => {
        picksPayload[pick.game_id] = pick.picked_team;
      });

      await axios.post(`${API_BASE}/save-picks`, {
        userId: user.id,
        week: Number(week),
        picks: picksPayload,
      });

      alert("Picks updated successfully!");
      setEditing(false); // exit edit mode
    } catch (err) {
      console.error("Error saving picks:", err);
      alert("Failed to save picks.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading saved picks...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: 20,
          padding: "8px 16px",
          backgroundColor: "#0078d7",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        &larr; Back to Home Page
      </button>

      <h1>Your Picks - Week {week}</h1>

      {!editing && (
        <button
          onClick={() => setEditing(true)}
          style={{
            marginBottom: 20,
            padding: "8px 16px",
            backgroundColor: "#ffc107",
            color: "black",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Edit Picks
        </button>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0", textAlign: "left" }}>
            <th style={{ padding: "8px" }}>Date / Time (ET)</th>
            <th style={{ padding: "8px" }}>Home Team</th>
            <th style={{ padding: "8px" }}>Away Team</th>
            <th style={{ padding: "8px" }}>Your Pick</th>
          </tr>
        </thead>
        <tbody>
          {savedPicks.map((pick) => (
            <tr key={pick.game_id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px" }}>
                {new Date(pick.game_date).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                  timeZone: "America/New_York",
                })}
              </td>
              <td style={{ padding: "8px" }}>{pick.home_team}</td>
              <td style={{ padding: "8px" }}>{pick.away_team}</td>
              <td style={{ padding: "8px", fontWeight: 600, color: "#0078d7" }}>
                {editing ? (
                  <select
                    value={pick.picked_team}
                    onChange={(e) =>
                      handlePickChange(pick.game_id, e.target.value)
                    }
                  >
                    <option value={pick.home_team}>{pick.home_team}</option>
                    <option value={pick.away_team}>{pick.away_team}</option>
                  </select>
                ) : (
                  pick.picked_team
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={saveChanges}
            disabled={saving}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
