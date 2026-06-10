# Quick Start Guide

## ⚠️ Prerequisites Check

Before running the project, make sure you have:

1. **Node.js installed** (version 20 or higher)
   - Download: https://nodejs.org/
   - After installing, **restart your terminal**

2. **All API keys ready** (see below)

## 🚀 Running the Project

### Step 1: Install Dependencies

Open PowerShell or Command Prompt in this directory and run:

```powershell
npm install
```

**If you get "npm is not recognized":**
- Make sure Node.js is installed
- Restart your terminal after installing Node.js
- Try: `C:\Program Files\nodejs\npm.cmd install`

### Step 2: Configure Environment Variables

The `.env` file has been created. You need to edit it and add your API keys:

1. Open `.env` in a text editor
2. Replace all placeholder values with your actual API keys:

#### Required Keys:

**Supabase** (Database & Auth):
- `DATABASE_URL` - From Supabase: Settings > Database > Connection string
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - From Supabase: Settings > API
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase: Settings > API

**Google Gemini**:
- `GEMINI_API_KEY` - Get from: https://makersuite.google.com/app/apikey

**Groq**:
- `GROQ_API_KEY` - Get from: https://console.groq.com/keys

**OpenAI**:
- `OPENAI_API_KEY` - Get from: https://platform.openai.com/api-keys

### Step 3: Set Up Database

```powershell
npm run db:push
```

This creates all required tables in your Supabase database.

### Step 4: Start the Server

```powershell
npm run dev
```

The application will start at: **http://localhost:5000**

## 📝 Minimum Setup (For Testing)

If you just want to test the setup without all features:

1. **Supabase** - Required (for database and auth)
2. **Gemini** - Required (for AI features)
3. **Groq** - Optional (only needed for voice interviews)
4. **OpenAI** - Optional (only needed for voice TTS)

You can start with just Supabase + Gemini to test basic functionality.

## 🐛 Troubleshooting

### "npm is not recognized"
- Install Node.js from https://nodejs.org/
- Restart your terminal
- Verify: `node --version` should show a version number

### Port 5000 already in use
- Change `PORT=5000` to `PORT=3000` in `.env`
- Update `BASE_URL` to match

### Database connection errors
- Check your Supabase connection string
- Make sure you ran `npm run db:push`
- Verify your Supabase project is active

### Missing module errors
- Run `npm install` again
- Delete `node_modules` folder and `package-lock.json`, then run `npm install`

## ✅ Success Checklist

- [ ] Node.js installed and working (`node --version`)
- [ ] Dependencies installed (`npm install` completed)
- [ ] `.env` file created and configured
- [ ] Database schema pushed (`npm run db:push` completed)
- [ ] Server starts without errors (`npm run dev`)

Once all checkboxes are done, open http://localhost:5000 in your browser!
