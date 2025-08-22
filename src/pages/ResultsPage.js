import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../api";

export default function ResultsPage({ user }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchResults() {
      try {
        // Fetch all weeks (remove week filter)
        const res = await axios.get(`${API_BASE}/user-saved-picks`, { params: { userId: user.id } });

        if (!res.data || res.data.length === 0) {
          setResults([]);
          return;
        }

        const gameIds = res.data.map((p) => p.game_id);
        const gameResultsRes = await axios.get(`${API_BASE}/game-results`, {
          params: { gameIds: gameIds.join(",") },
        });


        const combined = res.data.map((pick) => {
          const gameResult = gameResultsRes.data.find(
            (g) => g.game_id === pick.game_id
          );
          return {
            ...pick,
            week: pick.week, // Make sure week info is included
            winner_team: gameResult?.winner_team || null,
            home_score: gameResult?.home_score ?? null,
            away_score: gameResult?.away_score ?? null,
            home_team: gameResult?.home_team || pick.home_team,
            away_team: gameResult?.away_team || pick.away_team,
            game_date: gameResult?.game_date || pick.game_date,
          };
        });

        setResults(combined);
      } catch (err) {
        console.error("Error fetching results:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [user]);

  if (loading) return <p>Loading results...</p>;
  if (results.length === 0) return <p>No results found.</p>;

  // Group results by week
  const weeks = [...new Set(results.map((r) => r.week))].sort((a, b) => a - b);

  // Calculate grand total
  const grandTotalCorrect = results.filter(
    (g) => g.picked_team === g.winner_team
  ).length;
  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      {/* Top bar with back button on left and grand total on right */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <button
          style={{
            padding: "8px 16px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          ⬅ Back to Home Page
        </button>

        <h2 style={{ color: "rgba(0, 0, 0, 1)", margin: 0 }}>
          Grand Total: {grandTotalCorrect} / {results.length} correct overall!
        </h2>
      </div>

      {/* Weeks in reverse order (latest first) */}
      {weeks
        .slice() // create a shallow copy so we don't mutate original
        .sort((a, b) => b - a) // reverse order
        .map((week) => {
          const weekResults = results.filter((r) => r.week === week);
          const correctCount = weekResults.filter(
            (g) => g.picked_team === g.winner_team
          ).length;

          return (
            <div key={week} style={{ marginBottom: 40 }}>
              <h1>Week {week} Results</h1>
              <h2 style={{ color: "rgba(0, 0, 0, 1)", marginBottom: 20 }}>
                You got {correctCount} / {weekResults.length} correct for Week {week}!
              </h2>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Date / Time (ET)</th>
                    <th style={{ padding: "8px" }}>Home Team</th>
                    <th style={{ padding: "8px" }}>Away Team</th>
                    <th style={{ padding: "8px" }}>Your Pick</th>
                    <th style={{ padding: "8px" }}>Winner</th>
                    <th style={{ padding: "8px" }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {weekResults.map((game) => (
                    <tr
                      key={game.game_id}
                      style={{
                        borderBottom: "1px solid #ddd",
                        backgroundColor:
                          game.picked_team === game.winner_team
                            ? "#d4edda"
                            : "#f8d7da",
                      }}
                    >
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
                      <td style={{ padding: "8px", fontWeight: "600" }}>
                        {game.home_team}
                      </td>
                      <td style={{ padding: "8px" }}>{game.away_team}</td>
                      <td style={{ padding: "8px" }}>{game.picked_team}</td>
                      <td style={{ padding: "8px" }}>{game.winner_team}</td>
                      <td style={{ padding: "8px" }}>
                        {game.home_score ?? "-"} - {game.away_score ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
    </div>
  );
}
