const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  try {
    console.log('Setting up database schema...');
    
    // Create flashcards table
    await sql`
      CREATE TABLE IF NOT EXISTS flashcards (
        id SERIAL PRIMARY KEY,
        level VARCHAR(10) NOT NULL,
        chinese TEXT NOT NULL,
        pinyin TEXT NOT NULL,
        vietnamese TEXT NOT NULL,
        example TEXT NOT NULL,
        example_vi TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Flashcards table created');

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_flashcards_level ON flashcards(level)
    `;
    console.log('✅ Index created');

    // Create trigger function
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;
    console.log('✅ Trigger function created');

    // Create trigger
    await sql`
      DROP TRIGGER IF EXISTS update_flashcards_updated_at ON flashcards
    `;
    
    await sql`
      CREATE TRIGGER update_flashcards_updated_at 
        BEFORE UPDATE ON flashcards 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;
    console.log('✅ Trigger created');

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase().then(() => {
  console.log('Setup script finished');
  process.exit(0);
});
