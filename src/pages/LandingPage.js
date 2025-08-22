import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api";

export default function LandingPage({ user }) {
  const [gamesByWeek, setGamesByWeek] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [hasSavedPicks, setHasSavedPicks] = useState(false);
  const [checkingPicks, setCheckingPicks] = useState(false);
  const navigate = useNavigate();

  // Fetch current week from server
  const fetchCurrentWeekFromServer = async () => {
    try {
      const r = await axios.get(`${API_BASE}/current-week`);
      if (r.data?.currentWeek != null) return Number(r.data.currentWeek);
    } catch (err) {
      console.error("Error fetching current week:", err);
    }
    return null;
  };

  // Fetch games and determine current week
  useEffect(() => {
    const fetchGamesAndCurrentWeek = async () => {
      try {
        const res = await axios.get(`${API_BASE}/games`);
        const grouped = res.data.reduce((acc, game) => {
          const week = Number(game.week_id);
          if (!acc[week]) acc[week] = [];
          acc[week].push(game);
          return acc;
        }, {});

        Object.keys(grouped).forEach((wk) => {
          grouped[wk].sort((a, b) => new Date(a.game_date) - new Date(b.game_date));
        });

        setGamesByWeek(grouped);

        // Determine active week
        let activeWeek = await fetchCurrentWeekFromServer();
        if (!activeWeek) {
          const now = new Date();
          const weeksSorted = Object.keys(grouped).map(Number).sort((a, b) => a - b);

          // default to first week
          activeWeek = weeksSorted[0];

          // check for the latest week where start_date <= now
          for (let wk of weeksSorted) {
            const weekStart = new Date(grouped[wk][0].game_date); // first game date = start_date
            if (now >= weekStart) activeWeek = wk;
            else break;
          }
        }

        setCurrentWeek(activeWeek);
      } catch (err) {
        console.error(err);
        setError("Failed to load games");
      } finally {
        setLoading(false);
      }
    };

    fetchGamesAndCurrentWeek();
  }, []);

  // Check if user has saved picks for current week
  useEffect(() => {
    const checkStatus = async () => {
      if (!user || !currentWeek) return;
      setCheckingPicks(true);
      try {
        const res = await axios.get(`${API_BASE}/picks-status?userId=${user.id}&week=${currentWeek}&_=${Date.now()}`);
        setHasSavedPicks(!!res.data?.hasPicks);
      } catch (err) {
        console.error("Error checking picks-status:", err);
        setHasSavedPicks(false);
      } finally {
        setCheckingPicks(false);
      }
    };
    checkStatus();
  }, [user, currentWeek]);

  if (loading) return <p>Loading games...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const availableWeeks = Object.keys(gamesByWeek).map(Number).sort((a, b) => a - b);

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>NFL 2025 Season Games</h1>

      {user && currentWeek && gamesByWeek[currentWeek]?.length > 0 && (
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
            <button
              disabled={checkingPicks}
              onClick={() =>
                navigate(
                  hasSavedPicks
                    ? `/view-picks?week=${currentWeek}`
                    : `/picks?week=${currentWeek}`
                )
              }
              style={{
                padding: "10px 20px",
                backgroundColor: "#0078d7",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontWeight: "600",
                cursor: checkingPicks ? "not-allowed" : "pointer",
                opacity: checkingPicks ? 0.8 : 1,
              }}
            >
              {hasSavedPicks
                ? `View Your Picks for Week ${currentWeek}`
                : `Make Picks for Week ${currentWeek}`}
            </button>

            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#0078d7",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => navigate("/results")}
            >
              View Your Season Results
            </button>

            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#0078d7",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => navigate("/leaderboard")}
            >
              View Leaderboard (Week {currentWeek})
            </button>
          </div>
          {!hasSavedPicks && checkingPicks && (
            <div style={{ marginTop: 8, color: "#666" }}>Checking your picks…</div>
          )}
        </div>
      )}

      {/* Full schedule display */}
      {availableWeeks.map((week) => (
        <div key={week} style={{ marginBottom: 40 }}>
          <h2 style={{ borderBottom: "2px solid #0078d7", paddingBottom: 6, color: "#0078d7" }}>
            Week {week}
          </h2>

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <table style={{ width: "850px", margin: "auto", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "30%" }} />
                <col style={{ width: "35%" }} />
                <col style={{ width: "35%" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0", textAlign: "center" }}>
                  <th style={{ padding: "12px 16px" }}>Date / Time</th>
                  <th style={{ padding: "12px 16px" }}>Home Team</th>
                  <th style={{ padding: "12px 16px" }}>Away Team</th>
                </tr>
              </thead>
              <tbody>
                {gamesByWeek[week].map((game) => (
                  <tr key={game.game_code} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "12px 16px" }}>
                      {new Date(game.game_date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                        timeZone: "America/New_York",
                      })}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "600" }}>{game.home_team}</td>
                    <td style={{ padding: "12px 16px" }}>{game.away_team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {gamesByWeek[week][0]?.bye_teams?.length > 0 && (
            <p style={{ marginTop: 10, fontStyle: "italic", color: "#555", textAlign: "center" }}>
              Byes: {gamesByWeek[week][0].bye_teams.join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
