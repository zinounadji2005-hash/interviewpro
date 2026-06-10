# InterviewPro - AI-Powered Job Interview Preparation Platform

A full-stack web application that helps job seekers prepare for interviews through AI-powered CV optimization, realistic mock interviews, structured feedback scoring, and progress tracking.

## Features

- **CV Optimization**: Upload and optimize your CV with AI-powered suggestions
- **Mock Interviews**: Practice with AI-generated interview questions (behavioral, technical, HR)
- **Adaptive Interviews**: Dynamic questioning that adapts based on your answers
- **Voice Interviews**: Real-time voice-based interview practice with speech recognition
- **Performance Evaluation**: Detailed scoring across communication, confidence, relevance, and structure
- **Progress Tracking**: Track improvement across multiple interview sessions
- **Credit System**: Freemium model with free and paid credits

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js + Express, TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **AI Services**:
  - **Gemini** (Google): CV optimization, interview questions, answer evaluation
  - **Groq**: Speech-to-text transcription
  - **OpenAI**: Text-to-speech synthesis (Groq doesn't support TTS yet)

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL database (Supabase recommended)
- API keys for:
  - Google Gemini
  - Groq
  - OpenAI (for TTS)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Hello-Who-Are-You
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > Database and copy the connection string
3. Go to Project Settings > API and copy your URL and anon key
4. For user sync functionality, also copy your service role key

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

```bash
cp .env.example .env
```

Required environment variables:

- `DATABASE_URL`: Supabase PostgreSQL connection string
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin functions)
- `SESSION_SECRET`: Random secret string for session encryption
- `GEMINI_API_KEY`: Google Gemini API key
- `GROQ_API_KEY`: Groq API key
- `OPENAI_API_KEY`: OpenAI API key (for TTS)
- `VITE_SUPABASE_URL`: Same as SUPABASE_URL (for frontend)
- `VITE_SUPABASE_ANON_KEY`: Same as SUPABASE_ANON_KEY (for frontend)

### 5. Set Up Database Schema

Run database migrations to create all required tables:

```bash
npm run db:push
```

### 6. Seed Initial Data

The application will automatically seed feature costs on startup. If you need to manually seed:

```bash
# The seedFeatureCosts function runs automatically on server start
# Or you can run it manually via the API endpoint
```

### 7. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### 8. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
.
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/      # Route pages
│   │   ├── hooks/      # Custom React hooks
│   │   └── lib/        # Utilities and configs
│   └── public/         # Static assets
├── server/             # Express backend
│   ├── ai-gemini.ts   # Gemini AI service
│   ├── audio-groq.ts  # Groq audio service
│   ├── routes.ts      # API routes
│   └── ...
├── shared/             # Shared types and schema
│   ├── models/        # Database models
│   └── schema.ts      # Schema exports
└── dist/              # Build output (generated)
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### CV Management
- `GET /api/cvs` - Get user's CVs
- `POST /api/cvs/upload` - Upload a CV
- `POST /api/cvs/:id/optimize` - Optimize a CV
- `POST /api/cvs/:id/confirm` - Confirm CV ownership

### Interviews
- `GET /api/interviews` - Get user's interviews
- `POST /api/interviews` - Create standard interview
- `POST /api/interviews/adaptive` - Create adaptive interview
- `POST /api/interviews/:id/answer` - Submit answer
- `POST /api/interviews/:id/finish` - Finish interview

### Voice Interviews
- `POST /api/voice-interview/start` - Start voice interview
- `POST /api/voice-interview/answer` - Submit voice answer
- `POST /api/voice-interview/end` - End voice interview

### Credits
- `GET /api/credits` - Get user credit balance
- `GET /api/credit-packages` - Get available credit packages
- `GET /api/credit-history` - Get transaction history
- `POST /api/credits/grant` - Grant credits (admin)

### Evaluations
- `GET /api/evaluations/:id` - Get evaluation results
- `POST /api/evaluations/:id/unlock` - Unlock results with credits

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment (development/production) | No |
| `BASE_URL` | Base URL for redirects | No |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Session encryption secret | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `GROQ_API_KEY` | Groq API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key (for TTS) | Yes |
| `VITE_SUPABASE_URL` | Frontend Supabase URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Frontend Supabase anon key | Yes |

## Development

### Running Type Checks

```bash
npm run check
```

### Database Migrations

```bash
npm run db:push
```

## Production Deployment

1. Set all environment variables in your hosting platform
2. Build the application: `npm run build`
3. Start the server: `npm start`
4. Ensure your database is accessible from your hosting environment
5. Set up proper CORS and security headers

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
