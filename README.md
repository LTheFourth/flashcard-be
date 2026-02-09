# Flashcard API

An Express.js API for managing HSK vocabulary flashcards by levels.

## Endpoints

### GET /flashcards/:level
Get all flashcards for a specific level.

**Example:**
```bash
GET /flashcards/hsk1
```

**Response:**
```json
[
  {
    "chinese": "安静",
    "pinyin": "ānjìng",
    "vietnamese": "yên tĩnh, trầm lặng",
    "example": "请安静，图书馆里不准大声说话。",
    "example_vi": "Xin hãy yên lặng, trong thư viện không được phép nói chuyện lớn tiếng."
  }
]
```

### POST /flashcards/:level
Add flashcards to a level (creates level if it doesn't exist).

**Example:**
```bash
POST /flashcards/hsk1
Content-Type: application/json

[
  {
    "chinese": "安静",
    "pinyin": "ānjìng",
    "vietnamese": "yên tĩnh, trầm lặng",
    "example": "请安静，图书馆里不准大声说话。",
    "example_vi": "Xin hãy yên lặng, trong thư viện không được phép nói chuyện lớn tiếng."
  }
]
```

**Response:**
```json
{
  "message": "Added 1 flashcards to level 'hsk1'",
  "total": 1
}
```

## Installation

```bash
npm install
```

## Running

```bash
# Development
npm run dev

# Production
npm start
```

## Data Storage

Flashcards are stored in `flashcards.json` file with the following structure:

```json
{
  "hsk1": [
    {
      "chinese": "安静",
      "pinyin": "ānjìng",
      "vietnamese": "yên tĩnh, trầm lặng",
      "example": "请安静，图书馆里不准大声说话。",
      "example_vi": "Xin hãy yên lặng, trong thư viện không được phép nói chuyện lớn tiếng."
    }
  ],
  "hsk2": []
}
```
