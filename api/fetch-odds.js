// api/fetch-odds.js
import 'dotenv/config';
import fetch from 'node-fetch';

const ODDS_API_KEY = process.env.ODDS_API_KEY;

if (!ODDS_API_KEY) {
  console.error('Missing env var: ODDS_API_KEY');
  process.exit(1);
}

const sport = "americanfootball_nfl";

const weekGamesByWeek = {
  1: [
    { home: "Philadelphia Eagles", away: "Dallas Cowboys" },
    { home: "Los Angeles Chargers", away: "Kansas City Chiefs" },
    { home: "Atlanta Falcons", away: "Tampa Bay Buccaneers" },
    { home: "Cleveland Browns", away: "Cincinnati Bengals" },
    { home: "Indianapolis Colts", away: "Miami Dolphins" },
    { home: "Jacksonville Jaguars", away: "Carolina Panthers" },
    { home: "New England Patriots", away: "Las Vegas Raiders" },
    { home: "New Orleans Saints", away: "Arizona Cardinals" },
    { home: "New York Jets", away: "Pittsburgh Steelers" },
    { home: "New York Giants", away: "Washington Commanders" },
    { home: "Denver Broncos", away: "Tennessee Titans" },
    { home: "Seattle Seahawks", away: "San Francisco 49ers" },
    { home: "Green Bay Packers", away: "Detroit Lions" },
    { home: "Los Angeles Rams", away: "Houston Texans" },
    { home: "Buffalo Bills", away: "Baltimore Ravens" },
    { home: "Chicago Bears", away: "Minnesota Vikings" }
  ],
  2: [
    { home: "Baltimore Ravens", away: "Cleveland Browns" },
    { home: "Cincinnati Bengals", away: "Jacksonville Jaguars" },
    { home: "Dallas Cowboys", away: "New York Giants" },
    { home: "Detroit Lions", away: "Chicago Bears" },
    { home: "Miami Dolphins", away: "New England Patriots" },
    { home: "New Orleans Saints", away: "San Francisco 49ers" },
    { home: "Buffalo Bills", away: "New York Jets" },
    { home: "Pittsburgh Steelers", away: "Seattle Seahawks" },
    { home: "Los Angeles Rams", away: "Tennessee Titans" },
    { home: "Arizona Cardinals", away: "Carolina Panthers" },
    { home: "Denver Broncos", away: "Indianapolis Colts" },
    { home: "Kansas City Chiefs", away: "Philadelphia Eagles" },
    { home: "Minnesota Vikings", away: "Atlanta Falcons" },
    { home: "Houston Texans", away: "Tampa Bay Buccaneers" },
    { home: "Las Vegas Raiders", away: "Los Angeles Chargers" },
    { home: "Green Bay Packers", away: "Washington Commanders" }
  ],
  3: [
    { home: "Buffalo Bills", away: "Miami Dolphins" },
    { home: "Atlanta Falcons", away: "Carolina Panthers" },
    { home: "Green Bay Packers", away: "Cleveland Browns" },
    { home: "Houston Texans", away: "Jacksonville Jaguars" },
    { home: "Cincinnati Bengals", away: "Minnesota Vikings" },
    { home: "Pittsburgh Steelers", away: "New England Patriots" },
    { home: "Los Angeles Rams", away: "Philadelphia Eagles" },
    { home: "New York Jets", away: "Tampa Bay Buccaneers" },
    { home: "Indianapolis Colts", away: "Tennessee Titans" },
    { home: "Las Vegas Raiders", away: "Washington Commanders" },
    { home: "Denver Broncos", away: "Los Angeles Chargers" },
    { home: "New Orleans Saints", away: "Seattle Seahawks" },
    { home: "Dallas Cowboys", away: "Chicago Bears" },
    { home: "Arizona Cardinals", away: "San Francisco 49ers" },
    { home: "Kansas City Chiefs", away: "New York Giants" },
    { home: "Baltimore Ravens", away: "Detroit Lions" }
  ],
  4: [
    { home: "Arizona Cardinals", away: "Seattle Seahawks" },
    { home: "Minnesota Vikings", away: "Pittsburgh Steelers" },
    { home: "Atlanta Falcons", away: "Washington Commanders" },
    { home: "New Orleans Saints", away: "Buffalo Bills" },
    { home: "Cleveland Browns", away: "Detroit Lions" },
    { home: "Tennessee Titans", away: "Houston Texans" },
    { home: "Carolina Panthers", away: "New England Patriots" },
    { home: "Los Angeles Chargers", away: "New York Giants" },
    { home: "Philadelphia Eagles", away: "Tampa Bay Buccaneers" },
    { home: "Indianapolis Colts", away: "Los Angeles Rams" },
    { home: "Jacksonville Jaguars", away: "San Francisco 49ers" },
    { home: "Baltimore Ravens", away: "Kansas City Chiefs" },
    { home: "Chicago Bears", away: "Las Vegas Raiders" },
    { home: "Green Bay Packers", away: "Dallas Cowboys" },
    { home: "New York Jets", away: "Miami Dolphins" },
    { home: "Cincinnati Bengals", away: "Denver Broncos" }
  ],
  5: [
    { home: "Los Angeles Rams", away: "San Francisco 49ers" },
    { home: "Minnesota Vikings", away: "Cleveland Browns" },
    { home: "Baltimore Ravens", away: "Houston Texans" },
    { home: "Carolina Panthers", away: "Miami Dolphins" },
    { home: "Indianapolis Colts", away: "Las Vegas Raiders" },
    { home: "New Orleans Saints", away: "New York Giants" },
    { home: "New York Jets", away: "Dallas Cowboys" },
    { home: "Philadelphia Eagles", away: "Denver Broncos" },
    { home: "Arizona Cardinals", away: "Tennessee Titans" },
    { home: "Seattle Seahawks", away: "Tampa Bay Buccaneers" },
    { home: "Cincinnati Bengals", away: "Detroit Lions" },
    { home: "Los Angeles Chargers", away: "Washington Commanders" },
    { home: "Buffalo Bills", away: "New England Patriots" },
    { home: "Jacksonville Jaguars", away: "Kansas City Chiefs" }
  ],
  6: [
    { home: "New York Giants", away: "Philadelphia Eagles" },
    { home: "New York Jets", away: "Denver Broncos" },
    { home: "Baltimore Ravens", away: "Los Angeles Rams" },
    { home: "Carolina Panthers", away: "Dallas Cowboys" },
    { home: "Indianapolis Colts", away: "Arizona Cardinals" },
    { home: "Jacksonville Jaguars", away: "Seattle Seahawks" },
    { home: "Miami Dolphins", away: "Los Angeles Chargers" },
    { home: "Pittsburgh Steelers", away: "Cleveland Browns" },
    { home: "Tampa Bay Buccaneers", away: "San Francisco 49ers" },
    { home: "Las Vegas Raiders", away: "Tennessee Titans" },
    { home: "Green Bay Packers", away: "Cincinnati Bengals" },
    { home: "New Orleans Saints", away: "New England Patriots" },
    { home: "Kansas City Chiefs", away: "Detroit Lions" },
    { home: "Atlanta Falcons", away: "Buffalo Bills" },
    { home: "Washington Commanders", away: "Chicago Bears" }
    
  ],
  7: [
    { home: "Cincinnati Bengals", away: "Pittsburgh Steelers" },
    { home: "Jacksonville Jaguars", away: "Los Angeles Rams" },
    { home: "Chicago Bears", away: "New Orleans Saints" },
    { home: "Cleveland Browns", away: "Miami Dolphins" },
    { home: "Kansas City Chiefs", away: "Las Vegas Raiders" },
    { home: "Minnesota Vikings", away: "Philadelphia Eagles" },
    { home: "New York Jets", away: "Carolina Panthers" },
    { home: "Tennessee Titans", away: "New England Patriots" },
    { home: "Denver Broncos", away: "New York Giants" },
    { home: "Los Angeles Chargers", away: "Indianapolis Colts" },
    { home: "Arizona Cardinals", away: "Green Bay Packers" },
    { home: "Dallas Cowboys", away: "Washington Commanders" },
    { home: "San Francisco 49ers", away: "Atlanta Falcons" },
    { home: "Detroit Lions", away: "Tampa Bay Buccaneers" },
    { home: "Seattle Seahawks", away: "Houston Texans" }
  ],
  8: [
    { home: "Los Angeles Chargers", away: "Minnesota Vikings" },
    { home: "Atlanta Falcons", away: "Miami Dolphins" },
    { home: "Baltimore Ravens", away: "Chicago Bears" },
    { home: "Carolina Panthers", away: "Buffalo Bills" },
    { home: "Cincinnati Bengals", away: "New York Jets" },
    { home: "Houston Texans", away: "San Francisco 49ers" },
    { home: "New England Patriots", away: "Cleveland Browns" },
    { home: "Philadelphia Eagles", away: "New York Giants" },
    { home: "New Orleans Saints", away: "Tampa Bay Buccaneers" },
    { home: "Denver Broncos", away: "Dallas Cowboys" },
    { home: "Indianapolis Colts", away: "Tennessee Titans" },
    { home: "Pittsburgh Steelers", away: "Green Bay Packers" },
    { home: "Kansas City Chiefs", away: "Washington Commanders" }
  ], 
  9: [
    { home: "Miami Dolphins", away: "Baltimore Ravens" },
    { home: "Cincinnati Bengals", away: "Chicago Bears" },
    { home: "Detroit Lions", away: "Minnesota Vikings" },
    { home: "Green Bay Packers", away: "Carolina Panthers" },
    { home: "Houston Texans", away: "Denver Broncos" },
    { home: "New England Patriots", away: "Atlanta Falcons" },
    { home: "New York Giants", away: "San Francisco 49ers" },
    { home: "Pittsburgh Steelers", away: "Indianapolis Colts" },
    { home: "Tennessee Titans", away: "Los Angeles Chargers" },
    { home: "Los Angeles Rams", away: "New Orleans Saints" },
    { home: "Las Vegas Raiders", away: "Jacksonville Jaguars" },
    { home: "Buffalo Bills", away: "Kansas City Chiefs" },
    { home: "Washington Commanders", away: "Seattle Seahawks" },
    { home: "Dallas Cowboys", away: "Arizona Cardinals" }
  ],
  10: [
    { home: "Denver Broncos", away: "Las Vegas Raiders" },
    { home: "Indianapolis Colts", away: "Atlanta Falcons" },
    { home: "Carolina Panthers", away: "New Orleans Saints" },
    { home: "Chicago Bears", away: "New York Giants" },
    { home: "Houston Texans", away: "Jacksonville Jaguars" },
    { home: "Miami Dolphins", away: "Buffalo Bills" },
    { home: "Minnesota Vikings", away: "Baltimore Ravens" },
    { home: "New York Jets", away: "Cleveland Browns" },
    { home: "Tampa Bay Buccaneers", away: "New England Patriots" },
    { home: "Seattle Seahawks", away: "Arizona Cardinals" },
    { home: "San Francisco 49ers", away: "Los Angeles Rams" },
    { home: "Washington Commanders", away: "Detroit Lions" },
    { home: "Los Angeles Chargers", away: "Pittsburgh Steelers" },
    { home: "Green Bay Packers", away: "Philadelphia Eagles" }
  ],
  11: [
    { home: "New England Patriots", away: "New York Jets" },
    { home: "Miami Dolphins", away: "Washington Commanders" },
    { home: "Atlanta Falcons", away: "Carolina Panthers" },
    { home: "Buffalo Bills", away: "Tampa Bay Buccaneers" },
    { home: "Jacksonville Jaguars", away: "Los Angeles Chargers" },
    { home: "Minnesota Vikings", away: "Chicago Bears" },
    { home: "New York Giants", away: "Green Bay Packers" },
    { home: "Pittsburgh Steelers", away: "Cincinnati Bengals" },
    { home: "Tennessee Titans", away: "Houston Texans" },
    { home: "Arizona Cardinals", away: "San Francisco 49ers" },
    { home: "Los Angeles Rams", away: "Seattle Seahawks" },
    { home: "Cleveland Browns", away: "Baltimore Ravens" },
    { home: "Denver Broncos", away: "Kansas City Chiefs" },
    { home: "Philadelphia Eagles", away: "Detroit Lions" },
    { home: "Las Vegas Raiders", away: "Dallas Cowboys" }
  ],
  12: [
    { home: "Houston Texans", away: "Buffalo Bills" },
    { home: "Baltimore Ravens", away: "New York Jets" },
    { home: "Chicago Bears", away: "Pittsburgh Steelers" },
    { home: "Cincinnati Bengals", away: "New England Patriots" },
    { home: "Detroit Lions", away: "New York Giants" },
    { home: "Green Bay Packers", away: "Minnesota Vikings" },
    { home: "Kansas City Chiefs", away: "Indianapolis Colts" },
    { home: "Tennessee Titans", away: "Seattle Seahawks" },
    { home: "Arizona Cardinals", away: "Jacksonville Jaguars" },
    { home: "Las Vegas Raiders", away: "Cleveland Browns" },
    { home: "Dallas Cowboys", away: "Philadelphia Eagles" },
    { home: "New Orleans Saints", away: "Atlanta Falcons" },
    { home: "Los Angeles Rams", away: "Tampa Bay Buccaneers" },
    { home: "San Francisco 49ers", away: "Carolina Panthers" }
  ], 
  13: [
    { home: "Detroit Lions", away: "Green Bay Packers" },
    { home: "Dallas Cowboys", away: "Kansas City Chiefs" },
    { home: "Baltimore Ravens", away: "Cincinnati Bengals" },
    { home: "Philadelphia Eagles", away: "Chicago Bears" },
    { home: "Carolina Panthers", away: "Los Angeles Rams" },
    { home: "Cleveland Browns", away: "San Francisco 49ers" },
    { home: "Indianapolis Colts", away: "Houston Texans" },
    { home: "Miami Dolphins", away: "New Orleans Saints" },
    { home: "New York Jets", away: "Atlanta Falcons" },
    { home: "Tampa Bay Buccaneers", away: "Arizona Cardinals" },
    { home: "Tennessee Titans", away: "Jacksonville Jaguars" },
    { home: "Seattle Seahawks", away: "Minnesota Vikings" },
    { home: "Los Angeles Chargers", away: "Las Vegas Raiders" },
    { home: "Pittsburgh Steelers", away: "Buffalo Bills" },
    { home: "Washington Commanders", away: "Denver Broncos" },
    { home: "New England Patriots", away: "New York Giants" }
  ],
  14: [
    { home: "Detroit Lions", away: "Dallas Cowboys" },
    { home: "Atlanta Falcons", away: "Seattle Seahawks" },
    { home: "Baltimore Ravens", away: "Pittsburgh Steelers" },
    { home: "Cleveland Browns", away: "Tennessee Titans" },
    { home: "Green Bay Packers", away: "Chicago Bears" },
    { home: "Jacksonville Jaguars", away: "Indianapolis Colts" },
    { home: "Minnesota Vikings", away: "Washington Commanders" },
    { home: "New York Jets", away: "Miami Dolphins" },
    { home: "Tampa Bay Buccaneers", away: "New Orleans Saints" },
    { home: "Las Vegas Raiders", away: "Denver Broncos" },
    { home: "Arizona Cardinals", away: "Los Angeles Rams" },
    { home: "Buffalo Bills", away: "Cincinnati Bengals" },
    { home: "Kansas City Chiefs", away: "Houston Texans" },
    { home: "Los Angeles Chargers", away: "Philadelphia Eagles" }
  ],
  15: [
    { home: "Tampa Bay Buccaneers", away: "Atlanta Falcons" },
    { home: "Chicago Bears", away: "Cleveland Browns" },
    { home: "Cincinnati Bengals", away: "Baltimore Ravens" },
    { home: "Houston Texans", away: "Arizona Cardinals" },
    { home: "Jacksonville Jaguars", away: "New York Jets" },
    { home: "Kansas City Chiefs", away: "Los Angeles Chargers" },
    { home: "New England Patriots", away: "Buffalo Bills" },
    { home: "New York Giants", away: "Washington Commanders" },
    { home: "Philadelphia Eagles", away: "Las Vegas Raiders" },
    { home: "Denver Broncos", away: "Green Bay Packers" },
    { home: "Los Angeles Rams", away: "Detroit Lions" },
    { home: "New Orleans Saints", away: "Carolina Panthers" },
    { home: "Seattle Seahawks", away: "Indianapolis Colts" },
    { home: "San Francisco 49ers", away: "Tennessee Titans" },
    { home: "Dallas Cowboys", away: "Minnesota Vikings" },
    { home: "Pittsburgh Steelers", away: "Miami Dolphins" }
  ],
  16: [
    { home: "Seattle Seahawks", away: "Los Angeles Rams" },
    { home: "Chicago Bears", away: "Green Bay Packers" },
    { home: "Washington Commanders", away: "Philadelphia Eagles" },
    { home: "Baltimore Ravens", away: "New England Patriots" },
    { home: "Carolina Panthers", away: "Tampa Bay Buccaneers" },
    { home: "Cleveland Browns", away: "Buffalo Bills" },
    { home: "Dallas Cowboys", away: "Los Angeles Chargers" },
    { home: "New Orleans Saints", away: "New York Jets" },
    { home: "New York Giants", away: "Minnesota Vikings" },
    { home: "Tennessee Titans", away: "Kansas City Chiefs" },
    { home: "Arizona Cardinals", away: "Atlanta Falcons" },
    { home: "Denver Broncos", away: "Jacksonville Jaguars" },
    { home: "Detroit Lions", away: "Pittsburgh Steelers" },
    { home: "Houston Texans", away: "Las Vegas Raiders" },
    { home: "Miami Dolphins", away: "Cincinnati Bengals" },
    { home: "Indianapolis Colts", away: "San Francisco 49ers" }
  ],
  17: [
    { home: "Washington Commanders", away: "Dallas Cowboys" },
    { home: "Minnesota Vikings", away: "Detroit Lions" },
    { home: "Kansas City Chiefs", away: "Denver Broncos" },
    { home: "Carolina Panthers", away: "Seattle Seahawks" },
    { home: "Cincinnati Bengals", away: "Arizona Cardinals" },
    { home: "Green Bay Packers", away: "Baltimore Ravens" },
    { home: "Los Angeles Chargers", away: "Houston Texans" },
    { home: "Las Vegas Raiders", away: "New York Giants" },
    { home: "Cleveland Browns", away: "Pittsburgh Steelers" },
    { home: "Indianapolis Colts", away: "Jacksonville Jaguars" },
    { home: "Miami Dolphins", away: "Tampa Bay Buccaneers" },
    { home: "New York Jets", away: "New England Patriots" },
    { home: "Tennessee Titans", away: "New Orleans Saints" },
    { home: "Buffalo Bills", away: "Philadelphia Eagles" },
    { home: "San Francisco 49ers", away: "Chicago Bears" },
    { home: "Atlanta Falcons", away: "Los Angeles Rams" }
  ],
  18: [
    { home: "Atlanta Falcons", away: "New Orleans Saints" },
    { home: "Buffalo Bills", away: "New York Jets" },
    { home: "Chicago Bears", away: "Detroit Lions" },
    { home: "Cincinnati Bengals", away: "Cleveland Browns" },
    { home: "Denver Broncos", away: "Los Angeles Chargers" },
    { home: "Houston Texans", away: "Indianapolis Colts" },
    { home: "Jacksonville Jaguars", away: "Tennessee Titans" },
    { home: "Los Angeles Rams", away: "Arizona Cardinals" },
    { home: "Las Vegas Raiders", away: "Kansas City Chiefs" },
    { home: "Minnesota Vikings", away: "Green Bay Packers" },
    { home: "New England Patriots", away: "Miami Dolphins" },
    { home: "New York Giants", away: "Dallas Cowboys" },
    { home: "Philadelphia Eagles", away: "Washington Commanders" },
    { home: "Pittsburgh Steelers", away: "Baltimore Ravens" },
    { home: "San Francisco 49ers", away: "Seattle Seahawks" },
    { home: "Tampa Bay Buccaneers", away: "Carolina Panthers" }
  ]
};

