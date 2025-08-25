import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function LeaderboardPage() {
  const [week, setWeek] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [grandTotals, setGrandTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Determine the week to display
  useEffect(() => {
    const fetchCurrentWeek = async () => {
      try {
        // Try to get the latest week that has any user picks
        const { data: picksData, error: picksError } = await supabase
          .from("user_picks")
          .select("week")
          .order("week", { ascending: false })
          .limit(1)
          .single();

        if (picksError) throw picksError;

        // If no picks exist, default to week 1
        setWeek(picksData?.week || 1);
      } catch (err) {
        console.error("Error fetching current week:", err);
        setWeek(1);
      }
    };

    fetchCurrentWeek();
  }, []);

  useEffect(() => {
    if (!week) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        // Fetch all picks for the week with user info
        const { data: picksData, error: picksError } = await supabase
          .from("user_picks")
          .select(`
            user_id,
            picked_team,
            week,
            users(username),
            games(home_team, away_team, home_score, away_score)
          `)
          .eq("week", week);

        if (picksError) throw picksError;
        if (!picksData || picksData.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        // Calculate weekly stats
        const userStats = {};
        const grandTotalsMap = {};

        picksData.forEach((pick) => {
          const userId = pick.user_id;
          const username = pick.users?.username || "Unknown";

          const game = pick.games;
          let winner_team = null;
          if (game?.home_score != null && game?.away_score != null) {
            winner_team =
              game.home_score > game.away_score
                ? game.home_team
                : game.away_score > game.home_score
                ? game.away_team
                : "Tie";
          }

          if (!userStats[userId]) {
            userStats[userId] = { user_id: userId, username, correctCount: 0, totalPicks: 0 };
          }
          userStats[userId].totalPicks += 1;
          if (pick.picked_team === winner_team) userStats[userId].correctCount += 1;

          if (!grandTotalsMap[userId]) grandTotalsMap[userId] = 0;
          if (pick.picked_team === winner_team) grandTotalsMap[userId] += 1;
        });

        setLeaderboard(Object.values(userStats).sort((a, b) => b.correctCount - a.correctCount));
        setGrandTotals(grandTotalsMap);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [week]);

  if (loading) return <p>Loading leaderboard...</p>;
  if (!week) return <p>No completed weeks yet.</p>;
  if (leaderboard.length === 0) return <p>No results found for Week {week}.</p>;

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

      <h1>Leaderboard - Week {week}</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0", textAlign: "left" }}>
            <th style={{ padding: "8px" }}>Rank</th>
            <th style={{ padding: "8px" }}>User</th>
            <th style={{ padding: "8px" }}>Correct Picks</th>
            <th style={{ padding: "8px" }}>Total Picks</th>
            <th style={{ padding: "8px" }}>Grand Total Correct</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((user, index) => (
            <tr
              key={user.user_id}
              style={{
                borderBottom: "1px solid #ddd",
                backgroundColor: index % 2 === 0 ? "#fafafa" : "#fff",
              }}
            >
              <td style={{ padding: "8px" }}>{index + 1}</td>
              <td style={{ padding: "8px" }}>{user.username}</td>
              <td style={{ padding: "8px", color: "#28a745", fontWeight: 600 }}>{user.correctCount}</td>
              <td style={{ padding: "8px" }}>{user.totalPicks}</td>
              <td style={{ padding: "8px", fontWeight: 600 }}>{grandTotals[user.user_id] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
