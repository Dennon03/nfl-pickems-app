import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ViewPicksPage({ user }) {
  const [savedPicks, setSavedPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [firstGameStart, setFirstGameStart] = useState(null);
  const picksLocked = firstGameStart && new Date() >= new Date(firstGameStart);

  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const week = query.get("week") || 1;

  // Fetch user picks and merge with game info
  const fetchSavedPicks = async () => {
    setLoading(true);
    try {
      // 1. Get user picks for this week
      const { data: picksData, error: picksError } = await supabase
        .from("user_picks")
        .select("game_id, picked_team")
        .eq("user_id", user.id)
        .eq("week", week);

      if (picksError) throw picksError;
      if (!picksData || picksData.length === 0) {
        setSavedPicks([]);
        setLoading(false);
        return;
      }

      // 2. Get the corresponding game info from games table
      const gameIds = picksData.map((p) => p.game_id);
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("game_code, game_date, home_team, away_team")
        .in("game_code", gameIds);

      if (gamesError) throw gamesError;

      // 3. Merge picks with game info
      let picks = picksData.map((pick) => {
        const game = gamesData.find((g) => g.game_code === pick.game_id);
        return {
          game_id: pick.game_id,
          picked_team: pick.picked_team,
          game_date: game?.game_date,
          home_team: game?.home_team,
          away_team: game?.away_team,
        };
      });

      // 4. Sort by game_date ascending
      picks.sort((a, b) => new Date(a.game_date) - new Date(b.game_date));

      setSavedPicks(picks);

      if (picks.length > 0) {
        const earliestGame = picks[0].game_date ? new Date(picks[0].game_date) : null;
        setFirstGameStart(earliestGame);
      }
    } catch (err) {
      console.error("Failed to fetch picks", err);
      setError("Failed to load saved picks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchSavedPicks();
  }, [user?.id, week]);

  const handlePickChange = (gameId, newPick) => {
    setSavedPicks((prev) =>
      prev.map((pick) =>
        pick.game_id === gameId ? { ...pick, picked_team: newPick } : pick
      )
    );
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const formattedPicks = savedPicks.map((pick) => ({
        user_id: user.id,
        week: week,
        game_id: pick.game_id,
        picked_team: pick.picked_team,
      }));

      const { error } = await supabase
        .from("user_picks")
        .upsert(formattedPicks, { onConflict: ["user_id", "week", "game_id"] });

      if (error) throw error;

      alert("Picks updated successfully!");
      setEditing(false);
    } catch (err) {
      console.error("Error saving picks:", err);
      alert("Failed to save picks.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading saved picks...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: 20,
          padding: "8px 16px",
          backgroundColor: "#0078d7",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        &larr; Back to Home Page
      </button>

      <h1>Your Picks - Week {week}</h1>

      {!editing && !picksLocked && (
        <button
          onClick={() => setEditing(true)}
          style={{
            marginBottom: 20,
            padding: "8px 16px",
            backgroundColor: "#ffc107",
            color: "black",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Edit Picks
        </button>
      )}

      {picksLocked && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          Picks are locked for this week. First game has started.
        </p>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0", textAlign: "left" }}>
            <th style={{ padding: "8px" }}>Date / Time (ET)</th>
            <th style={{ padding: "8px" }}>Home Team</th>
            <th style={{ padding: "8px" }}>Away Team</th>
            <th style={{ padding: "8px" }}>Your Pick</th>
          </tr>
        </thead>
        <tbody>
          {savedPicks.map((pick) => (
            <tr key={pick.game_id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px" }}>
                {new Date(pick.game_date).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                  timeZone: "America/New_York",
                })}
              </td>
              <td style={{ padding: "8px" }}>{pick.home_team}</td>
              <td style={{ padding: "8px" }}>{pick.away_team}</td>
              <td style={{ padding: "8px", fontWeight: 600, color: "#0078d7" }}>
                {editing ? (
                  <select
                    value={pick.picked_team}
                    onChange={(e) =>
                      handlePickChange(pick.game_id, e.target.value)
                    }
                    disabled={picksLocked || saving}
                  >
                    <option value={pick.home_team}>{pick.home_team}</option>
                    <option value={pick.away_team}>{pick.away_team}</option>
                  </select>
                ) : (
                  pick.picked_team
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && !picksLocked && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={saveChanges}
            disabled={saving}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
