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
        // 1. Get user picks
        const { data: picksData, error: picksError } = await supabase
          .from("user_picks")
          .select("game_id, picked_team, week")
          .eq("user_id", user.id);

        if (picksError) throw picksError;
        if (!picksData || picksData.length === 0) {
          setResults([]);
          return;
        }

        // 2. Filter valid game_ids
        const gameIds = picksData.map(p => p.game_id).filter(Boolean);

        if (gameIds.length === 0) {
          setResults([]);
          return;
        }

        // 3. Get actual results from game_results
        const { data: gamesData, error: gamesError } = await supabase
          .from("game_results")
          .select(
            "game_id, game_date, home_team, away_team, home_score, away_score, winner_team, week"
          )
          .in("game_id", gameIds);

        if (gamesError) throw gamesError;

        // 4. Combine picks with results (only for completed games)
        const completedGames = gamesData.filter(g => g.winner_team !== null);

        const combined = picksData
          .map(pick => {
            const game = completedGames.find(g => g.game_id === pick.game_id);
            if (!game) return null; // skip picks for games not completed yet
            return {
              ...pick,
              home_team: game.home_team,
              away_team: game.away_team,
              home_score: game.home_score,
              away_score: game.away_score,
              winner_team: game.winner_team,
              game_date: game.game_date,
            };
          })
          .filter(Boolean); // remove null entries

        combined.sort(
          (a, b) => a.week - b.week || new Date(a.game_date || 0) - new Date(b.game_date || 0)
        );

        setResults(combined);
      } catch (err) {
        console.error("Error fetching results:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchResults();
  }, [user]);

  const weeks = [...new Set(results.map(r => r.week))].sort((a, b) => b - a);
  const grandTotalCorrect = results.filter(g => g.picked_team === g.winner_team).length;

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

          {weeks.map(week => {
            const weekResults = results.filter(r => r.week === week);
            const correctCount = weekResults.filter(g => g.picked_team === g.winner_team).length;

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
                        <th style={{ padding: "8px" }}>Date</th>
                        <th style={{ padding: "8px" }}>Home Team</th>
                        <th style={{ padding: "8px" }}>Away Team</th>
                        <th style={{ padding: "8px" }}>Your Pick</th>
                        <th style={{ padding: "8px" }}>Winner</th>
                        <th style={{ padding: "8px" }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekResults.map(game => (
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
                              new Date(game.game_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                timeZone: "America/New_York",
                              })}
                          </td>
                          <td style={{ padding: "8px", fontWeight: "600" }}>{game.home_team}</td>
                          <td style={{ padding: "8px" }}>{game.away_team}</td>
                          <td style={{ padding: "8px" }}>{game.picked_team}</td>
                          <td style={{ padding: "8px" }}>{game.winner_team}</td>
                          <td style={{ padding: "8px" }}>
                            {game.home_score} - {game.away_score}
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
