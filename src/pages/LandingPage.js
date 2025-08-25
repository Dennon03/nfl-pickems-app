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

  // Fetch games from Supabase
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data: games, error } = await supabase
          .from("games")
          .select("*")
          .order("game_date", { ascending: true });

        if (error) throw error;

        // Group games by week
        const grouped = games.reduce((acc, game) => {
          const week = Number(game.week_id);
          if (!acc[week]) acc[week] = [];
          acc[week].push(game);
          return acc;
        }, {});

        // Sort each week's games by date
        Object.keys(grouped).forEach((wk) => {
          grouped[wk].sort(
            (a, b) => new Date(a.game_date) - new Date(b.game_date)
          );
        });

        setGamesByWeek(grouped);

        // Determine current week
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

  // Check if user has saved picks
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
          .single(); // there is only one row per user & week

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
                opacity: checkingPicks ? 0.6 : 1,
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
          {checkingPicks && (
            <div style={{ marginTop: 8, color: "#666" }}>Checking your picks…</div>
          )}
        </div>
      )}

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
