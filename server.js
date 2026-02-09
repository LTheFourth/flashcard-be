const express = require('express');
const cors = require('cors');
const Joi = require('joi');
const { sql } = require('@vercel/postgres');

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
  const { rows } = await sql`
    SELECT id, chinese, pinyin, vietnamese, example, example_vi, created_at, updated_at
    FROM flashcards
    WHERE level = ${level}
    ORDER BY id
  `;
  return rows;
}

async function addFlashcards(level, flashcards) {
  const values = flashcards.map(card => 
    sql`(${level}, ${card.chinese}, ${card.pinyin}, ${card.vietnamese}, ${card.example}, ${card.example_vi})`
  );
  
  const { rows } = await sql`
    INSERT INTO flashcards (level, chinese, pinyin, vietnamese, example, example_vi)
    VALUES ${sql.join(values, sql`, `)}
    RETURNING id, chinese, pinyin, vietnamese, example, example_vi, created_at, updated_at
  `;
  
  return rows;
}

async function levelExists(level) {
  const { rows } = await sql`
    SELECT COUNT(*) as count
    FROM flashcards
    WHERE level = ${level}
  `;
  return parseInt(rows[0].count) > 0;
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
    
    // Validate each flashcard
    const validationErrors = [];
    for (let i = 0; i < newFlashcards.length; i++) {
      const { error } = flashcardSchema.validate(newFlashcards[i]);
      if (error) {
        validationErrors.push(`Flashcard ${i + 1}: ${error.details[0].message}`);
      }
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Flashcard API server running on port ${PORT}`);
});
