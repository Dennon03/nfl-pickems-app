import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLocation } from "react-router-dom";

export default function PicksPage({ user }) {
  const [week, setWeek] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [picks, setPicks] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const passedWeek = params.get("week");

  useEffect(() => {
    if (passedWeek) setWeek(Number(passedWeek));
  }, [passedWeek]);

  // Load games
  useEffect(() => {
    if (!week) return;

    const fetchGames = async () => {
      setLoading(true);
      try {
        const { data: gamesData, error } = await supabase
          .from("games")
          .select("*")
          .eq("week_id", week)
          .order("game_date", { ascending: true });

        if (error) throw error;
        setGames(gamesData || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load games");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [week]);

  // Load user's picks
  useEffect(() => {
    if (!week || !user) return;

    const fetchPicks = async () => {
      try {
        const { data: userPicks, error } = await supabase
          .from("user_picks")
          .select("game_id, picked_team")
          .eq("week", week)
          .eq("user_id", user.id);

        if (error) throw error;

        const picksMap = {};
        userPicks.forEach((pick) => {
          picksMap[pick.game_id] = pick.picked_team;
        });

        setPicks(picksMap);
      } catch (err) {
        console.error("Failed to fetch picks", err);
      }
    };

    fetchPicks();
  }, [week, user]);

  // ----------------------------------------------------------
  // NEW LOCKING LOGIC — LOCK THE DAY AFTER THE FIRST GAME
  // ----------------------------------------------------------
  let picksDisabled = false;

  if (games.length > 0) {
    const firstGame = new Date(games[0].game_date);

    // Add 1 day to first game date → lock next day at 00:00 ET
    const lockYear = firstGame.getUTCFullYear();
    const lockMonth = firstGame.getUTCMonth();
    const lockDay = firstGame.getUTCDate() + 1;

    // Create lock time = next day at 00:00 ET (05:00 UTC)
    const lockTime = new Date(Date.UTC(lockYear, lockMonth, lockDay, 5, 0, 0));

    picksDisabled = new Date() >= lockTime;
  }
  // ----------------------------------------------------------

  const handlePickChange = (gameId, team) => {
    if (picksDisabled) return;
    setPicks((prev) => ({ ...prev, [gameId]: team }));
  };

  const savePicks = async () => {
    if (!user || !user.id) {
      alert("User not logged in!");
      return;
    }

    if (
      Object.keys(picks).length !== games.length ||
      Object.values(picks).some((v) => !v)
    ) {
      alert("Please make a pick for every game before submitting.");
      return;
    }

    setSaving(true);

    try {
      const formattedPicks = games.map((game) => ({
        user_id: user.id,
        week: week,
        game_id: game.game_code,
        picked_team: picks[game.game_code],
      }));

      const { error: upsertError } = await supabase
        .from("user_picks")
        .upsert(formattedPicks, {
          onConflict: ["user_id", "week", "game_id"],
        });

      if (upsertError) throw upsertError;

      const { error: statusError } = await supabase
        .from("user_week_picks_status")
        .upsert(
          {
            user_id: user.id,
            week: week,
            has_picks: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: ["user_id", "week"] }
        );

      if (statusError) throw statusError;

      navigate(`/view-picks?week=${week}`, { state: { picksSaved: true } });
    } catch (err) {
      console.error("Failed to save picks or update status", err);
      alert("Failed to save picks. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !week) return <p>Loading games...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: "20px 10px" }}>
      <h1>Make Your Picks - Week {week}</h1>

      {picksDisabled && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          Picking is closed for this week.
        </p>
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: "320px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0", textAlign: "left" }}>
              <th style={{ padding: "8px" }}>Date / Time (ET)</th>
              <th style={{ padding: "8px" }}>Home Team</th>
              <th style={{ padding: "8px" }}>Away Team</th>
              <th style={{ padding: "8px" }}>Your Pick</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr
                key={game.game_code}
                style={{ borderBottom: "1px solid #ddd" }}
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
                  {game.home_team}
                </td>
                <td style={{ padding: "8px" }}>{game.away_team}</td>
                <td style={{ padding: "8px" }}>
                  <select
                    disabled={picksDisabled || saving}
                    value={picks[game.game_code] || ""}
                    onChange={(e) =>
                      handlePickChange(game.game_code, e.target.value)
                    }
                    style={{
                      padding: "6px",
                      fontSize: "0.9rem",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="" disabled>
                      Select winner
                    </option>
                    <option value={game.home_team}>{game.home_team}</option>
                    <option value={game.away_team}>{game.away_team}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!picksDisabled && (
        <button
          onClick={savePicks}
          disabled={saving}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            fontSize: 16,
            width: "100%",
            maxWidth: "250px",
            display: "block",
            fontWeight: 600,
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Picks"}
        </button>
      )}
    </div>
  );
}
