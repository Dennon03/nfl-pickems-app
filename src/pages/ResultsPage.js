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
        if (!user?.id) return;

        // 1. Get user picks for all weeks
        const { data: picksData, error: picksError } = await supabase
          .from("user_picks")
          .select("game_id, picked_team, is_correct, week")
          .eq("user_id", user.id);

        if (picksError) throw picksError;

        // 2. Fetch all completed games (any week with winner_team not null)
        const { data: gamesData, error: gamesError } = await supabase
          .from("game_results")
          .select(
            "game_id, game_date, home_team, away_team, home_score, away_score, winner_team, week"
          )
          .not("winner_team", "is", null); // only completed games

        if (gamesError) throw gamesError;

        // 3. Map picks by normalized game_id for fast lookup
        const picksMap = {};
        picksData.forEach(pick => {
          picksMap[String(pick.game_id).trim()] = pick;
        });

        // 4. Combine results with picks
        const combined = gamesData.map(game => {
          const pick = picksMap[String(game.game_id).trim()];
          return {
            ...game,
            picked_team: pick ? pick.picked_team : "—",
            is_correct: pick ? pick.is_correct : false,
          };
        });

        // 5. Sort by week and date
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

    fetchResults();
  }, [user]);

  const weeks = [...new Set(results.map(r => r.week))].sort((a, b) => b - a);

  // Grand total only counts picks the user actually made
  const grandTotalCorrect = results.filter(r => r.is_correct).length;

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
            Grand Total: {grandTotalCorrect} /{" "}
            {results.filter(r => r.picked_team !== "—").length} correct overall!
          </h2>

          {weeks.map(week => {
            const weekResults = results.filter(r => r.week === week);
            const correctCount = weekResults.filter(g => g.is_correct).length;
            const wrongCount = weekResults.filter(
              g => g.picked_team !== "—" && !g.is_correct
            ).length;

            return (
              <div key={week} style={{ marginBottom: 40 }}>
                <h1>Week {week} Results</h1>
                <h2 style={{ marginBottom: 20 }}>
                  Correct: {correctCount} | Wrong: {wrongCount}
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
                              game.is_correct
                                ? "#d4edda"
                                : game.picked_team === "—"
                                ? "#f0f0f0"
                                : "#f8d7da",
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
