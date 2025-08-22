import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../api";

export default function LeaderboardPage() {
  const [week, setWeek] = useState(null); // dynamic week
  const [leaderboard, setLeaderboard] = useState([]);
  const [grandTotals, setGrandTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCurrentWeek() {
      try {
        const res = await axios.get(`${API_BASE}/current-week`);
        setWeek(res.data.currentWeek); // null if no weeks in table
      } catch (err) {
        console.error("Error fetching current week:", err);
        setWeek(null);
      }
    }

    fetchCurrentWeek();
  }, []);

  // Fetch leaderboard data for the determined week
  useEffect(() => {
    if (!week) return;

    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const resWeek = await axios.get(`${API_BASE}/user-saved-picks-week`, {
          params: { week },
        });

        const userStats = {};
        resWeek.data.forEach((pick) => {
          if (!userStats[pick.user_id]) {
            userStats[pick.user_id] = {
              user_id: pick.user_id,
              username: pick.username,
              correctCount: 0,
              totalPicks: 0,
            };
          }
          userStats[pick.user_id].totalPicks += 1;
          if (pick.picked_team === pick.winner_team) userStats[pick.user_id].correctCount += 1;
        });

        setLeaderboard(Object.values(userStats).sort((a, b) => b.correctCount - a.correctCount));

        const resGrand = await axios.get(`${API_BASE}/user-grand-total`, { params: { week } });
        const totalsMap = {};
        resGrand.data.forEach((u) => {
          totalsMap[u.user_id] = u.grand_total_correct;
        });
        setGrandTotals(totalsMap);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [week]);

  if (loading) return <p>Loading leaderboard...</p>;
  if (!week) return <p>No completed weeks yet.</p>;
  if (leaderboard.length === 0) return <p>No Results found for Week {week}.</p>;

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
              <td style={{ padding: "8px", color: "#28a745", fontWeight: 600 }}>
                {user.correctCount}
              </td>
              <td style={{ padding: "8px" }}>{user.totalPicks}</td>
              <td style={{ padding: "8px", fontWeight: 600 }}>{grandTotals[user.user_id] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
