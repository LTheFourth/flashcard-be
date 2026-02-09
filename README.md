# Flashcard API with Vercel Postgres

An Express.js API for managing HSK vocabulary flashcards by levels, now using Vercel Postgres for scalable database storage.

## Features

- **Database Storage**: Uses Vercel Postgres for scalable, persistent storage
- **RESTful API**: Standard HTTP methods for CRUD operations
- **Data Validation**: Joi schema validation for all inputs
- **Error Handling**: Comprehensive error responses
- **Migration Support**: Easy migration from existing JSON data

## Database Schema

```sql
CREATE TABLE flashcards (
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
```

## Endpoints

### GET /flashcards/:level
Get all flashcards for a specific level.

**Example:**
```bash
GET /flashcards/hsk3
```

**Response:**
```json
[
  {
    "id": 1,
    "level": "hsk3",
    "chinese": "安静",
    "pinyin": "ānjìng",
    "vietnamese": "yên tĩnh, trầm lặng",
    "example": "请安静，图书馆里不准大声说话。",
    "example_vi": "Xin hãy yên lặng, trong thư viện không được phép nói chuyện lớn tiếng.",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /flashcards/:level
Add flashcards to a level (creates level if it doesn't exist).

**Example:**
```bash
POST /flashcards/hsk3
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
  "message": "Added 1 flashcards to level 'hsk3'",
  "total": 151,
  "added": [
    {
      "id": 152,
      "level": "hsk3",
      "chinese": "安静",
      "pinyin": "ānjìng",
      "vietnamese": "yên tĩnh, trầm lặng",
      "example": "请安静，图书馆里不准大声说话。",
      "example_vi": "Xin hãy yên lặng, trong thư viện không được phép nói chuyện lớn tiếng.",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /health
Health check endpoint.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Vercel Postgres
1. Go to your Vercel project dashboard
2. Add a Postgres database from the Storage tab
3. Copy the provided environment variables

### 3. Environment Variables
Create a `.env` file with the Vercel Postgres environment variables:
```bash
cp .env.example .env
```

Add the environment variables provided by Vercel:
```bash
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling
POSTGRES_USER=your_postgres_user
POSTGRES_HOST=your_postgres_host
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_postgres_database
```

### 4. Set Up Database Schema
Run the schema creation script:
```bash
psql $POSTGRES_URL -f schema.sql
```

### 5. Migrate Existing Data (Optional)
If you have existing data in `flashcards.json`, migrate it to the database:
```bash
npm run migrate
```

### 6. Running
```bash
# Development
npm run dev

# Production
npm start
```

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the Postgres database to your project
4. Deploy - Vercel will automatically use the environment variables

## Migration from JSON to Postgres

The migration script (`migrate.js`) will:
- Read existing data from `flashcards.json`
- Insert data into the Postgres database in batches
- Provide a summary of migrated data
- Handle errors gracefully

## Error Handling

The API provides comprehensive error responses:
- **400 Bad Request**: Validation errors or malformed input
- **404 Not Found**: Resource not found (e.g., level doesn't exist)
- **500 Internal Server Error**: Database or server errors

All error responses include a descriptive message and, when applicable, detailed validation errors.
