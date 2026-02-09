const { sql } = require('@vercel/postgres');
const fs = require('fs').promises;

async function migrateData() {
  try {
    // Read existing JSON data
    const data = await fs.readFile('flashcards.json', 'utf8');
    const flashcards = JSON.parse(data);
    
    console.log('Starting migration...');
    
    for (const [level, cards] of Object.entries(flashcards)) {
      console.log(`Migrating ${cards.length} flashcards for level: ${level}`);
      
      // Insert cards in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < cards.length; i += batchSize) {
        const batch = cards.slice(i, i + batchSize);
        const values = batch.map(card => 
          sql`(${level}, ${card.chinese}, ${card.pinyin}, ${card.vietnamese}, ${card.example}, ${card.example_vi})`
        );
        
        await sql`
          INSERT INTO flashcards (level, chinese, pinyin, vietnamese, example, example_vi)
          VALUES ${sql.join(values, sql`, `)}
        `;
        
        console.log(`Migrated batch ${Math.floor(i/batchSize) + 1} for level ${level}`);
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify migration
    const { rows } = await sql`SELECT level, COUNT(*) as count FROM flashcards GROUP BY level ORDER BY level`;
    console.log('Migration summary:');
    rows.forEach(row => {
      console.log(`  ${row.level}: ${row.count} flashcards`);
    });
    
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
