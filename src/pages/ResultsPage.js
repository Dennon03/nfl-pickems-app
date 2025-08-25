import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResultsPage({ user }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data: picksData, error: picksError } = await supabase
          .from("user_picks")
          .select("game_id, picked_team, week")
          .eq("user_id", user.id);

        if (picksError) throw picksError;
        if (!picksData || picksData.length === 0) {
          setResults([]);
          return;
        }

        const gameIds = picksData.map((p) => p.game_id);
        const { data: gamesData, error: gamesError } = await supabase
          .from("games")
          .select("game_code, game_date, home_team, away_team, home_score, away_score")
          .in("game_code", gameIds);

        if (gamesError) throw gamesError;

        const combined = picksData.map((pick) => {
          const game = gamesData.find((g) => g.game_code === pick.game_id);
          let winner_team = null;
          if (game?.home_score != null && game?.away_score != null) {
            winner_team =
              game.home_score > game.away_score
                ? game.home_team
                : game.away_score > game.home_score
                ? game.away_team
                : "Tie";
          }

          return {
            ...pick,
            home_team: game?.home_team || null,
            away_team: game?.away_team || null,
            home_score: game?.home_score ?? null,
            away_score: game?.away_score ?? null,
            game_date: game?.game_date || null,
            winner_team,
          };
        });

        combined.sort((a, b) => a.week - b.week || new Date(a.game_date) - new Date(b.game_date));

        setResults(combined);
      } catch (err) {
        console.error("Error fetching results:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchResults();
  }, [user]);

  const weeks = [...new Set(results.map((r) => r.week))].sort((a, b) => b - a);
  const grandTotalCorrect = results.filter((g) => g.picked_team === g.winner_team).length;

  // Always render the Back button
  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 20 }}>
        <button
          style={{
            padding: "8px 16px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            marginBottom: 10,
          }}
          onClick={() => navigate("/")}
        >
          ⬅ Back to Home
        </button>
      </div>

      {loading ? (
        <p>Loading results...</p>
      ) : results.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <>
          <h2 style={{ marginBottom: 20 }}>
            Grand Total: {grandTotalCorrect} / {results.length} correct overall!
          </h2>

          {weeks.map((week) => {
            const weekResults = results.filter((r) => r.week === week);
            const correctCount = weekResults.filter((g) => g.picked_team === g.winner_team).length;

            return (
              <div key={week} style={{ marginBottom: 40 }}>
                <h1>Week {week} Results</h1>
                <h2 style={{ marginBottom: 20 }}>
                  You got {correctCount} / {weekResults.length} correct for Week {week}!
                </h2>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      minWidth: 500,
                      borderCollapse: "collapse",
                      fontSize: "0.9rem",
                    }}
                  >
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
                              game.picked_team === game.winner_team ? "#d4edda" : "#f8d7da",
                          }}
                        >
                          <td style={{ padding: "8px" }}>
                            {game.game_date &&
                              new Date(game.game_date).toLocaleString("en-US", {
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
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
