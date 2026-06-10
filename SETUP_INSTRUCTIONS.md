# Quick Setup Instructions

## Prerequisites

1. **Install Node.js** (if not already installed):
   - Download from: https://nodejs.org/
   - Install Node.js 20 or higher
   - Verify installation by opening a new terminal and running:
     ```bash
     node --version
     npm --version
     ```

## Setup Steps

### 1. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

### 2. Create Environment File

Copy `.env.example` to `.env`:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**Windows CMD:**
```cmd
copy .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit the `.env` file and fill in all required values:

#### Required API Keys:

1. **Supabase** (Database & Auth):
   - Go to https://supabase.com
   - Create a new project
   - Get your database connection string from: Project Settings > Database > Connection string (URI)
   - Get API keys from: Project Settings > API

2. **Google Gemini**:
   - Go to https://makersuite.google.com/app/apikey
   - Create an API key

3. **Groq** (for Speech-to-Text):
   - Go to https://console.groq.com/keys
   - Create an API key

4. **OpenAI** (for Text-to-Speech):
   - Go to https://platform.openai.com/api-keys
   - Create an API key

### 4. Set Up Database Schema

Run the database migration:

```bash
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:5000**

## Troubleshooting

### Node.js/npm not found

If you get "npm is not recognized":
1. Make sure Node.js is installed
2. Restart your terminal after installing Node.js
3. Try using the full path to npm (usually in `C:\Program Files\nodejs\`)

### Port Already in Use

If port 5000 is already in use:
1. Change `PORT=5000` in your `.env` file to a different port (e.g., `PORT=3000`)
2. Update `BASE_URL` accordingly

### Database Connection Errors

Make sure:
- Your Supabase project is active
- The database connection string is correct
- You've run `npm run db:push` to create tables

### Missing API Keys

All API keys are required for the application to work:
- Without Gemini: CV optimization and interviews won't work
- Without Groq: Voice interviews won't work
- Without OpenAI: Text-to-speech won't work
- Without Supabase: Authentication and database won't work

## Next Steps

Once the server is running:
1. Open http://localhost:5000 in your browser
2. Sign up for a new account
3. Upload a CV to get started
