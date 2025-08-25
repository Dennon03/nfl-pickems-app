import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function LandingPage({ user }) {
  const [gamesByWeek, setGamesByWeek] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [hasSavedPicks, setHasSavedPicks] = useState(false);
  const [checkingPicks, setCheckingPicks] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data: games, error } = await supabase
          .from("games")
          .select("*")
          .order("game_date", { ascending: true });
        if (error) throw error;

        const grouped = games.reduce((acc, game) => {
          const week = Number(game.week_id);
          if (!acc[week]) acc[week] = [];
          acc[week].push(game);
          return acc;
        }, {});

        Object.keys(grouped).forEach((wk) => {
          grouped[wk].sort((a, b) => new Date(a.game_date) - new Date(b.game_date));
        });

        setGamesByWeek(grouped);

        const now = new Date();
        const weeksSorted = Object.keys(grouped).map(Number).sort((a, b) => a - b);
        let activeWeek = weeksSorted[0];
        for (let wk of weeksSorted) {
          const weekStart = new Date(grouped[wk][0].game_date);
          if (now >= weekStart) activeWeek = wk;
          else break;
        }
        setCurrentWeek(activeWeek);
      } catch (err) {
        console.error(err);
        setError("Failed to load games from database.");
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  useEffect(() => {
    const checkPicksStatus = async () => {
      if (!user || !currentWeek) return;

      setCheckingPicks(true);
      try {
        const { data: status, error } = await supabase
          .from("user_week_picks_status")
          .select("has_picks")
          .eq("user_id", user.id)
          .eq("week", currentWeek)
          .single();
        if (error) throw error;

        setHasSavedPicks(status?.has_picks || false);
      } catch (err) {
        console.error(err);
        setHasSavedPicks(false);
      } finally {
        setCheckingPicks(false);
      }
    };

    checkPicksStatus();
  }, [user, currentWeek]);

  if (loading) return <p>Loading games...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const availableWeeks = Object.keys(gamesByWeek).map(Number).sort((a, b) => a - b);

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: "20px 10px" }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>NFL 2025 Season Games</h1>

      {user && currentWeek && gamesByWeek[currentWeek]?.length > 0 && (
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              disabled={checkingPicks}
              onClick={() =>
                navigate(hasSavedPicks ? `/view-picks?week=${currentWeek}` : `/picks?week=${currentWeek}`)
              }
              style={{
                padding: "10px 15px",
                backgroundColor: "#0078d7",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                cursor: checkingPicks ? "not-allowed" : "pointer",
                opacity: checkingPicks ? 0.6 : 1,
                minWidth: "180px",
                flex: "1 1 200px",
              }}
            >
              {hasSavedPicks ? `View Your Picks (Week ${currentWeek})` : `Make Picks (Week ${currentWeek})`}
            </button>

            <button
              onClick={() => navigate("/results")}
              style={{
                padding: "10px 15px",
                backgroundColor: "#0078d7",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                minWidth: "180px",
                flex: "1 1 200px",
              }}
            >
              View Season Results
            </button>

            <button
              onClick={() => navigate("/leaderboard")}
              style={{
                padding: "10px 15px",
                backgroundColor: "#0078d7",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                minWidth: "180px",
                flex: "1 1 200px",
              }}
            >
              Leaderboard (Week {currentWeek})
            </button>
          </div>
          {checkingPicks && <div style={{ marginTop: 8, color: "#666" }}>Checking your picks…</div>}
        </div>
      )}

      {availableWeeks.map((week) => (
        <div key={week} style={{ marginBottom: 40 }}>
          <h2 style={{ borderBottom: "2px solid #0078d7", paddingBottom: 6, color: "#0078d7" }}>
            Week {week}
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "320px",
                margin: "auto",
                borderCollapse: "collapse",
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: "33%" }} />
                <col style={{ width: "33%" }} />
                <col style={{ width: "34%" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0", textAlign: "center" }}>
                  <th style={{ padding: "8px" }}>Date / Time</th>
                  <th style={{ padding: "8px" }}>Home Team</th>
                  <th style={{ padding: "8px" }}>Away Team</th>
                </tr>
              </thead>
              <tbody>
                {gamesByWeek[week].map((game) => (
                  <tr key={game.game_code} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "8px", fontSize: "0.9rem" }}>
                      {new Date(game.game_date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                        timeZone: "America/New_York",
                      })}
                    </td>
                    <td style={{ padding: "8px", fontWeight: 600 }}>{game.home_team}</td>
                    <td style={{ padding: "8px" }}>{game.away_team}</td>
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
