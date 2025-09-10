// scripts/update-picks.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Example: list of winning teams
const winningTeams = ['Las Vegas Raiders', 'Tampa Bay Buccaneers', 'Jacksonville Jaguars', 'Washington Commanders', 'Arizona Cardinals', 'Pittsburgh Steelers', 'Denver Broncos', 'Green Bay Packers', 'San Francisco 49ers','Indianapolis Colts','Minnesota Vikings','Los Angeles Rams','Buffalo Bills', 'Cincinnati Bengals', 'Philadelphia Eagles', 'Los Angeles Chargers']; // <-- put your winners here
const week = 1; // Set the week you want to update

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