async function fetchOddsFromApi() {
  const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=us&markets=spreads&oddsFormat=american&apiKey=${ODDS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Odds API error ${res.status}: ${text}`);
  }
  return res.json();
}

function extractSpreadsFromGame(apiGame) {
  const bookmaker = apiGame.bookmakers?.[0];
  const spreadMarket = bookmaker?.markets?.find(m => m.key === 'spreads');
  if (!spreadMarket?.outcomes) return null;

  const spreads = {};
  for (const outcome of spreadMarket.outcomes) {
    spreads[outcome.name] = outcome.point;
  }
  return spreads;
}

function findOfficialGame(apiGame, officialGames) {
  return officialGames.find(
    g =>
      (g.home === apiGame.home_team && g.away === apiGame.away_team) ||
      (g.home === apiGame.away_team && g.away === apiGame.home_team)
  );
}

async function printGamesOddsForWeek(targetWeek = 2) {
  console.log(`Fetching odds from API (week ${targetWeek})...`);
  const apiData = await fetchOddsFromApi();

  const officialGames = weekGamesByWeek[targetWeek];
  if (!officialGames) {
    console.error(`No official games found for week ${targetWeek}`);
    return;
  }

  // Only keep games matching official Week games
  const weekGames = apiData.filter(g => findOfficialGame(g, officialGames));

  console.log(`Found ${weekGames.length} matching games in week ${targetWeek}:`);

  weekGames.forEach(g => {
    const game_code = String(g.id);
    const spreads = extractSpreadsFromGame(g);
    if (!spreads || Object.keys(spreads).length === 0) {
      console.warn(`Skipping ${game_code} — no spreads found.`);
      return;
    }
    console.log(`Game ${game_code}: ${g.home_team} vs ${g.away_team} -> spreads:`, spreads);
  });
}

(async () => {
  try {
    const week = 18;
    await printGamesOddsForWeek(week);
    process.exit(0);
  } catch (err) {
    console.error('Fatal:', err);
    process.exit(1);
  }
})();
