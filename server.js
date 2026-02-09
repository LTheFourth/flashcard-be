const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const Joi = require('joi');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Data file path
const DATA_FILE = path.join(__dirname, 'flashcards.json');

// Flashcard schema for validation
const flashcardSchema = Joi.object({
  chinese: Joi.string().required(),
  pinyin: Joi.string().required(),
  vietnamese: Joi.string().required(),
  example: Joi.string().required(),
  example_vi: Joi.string().required()
});

// Helper functions
async function readFlashcards() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function writeFlashcards(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /flashcards/:level - Get all flashcards for a specific level
app.get('/flashcards/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const flashcards = await readFlashcards();
    
    if (!flashcards[level]) {
      return res.status(404).json({ error: `Level '${level}' not found` });
    }
    
    res.json(flashcards[level]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    
    // Read existing data
    const flashcards = await readFlashcards();
    
    // Initialize level if it doesn't exist
    if (!flashcards[level]) {
      flashcards[level] = [];
    }
    
    // Add new flashcards
    flashcards[level].push(...newFlashcards);
    
    // Save data
    await writeFlashcards(flashcards);
    
    res.status(201).json({
      message: `Added ${newFlashcards.length} flashcards to level '${level}'`,
      total: flashcards[level].length
    });
  } catch (error) {
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
