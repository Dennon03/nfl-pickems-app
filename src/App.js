import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import LandingPage from "./pages/LandingPage";
import PicksPage from "./pages/PicksPage";
import ViewPicksPage from "./pages/ViewPicksPage";
import ResultsPage from "./pages/ResultsPage";
import LeaderboardPage from "./pages/LeaderboardPage";

function App() {
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(false); // No loading needed for user check on startup

  useEffect(() => {
    // Remove auto-login on app start by clearing localStorage
    localStorage.removeItem("user");
    setUser(null);
    setCheckingUser(false);
  }, []);

  if (checkingUser) {
    return <p>Loading...</p>;
  }

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route
          path="/login"
          element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" replace />}
        />
        {/* Protected routes */}
        <Route
          path="/"
          element={user ? <LandingPage user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/picks"
          element={user ? <PicksPage user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/view-picks"
          element={user ? <ViewPicksPage user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/results"
          element={user ? <ResultsPage user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/leaderboard"
          element={user ? <LeaderboardPage /> : <Navigate to="/login" replace />}
        />
        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
