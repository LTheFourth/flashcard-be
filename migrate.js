require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateData() {
  try {
    // Read existing JSON data
    const data = await fs.readFile('flashcards.json', 'utf8');
    const flashcards = JSON.parse(data);
    
    console.log('Starting migration to Supabase...');
    
    for (const [level, cards] of Object.entries(flashcards)) {
      console.log(`Migrating ${cards.length} flashcards for level: ${level}`);
      
      // Insert cards in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < cards.length; i += batchSize) {
        const batch = cards.slice(i, i + batchSize);
        const flashcardsWithLevel = batch.map(card => ({
          ...card,
          level
        }));
        
        const { data: insertedData, error } = await supabase
          .from('flashcards')
          .insert(flashcardsWithLevel)
          .select();
        
        if (error) {
          console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
          throw error;
        }
        
        console.log(`Migrated batch ${Math.floor(i/batchSize) + 1} for level ${level}`);
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify migration
    const { data: summary, error } = await supabase
      .from('flashcards')
      .select('level')
      .then(({ data }) => {
        const counts = {};
        data.forEach(item => {
          counts[item.level] = (counts[item.level] || 0) + 1;
        });
        return { data: counts };
      });
    
    if (error) {
      console.error('Error verifying migration:', error);
    } else {
      console.log('Migration summary:');
      Object.entries(summary.data).forEach(([level, count]) => {
        console.log(`  ${level}: ${count} flashcards`);
      });
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData().then(() => {
  console.log('Migration script finished');
  process.exit(0);
});
