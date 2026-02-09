require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  try {
    console.log('Setting up Supabase database schema...');
    
    // Check if table exists
    const { data: tables, error: tableError } = await supabase
      .from('flashcards')
      .select('id')
      .limit(1);
    
    if (!tableError) {
      console.log('✅ Flashcards table already exists');
    } else {
      console.log('⚠️  Table may not exist. Please run the SQL from schema.sql in your Supabase dashboard:');
      console.log('https://vslennkybtjcifjgatwq.supabase.co/project/sql');
      console.log('\nSQL to run:');
      console.log('```sql');
      console.log('-- Create flashcards table');
      console.log('CREATE TABLE IF NOT EXISTS flashcards (');
      console.log('  id SERIAL PRIMARY KEY,');
      console.log('  level VARCHAR(10) NOT NULL,');
      console.log('  chinese TEXT NOT NULL,');
      console.log('  pinyin TEXT NOT NULL,');
      console.log('  vietnamese TEXT NOT NULL,');
      console.log('  example TEXT NOT NULL,');
      console.log('  example_vi TEXT NOT NULL,');
      console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,');
      console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');
      console.log(');');
      console.log('');
      console.log('-- Create index for faster queries by level');
      console.log('CREATE INDEX IF NOT EXISTS idx_flashcards_level ON flashcards(level);');
      console.log('```');
    }
    
    console.log('🎉 Database setup completed!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase().then(() => {
  console.log('Setup script finished');
  process.exit(0);
});
