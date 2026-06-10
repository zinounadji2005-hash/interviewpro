# Migration from Replit to Local Development

This document outlines the changes made to migrate the project from Replit to a local development setup with Supabase, Gemini, and Groq.

## Changes Summary

### 1. Removed Replit Dependencies

- **Deleted Files:**
  - `.replit` - Replit configuration file
  - `replit.md` - Replit-specific documentation

- **Removed NPM Packages:**
  - `@replit/vite-plugin-cartographer`
  - `@replit/vite-plugin-dev-banner`
  - `@replit/vite-plugin-runtime-error-modal`

- **Removed Code:**
  - Replit Vite plugins from `vite.config.ts`
  - Replit authentication system (replaced with Supabase Auth)
  - Replit-specific environment variable references

### 2. Updated Build Configuration

- **vite.config.ts:**
  - Removed all Replit-specific plugins
  - Simplified to use only React plugin

- **package.json:**
  - Added `cross-env` for cross-platform environment variable handling
  - Updated scripts to use `cross-env` for Windows compatibility
  - Removed Replit dev dependencies
  - Added `@google/generative-ai` for Gemini
  - Added `groq-sdk` for Groq
  - Kept `openai` for TTS (Groq doesn't support TTS yet)

### 3. AI Service Migration

#### From OpenAI (via Replit) to Gemini

- **Created:** `server/ai-gemini.ts`
  - All AI functions now use Google Gemini API
  - Functions migrated:
    - `optimizeCV()`
    - `generateInterviewQuestions()`
    - `evaluateAnswer()`
    - `generateSessionEvaluation()`
    - `detectWeaknessPatterns()`
    - `analyzeAnswer()`
    - `generateAdaptiveQuestion()`

- **Updated:** `server/ai.ts`
  - Now re-exports from `ai-gemini.ts`

- **Updated:** `server/nameValidation.ts`
  - CV name extraction now uses Gemini

- **Updated:** `server/voice-interview.ts`
  - Question generation uses Gemini
  - Answer evaluation uses Gemini

#### Voice Services: Groq for STT, OpenAI for TTS

- **Created:** `server/audio-groq.ts`
  - `speechToText()` - Uses Groq Whisper API
  - `textToSpeech()` - Uses OpenAI TTS (Groq doesn't support TTS)
  - Includes fallback to OpenAI if Groq fails

- **Updated:** `server/voice-interview.ts`
  - Imports from `audio-groq.ts` instead of Replit integrations

### 4. Database Configuration

- **No changes needed** - Already using Supabase PostgreSQL via `DATABASE_URL`
- Database connection in `server/db.ts` remains unchanged
- Supabase Auth already implemented in `server/supabase-auth.ts`

### 5. Environment Variables

**New Required Variables:**
- `GEMINI_API_KEY` - Google Gemini API key
- `GROQ_API_KEY` - Groq API key  
- `OPENAI_API_KEY` - OpenAI API key (for TTS)
- `BASE_URL` - Base URL for redirects (replaces Replit domain variables)

**Removed Variables:**
- `AI_INTEGRATIONS_OPENAI_API_KEY`
- `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `REPL_ID`
- `REPLIT_DOMAINS`
- `REPLIT_DEV_DOMAIN`

**Updated Variables:**
- `DATABASE_URL` - Should point to Supabase PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SUPABASE_URL` - Frontend Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Frontend Supabase anon key

### 6. Authentication

- **Already using Supabase Auth** - No changes needed
- Removed Replit Auth references from `server/supabase-auth.ts`
- Updated `getBaseUrl()` to use `BASE_URL` environment variable

### 7. Documentation

- **Created:** `README.md` - Comprehensive setup guide
- **Created:** `.env.example` - Environment variable template
- **Updated:** Comments in `shared/models/auth.ts` - Removed Replit references

## Migration Checklist

- [x] Remove Replit configuration files
- [x] Remove Replit NPM packages
- [x] Update Vite configuration
- [x] Migrate AI services to Gemini
- [x] Migrate voice services to Groq (STT) and OpenAI (TTS)
- [x] Update environment variables
- [x] Update authentication references
- [x] Create environment template
- [x] Create comprehensive README
- [x] Update package.json scripts

## Notes

1. **Groq TTS Limitation:** Groq doesn't currently support text-to-speech, so OpenAI TTS is used as a fallback. You can replace this with another TTS service (ElevenLabs, Google TTS, etc.) if preferred.

2. **Replit Integration Folders:** The `server/replit_integrations/` and `client/replit_integrations/` folders are left in place but are no longer used. You can safely delete them if desired.

3. **Windows Compatibility:** Scripts now use `cross-env` for Windows compatibility when setting environment variables.

4. **Database:** Ensure your Supabase database has all required tables. Run `npm run db:push` to sync the schema.

## Next Steps

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in all values
3. Run database migrations: `npm run db:push`
4. Start development server: `npm run dev`

## API Key Setup

1. **Gemini:** Get API key from https://makersuite.google.com/app/apikey
2. **Groq:** Get API key from https://console.groq.com/keys
3. **OpenAI:** Get API key from https://platform.openai.com/api-keys
4. **Supabase:** Get credentials from your Supabase project settings
