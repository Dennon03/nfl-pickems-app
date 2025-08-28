import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function LandingPage({ user }) {
  const [gamesByWeek, setGamesByWeek] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [hasSavedPicks, setHasSavedPicks] = useState(false);
  const [checkingPicks, setCheckingPicks] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
          grouped[wk].sort(
            (a, b) => new Date(a.game_date) - new Date(b.game_date)
          );
        });

        setGamesByWeek(grouped);

        const now = new Date();
        const weeksSorted = Object.keys(grouped)
          .map(Number)
          .sort((a, b) => a - b);
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
        if (location.state?.picksSaved) {
          setHasSavedPicks(true);
          navigate(location.pathname, { replace: true, state: {} });
          setCheckingPicks(false);
          return;
        }

        const { data: status, error } = await supabase
          .from("user_week_picks_status")
          .select("has_picks")
          .eq("user_id", user.id)
          .eq("week", currentWeek)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        setHasSavedPicks(status?.has_picks || false);
      } catch (err) {
        console.error(err);
        setHasSavedPicks(false);
      } finally {
        setCheckingPicks(false);
      }
    };

    checkPicksStatus();
  }, [user, currentWeek, location.state, navigate]);

  if (loading) return <p>Loading games...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const availableWeeks = Object.keys(gamesByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  const formatTeamWithOdds = (team, odds) => {
    if (odds === undefined || odds === null || odds === "") return team;
    const sign = odds > 0 ? `+${odds}` : odds;
    return `${team} (${sign})`;
  };

  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: "20px 10px" }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>
        NFL 2025 Season Games
      </h1>

      {availableWeeks.map((week) => (
        <div key={week} style={{ marginBottom: 40 }}>
          <h2
            style={{
              borderBottom: "2px solid #0078d7",
              paddingBottom: 6,
              color: "#0078d7",
            }}
          >
            Week {week}
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "500px",
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
                {gamesByWeek[week].map((game) => {
                  let homeTeam = game.home_team;
                  let awayTeam = game.away_team;

                  let oddsObj = {};
                  if (game.odds) {
                    try {
                      oddsObj = typeof game.odds === "string" ? JSON.parse(game.odds) : game.odds;
                    } catch (err) {
                      console.error("Failed to parse odds JSON", err);
                    }
                  }

                const homeOdds = oddsObj[game.home_team];
                const awayOdds = oddsObj[game.away_team];

                homeTeam = formatTeamWithOdds(game.home_team, homeOdds);
                awayTeam = formatTeamWithOdds(game.away_team, awayOdds);


                  return (
                    <tr
                      key={game.game_code}
                      style={{
                        borderBottom: "1px solid #ddd",
                        textAlign: "center",
                      }}
                    >
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
                      <td style={{ padding: "8px", fontWeight: 600 }}>
                        {homeTeam}
                      </td>
                      <td style={{ padding: "8px" }}>{awayTeam}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {gamesByWeek[week][0]?.bye_teams?.length > 0 && (
            <p
              style={{
                marginTop: 10,
                fontStyle: "italic",
                color: "#555",
                textAlign: "center",
              }}
            >
              Byes: {gamesByWeek[week][0].bye_teams.join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
