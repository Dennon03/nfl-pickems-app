import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE } from "../api";

export default function PicksPage({ user }) {
  const [searchParams] = useSearchParams();
  const weekParam = Number(searchParams.get("week"));
  const [week, setWeek] = useState(weekParam || null);

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [picks, setPicks] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWeekIfNotSet = async () => {
      if (!week) {
        try {
          // Fetch current week from server
          const res = await axios.get(`${API_BASE}/current-week`);
          setWeek(res.data.week);
        } catch (err) {
          console.error("Failed to fetch current week, defaulting to 1");
          setWeek(1);
        }
      }
    };
    fetchWeekIfNotSet();
  }, [week]);

  useEffect(() => {
    if (!week) return; // Wait until week is determined

    const fetchGames = async () => {
      try {
        const res = await axios.get(`${API_BASE}/games`, { params: { week } });
        setGames(res.data);
      } catch (err) {
        setError("Failed to load games");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [week]);

  const now = new Date();
  const firstGameStart = games.length
    ? new Date(Math.min(...games.map((g) => new Date(g.game_date))))
    : null;
  const picksDisabled = firstGameStart && now >= firstGameStart;

  const handlePickChange = (gameCode, team) => {
    if (picksDisabled) return;
    setPicks((prev) => ({ ...prev, [gameCode]: team }));
  };

  const savePicks = async () => {
    if (!user || !user.id) {
      alert("User not logged in!");
      return;
    }

    if (Object.keys(picks).length !== games.length) {
      alert("It looks like you forgot to pick a game!");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_BASE}/save-picks`, {
        userId: user.id,
        week,
        picks,
      });
      navigate(`/view-picks?week=${week}`);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        alert(err.response.data.error || "Picks are locked for this week.");
      } else {
        alert("Failed to save picks. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !week) return <p>Loading games...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h1>Make Your Picks - Week {week}</h1>
      {picksDisabled && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          Picking is closed for this week.
        </p>
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
          {games.map((game) => (
            <tr key={game.game_code} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px" }}>
                {new Date(game.game_date).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                  timeZone: "America/New_York",
                })}
              </td>
              <td style={{ padding: "8px", fontWeight: "600" }}>{game.home_team}</td>
              <td style={{ padding: "8px" }}>{game.away_team}</td>
              <td style={{ padding: "8px" }}>
                <select
                  disabled={picksDisabled || saving}
                  value={picks[game.game_code] || ""}
                  onChange={(e) => handlePickChange(game.game_code, e.target.value)}
                >
                  <option value="" disabled>
                    Select winner
                  </option>
                  <option value={game.home_team}>{game.home_team}</option>
                  <option value={game.away_team}>{game.away_team}</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!picksDisabled && (
        <button
          onClick={savePicks}
          disabled={saving}
          style={{ marginTop: 20, padding: "10px 20px", fontSize: 16 }}
        >
          {saving ? "Saving..." : "Save Picks"}
        </button>
      )}
    </div>
  );
}
