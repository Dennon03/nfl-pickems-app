import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function LeaderboardPage() {
  const [week, setWeek] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [grandLeaderboard, setGrandLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch the latest completed week
  useEffect(() => {
    const fetchLatestCompletedWeek = async () => {
      try {
        const { data: completedGames, error } = await supabase
          .from("game_results")
          .select("week")
          .not("winner_team", "is", null)
          .order("week", { ascending: false });

        if (error) throw error;
        if (!completedGames || completedGames.length === 0) {
          setWeek(null);
          return;
        }

        setWeek(completedGames[0].week);
      } catch (err) {
        console.error("Error fetching latest completed week:", err);
        setWeek(null);
      }
    };

    fetchLatestCompletedWeek();
  }, []);

  // Weekly leaderboard
  useEffect(() => {
    if (!week) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data: picksData, error: picksError } = await supabase
          .from("user_picks")
          .select("user_id, picked_team, week, users!inner(username), game_id")
          .eq("week", week);

        if (picksError) throw picksError;
        if (!picksData || picksData.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        const gameIds = picksData.map(p => p.game_id).filter(Boolean);

        const { data: gamesData, error: gamesError } = await supabase
          .from("game_results")
          .select("game_id, winner_team")
          .in("game_id", gameIds);

        if (gamesError) throw gamesError;

        const userStats = {};
        picksData.forEach(pick => {
          const game = gamesData.find(g => g.game_id === pick.game_id);
          if (!game?.winner_team) return; // skip unfinished games

          const userId = pick.user_id;
          const username = pick.users?.username ?? "Unknown";
          const winner_team = game.winner_team;

          if (!userStats[userId]) {
            userStats[userId] = { user_id: userId, username, correctCount: 0, totalPicks: 0 };
          }

          userStats[userId].totalPicks += 1;
          if (pick.picked_team === winner_team) userStats[userId].correctCount += 1;
        });

        setLeaderboard(
          Object.values(userStats).sort((a, b) => b.correctCount - a.correctCount)
        );
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [week]);

  // Grand leaderboard
  useEffect(() => {
    const fetchGrandLeaderboard = async () => {
      try {
        const { data: allPicks, error: picksError } = await supabase
          .from("user_picks")
          .select("user_id, picked_team, week, users!inner(username), game_id");

        if (picksError) throw picksError;
        if (!allPicks || allPicks.length === 0) {
          setGrandLeaderboard([]);
          return;
        }

        const gameIds = [...new Set(allPicks.map(p => p.game_id).filter(Boolean))];

        const { data: gamesData, error: gamesError } = await supabase
          .from("game_results")
          .select("game_id, winner_team")
          .in("game_id", gameIds);

        if (gamesError) throw gamesError;

        const userStats = {};
        allPicks.forEach(pick => {
          const game = gamesData.find(g => g.game_id === pick.game_id);
          if (!game?.winner_team) return; // skip unfinished games

          const userId = pick.user_id;
          const username = pick.users?.username ?? "Unknown";
          const winner_team = game.winner_team;

          if (!userStats[userId]) {
            userStats[userId] = { user_id: userId, username, correctCount: 0, totalPicks: 0 };
          }

          userStats[userId].totalPicks += 1;
          if (pick.picked_team === winner_team) userStats[userId].correctCount += 1;
        });

        setGrandLeaderboard(
          Object.values(userStats).sort((a, b) => b.correctCount - a.correctCount)
        );
      } catch (err) {
        console.error("Error fetching grand leaderboard:", err);
      }
    };

    fetchGrandLeaderboard();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 20 }}>
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
          ⬅ Back to Home
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center" }}>Loading leaderboard...</p>
      ) : (
        <>
          {/* Weekly Table */}
          {week && leaderboard.length > 0 && (
            <>
              <h1 style={{ fontSize: "1.2rem", textAlign: "center" }}>Leaderboard - Week {week}</h1>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 500,
                    borderCollapse: "collapse",
                    fontSize: "0.9rem",
                    marginTop: 20,
                    textAlign: "center",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th style={{ padding: "8px" }}>Rank</th>
                      <th style={{ padding: "8px" }}>User</th>
                      <th style={{ padding: "8px" }}>Correct Picks</th>
                      <th style={{ padding: "8px" }}>Total Picks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let lastScore = null;
                      let lastRank = 0;
                      return leaderboard.map((user, index) => {
                        if (user.correctCount !== lastScore) {
                          lastRank = lastRank + 1;
                          lastScore = user.correctCount;
                        }

                        return (
                          <tr
                            key={user.user_id}
                            style={{
                              borderBottom: "1px solid #ddd",
                              backgroundColor: index % 2 === 0 ? "#fafafa" : "#fff",
                            }}
                          >
                            <td style={{ padding: "8px" }}>{lastRank}</td>
                            <td style={{ padding: "8px" }}>{user.username}</td>
                            <td style={{ padding: "8px", color: "#28a745", fontWeight: 600 }}>
                              {user.correctCount}
                            </td>
                            <td style={{ padding: "8px" }}>{user.totalPicks}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
