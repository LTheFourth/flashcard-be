-- Create flashcards table
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
);

-- Create index for faster queries by level
CREATE INDEX IF NOT EXISTS idx_flashcards_level ON flashcards(level);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_flashcards_updated_at 
  BEFORE UPDATE ON flashcards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
