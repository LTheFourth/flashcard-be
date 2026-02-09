require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const Joi = require('joi');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Flashcard schema for validation
const flashcardSchema = Joi.object({
  chinese: Joi.string().required(),
  pinyin: Joi.string().required(),
  vietnamese: Joi.string().required(),
  example: Joi.string().required(),
  example_vi: Joi.string().required()
});

// Database helper functions
async function getFlashcardsByLevel(level) {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('level', level)
    .order('id');
  
  if (error) throw error;
  return data;
}

async function addFlashcards(level, flashcards) {
  const flashcardsWithLevel = flashcards.map(card => ({
    ...card,
    level
  }));
  
  const { data, error } = await supabase
    .from('flashcards')
    .insert(flashcardsWithLevel)
    .select();
  
  if (error) throw error;
  return data;
}

async function checkWordExists(level, chinese) {
  const { data, error } = await supabase
    .from('flashcards')
    .select('id')
    .eq('level', level)
    .eq('chinese', chinese)
    .limit(1);
  
  if (error) throw error;
  return data.length > 0;
}

async function deleteAllFlashcardsInLevel(level) {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('level', level);
  
  if (error) throw error;
  return true;
}

async function levelExists(level) {
  const { data, error } = await supabase
    .from('flashcards')
    .select('id')
    .eq('level', level)
    .limit(1);
  
  if (error) throw error;
  return data.length > 0;
}

// GET /flashcards/:level - Get all flashcards for a specific level
app.get('/flashcards/:level', async (req, res) => {
  try {
    const { level } = req.params;
    
    console.log('Level:', level);
    const flashcards = await getFlashcardsByLevel(level);
    
    if (flashcards.length === 0) {
      return res.status(404).json({ error: `Level '${level}' not found` });
    }
    
    res.json(flashcards);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', async (req,res) => {
  res.json({ message: 'Flashcard API is running' });
})

// POST /flashcards/:level - Add flashcards to a level (create level if not exists)
app.post('/flashcards/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const newFlashcards = req.body;
    
    // Validate input
    if (!Array.isArray(newFlashcards)) {
      return res.status(400).json({ error: 'Request body must be an array of flashcards' });
    }
    
    // Validate each flashcard and check for duplicates
    const validationErrors = [];
    const duplicateWords = [];
    
    for (let i = 0; i < newFlashcards.length; i++) {
      const flashcard = newFlashcards[i];
      
      // Validate flashcard structure
      const { error } = flashcardSchema.validate(flashcard);
      if (error) {
        validationErrors.push(`Flashcard ${i + 1}: ${error.details[0].message}`);
      }
      
      // Check if word already exists in this level
      try {
        const exists = await checkWordExists(level, flashcard.chinese);
        if (exists) {
          duplicateWords.push(flashcard.chinese);
        }
      } catch (err) {
        validationErrors.push(`Flashcard ${i + 1}: Error checking for duplicates`);
      }
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    if (duplicateWords.length > 0) {
      return res.status(409).json({ 
        error: 'Duplicate words found', 
        duplicates: duplicateWords,
        message: `${duplicateWords.length} word(s) already exist in level '${level}'` 
      });
    }
    
    // Add new flashcards to database
    const addedFlashcards = await addFlashcards(level, newFlashcards);
    
    // Get total count for this level
    const totalCount = await getFlashcardsByLevel(level);
    
    res.status(201).json({
      message: `Added ${newFlashcards.length} flashcards to level '${level}'`,
      total: totalCount.length,
      added: addedFlashcards
    });
  } catch (error) {
    console.error('Error adding flashcards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /flashcards/:level - Delete all flashcards from a level
app.delete('/flashcards/:level', async (req, res) => {
  try {
    const { level } = req.params;
    
    // Check if level exists
    const exists = await levelExists(level);
    if (!exists) {
      return res.status(404).json({ error: `Level '${level}' not found` });
    }
    
    // Get count before deletion
    const flashcards = await getFlashcardsByLevel(level);
    const count = flashcards.length;
    
    // Delete all flashcards in level
    await deleteAllFlashcardsInLevel(level);
    
    res.json({
      message: `Deleted ${count} flashcards from level '${level}'`,
      deleted_count: count,
      level: level
    });
  } catch (error) {
    console.error('Error deleting flashcards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Flashcard API server running on port ${PORT}`);
});
