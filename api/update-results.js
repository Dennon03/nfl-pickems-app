// scripts/update-picks.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);


const winningTeams = [
  'Los Angeles Chargers',
  'Miami Dolphins',
  'New York Jets',
  'New England Patriots',
  'Philadelphia Eagles',
  'Buffalo Bills',
  'Baltimore Ravens',
  'Houston Texans',
  'Tampa Bay Buccaneers',
  'Denver Broncos',
  'Indianapolis Colts',
  'Green Bay Packers',
  'Kansas City Chiefs'
];

const week = 8; 
async function updateUserPicks() {
  try {
    // Fetch all picks for this week
    const { data: picks, error: fetchError } = await supabase
      .from('user_picks')
      .select('*')
      .eq('week', week);

    if (fetchError) throw fetchError;

    console.log(`Found ${picks.length} picks for week ${week}`);

    for (const pick of picks) {
      const isCorrect = winningTeams.includes(pick.picked_team);

      const { error: updateError } = await supabase
        .from('user_picks')
        .update({ is_correct: isCorrect })
        .eq('id', pick.id);

      if (updateError) {
        console.error(`Error updating pick ${pick.id}:`, updateError.message);
      } else {
        console.log(`Pick ${pick.id} (${pick.picked_team}) updated: is_correct=${isCorrect}`);
      }
    }

    console.log('All picks updated.');
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

updateUserPicks();
