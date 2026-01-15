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
- **Replit Auth**: User authentication via OIDC (`ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`)

### Key NPM Packages
- **drizzle-orm** / **drizzle-kit**: Database ORM and migrations
- **@tanstack/react-query**: Async state management
- **openai**: AI API client
- **multer**: File upload handling
- **passport** / **openid-client**: Authentication
- **express-session** / **connect-pg-simple**: Session management
- **zod**: Runtime validation
- **recharts**: Data visualization for progress charts