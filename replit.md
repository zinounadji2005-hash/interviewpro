# InterviewPro - AI-Powered Job Interview Preparation Platform

## Overview

InterviewPro is a full-stack web application that helps job seekers prepare for interviews through AI-powered CV optimization, realistic mock interviews, structured feedback scoring, and progress tracking. Users upload their CVs, target specific job roles, practice with AI-generated interview questions, receive detailed performance evaluations, and track improvement across multiple sessions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for Replit environment
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Component Library**: shadcn/ui (Radix UI primitives) with New York style variant
- **Design System**: Material Design 3 principles - Inter for body text, Lexend for headings

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under `/api/*` prefix
- **File Uploads**: Multer for CV file handling (PDF/DOCX support)
- **Build**: esbuild for production bundling with selective dependency bundling

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` exports from modular files in `shared/models/`
- **Key Tables**: users, sessions, cvs, interview_sessions, interview_questions, evaluations, weakness_patterns
- **Migrations**: Drizzle Kit with push-based schema sync (`db:push`)

### Authentication
- **Provider**: Supabase Auth (email/password)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Session Management**: Express-session with secure cookies
- **User Storage**: Automatic upsert on login/signup with profile sync
- **Auth Routes**: /login, /signup (frontend), /api/auth/login, /api/auth/signup, /api/auth/logout (backend)

### AI Integration
- **Provider**: OpenAI API via Replit AI Integrations proxy
- **Model**: GPT-4o for CV optimization and interview evaluation
- **Features**: CV text optimization, interview question generation, answer evaluation, session scoring, weakness pattern detection
- **Audio Support**: Voice chat capabilities with text-to-speech and speech-to-text

### Voice Interview Feature
- **Route**: /dashboard/voice-interview
- **Flow**: Setup (CV/type selection) → Interview (recording/AI questions) → Complete (scores/transcript)
- **Phases**: 4 phases with 8 total questions (warmup, core, deepdive, closing)
- **Audio**: MediaRecorder API for recording, Web Audio API for waveform visualization
- **AI Integration**: OpenAI Whisper for transcription, TTS for speech synthesis
- **Scoring**: Real-time tracking of communication, confidence, relevance, structure (0-100)
- **Adaptive Questioning**: AI adjusts questions based on candidate's previous answers

### Credit System
- **Default Balance**: New users start with 100 credits
- **Credit Costs**:
  - CV optimization: 10 credits
  - Start new interview: 20 credits
  - Voice interview session: 20 credits
  - Interview evaluation: 15 credits
- **Storage**: credits field in users table (integer, default 100)
- **API Endpoints**: /api/credits (GET), credits included in /api/dashboard response
- **Error Handling**: HTTP 402 for insufficient credits with descriptive messages
- **UI**: Credit balance card on dashboard with low-balance warning (<30 credits)

### Intelligence Layer
- **Executive Feedback Summary**: After each interview evaluation:
  - Top 3 critical mistakes
  - Top 3 improvement points
  - 1 Focus Point (single most impactful action)
- **Round Comparison**: When viewing evaluation of 2nd+ interview:
  - Compares scores with previous interview of same type
  - Shows change labels: Improved/No change/Regressed per dimension
  - Displays overall point change prominently
- **Interview Readiness Score**: Weighted aggregate displayed on dashboard:
  - CV quality (25% weight, from ATS score)
  - Interview performance (50% weight, latest overall score)
  - Improvement delta (25% weight, change from previous session)
  - Labels: Not Ready (<50), Improving (50-69), Interview Ready (70+)

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (landing, dashboard, ui primitives)
    pages/        # Route pages (landing, dashboard sections)
    hooks/        # Custom React hooks (auth, toast, mobile detection)
    lib/          # Utilities (query client, auth utils)
server/           # Express backend
  replit_integrations/  # Replit-specific integrations (auth, audio, chat, image)
shared/           # Shared types and database schema
  models/         # Drizzle table definitions
migrations/       # Database migrations output
```

## External Dependencies

### Core Services
- **PostgreSQL Database**: Primary data store (provisioned via Replit)
- **OpenAI API**: AI features via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables
- **Supabase Auth**: User authentication via Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SESSION_SECRET`)

### Key NPM Packages
- **drizzle-orm** / **drizzle-kit**: Database ORM and migrations
- **@tanstack/react-query**: Async state management
- **openai**: AI API client
- **multer**: File upload handling
- **passport** / **openid-client**: Authentication
- **express-session** / **connect-pg-simple**: Session management
- **zod**: Runtime validation
- **recharts**: Data visualization for progress charts