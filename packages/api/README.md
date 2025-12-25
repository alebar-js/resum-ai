# API Package

## Environment Variables

Create a `.env` file in this directory (`packages/api/.env`) with the following variables:

```env
# API Configuration
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/resumai

# Gemini API (for AI features: Refactor and Cleanup)
# Get your API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

## Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into your `.env` file

## Running the API

```bash
# Development
pnpm --filter api dev

# Production
pnpm --filter api build
pnpm --filter api start
```

