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

### Credit System (Freemium Monetization)
- **Dual Credit Types**: Users have `freeCredits` and `paidCredits` tracked separately
  - Free credits granted on signup (30 credits - covers CV upload + one interview)
  - Paid credits purchased for unlocking results and additional features
  - Free credits consumed first, then paid credits
- **Feature Costs** (configurable in database via `feature_costs` table):
  - cv_optimization: 10 credits
  - start_interview: 20 credits
  - voice_interview: 20 credits
  - interview_evaluation: 0 credits (processing is free)
  - unlock_results: 15 paid credits (requires paid credits only)
- **Results Paywall**:
  - Evaluations have `resultsUnlocked` flag (default false)
  - Locked results return nullified scores and paywall object from API
  - POST /api/evaluations/:id/unlock to unlock with paid credits
  - Transparent UX shows what's included when unlocked
- **Credit Packages** (configurable in database via `credit_packages` table):
  - Supports multiple packages with name, description, credit amount, price, currency
  - Active/inactive flag for visibility control
- **Transaction Logging** (via `credit_transactions` table):
  - All credit mutations logged with balanceAfter, transactionType, source, featureKey
  - Tracks creditType field ("free", "paid", or "mixed") for audit trail
  - Idempotency keys prevent duplicate credit grants from payment callbacks
  - Sources: payment, signup_bonus, referral, promo_code, admin_grant, feature_use, refund
- **Credit Service** (server/creditService.ts):
  - Atomic operations with database transactions
  - Negative balance prevention
  - Idempotent grant operations via unique keys
  - Database-driven pricing - all costs fetched from feature_costs table
- **API Endpoints**:
  - GET /api/feature-costs - List all feature costs (public)
  - GET /api/credit-packages - List all active packages (public)
  - GET /api/credit-history - User's transaction history (authenticated)
  - POST /api/credits/grant - Grant credits with idempotency (authenticated)
  - POST /api/evaluations/:id/unlock - Unlock results with paid credits
- **Error Handling**: HTTP 402 for insufficient credits with descriptive messages
- **UI**: Credit balance card showing free/paid breakdown + credit history on dashboard

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

### Legal & Policy Pages
- **Terms of Use** (/terms): User responsibilities, prohibited activities, IP rights, liability limits
- **Privacy Policy** (/privacy): Data collection, storage, sharing, user rights with exercise process
- **Acceptable Use Policy** (/acceptable-use): Prohibited activities, CV ownership rules, consequences
- **Refund & Credit Policy** (/refund-policy): Credit system details, refund eligibility, process
- **AI Disclaimer** (/ai-disclaimer): Advisory nature of AI, limitations, user responsibility
- **Integration**: Footer links on all pages, required checkbox on signup, dashboard footer disclaimer

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (landing, dashboard, ui primitives)
    pages/        # Route pages (landing, dashboard sections, legal)
      legal/      # Policy pages (terms, privacy, acceptable-use, refund-policy, ai-disclaimer)
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