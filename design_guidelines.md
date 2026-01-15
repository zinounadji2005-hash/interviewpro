# Design Guidelines: Job Interview Preparation Platform

## Design Approach

**Selected System**: Material Design 3
**Rationale**: This productivity and learning platform requires exceptional clarity for data-heavy interfaces (scores, comparisons, feedback), structured information hierarchy, and professional trustworthiness. Material Design excels at organizing complex information while maintaining accessibility and modern aesthetics.

**Core Principles**:
- **Clarity over decoration**: Every element serves a functional purpose
- **Progressive disclosure**: Reveal complexity gradually to prevent overwhelm
- **Data visualization excellence**: Scores and progress must be immediately understandable
- **Professional confidence**: Design communicates competence and reliability

---

## Typography System

**Font Families** (via Google Fonts):
- **Primary**: Inter (body text, UI elements, data)
- **Display**: Lexend (headings, hero sections, emphasis)

**Hierarchy**:
- **Hero Headline**: text-5xl to text-6xl, font-bold, Lexend
- **Section Headers**: text-3xl to text-4xl, font-semibold, Lexend
- **Card Titles**: text-xl to text-2xl, font-semibold, Inter
- **Body Text**: text-base, font-normal, Inter, leading-relaxed
- **Labels/Metadata**: text-sm, font-medium, Inter
- **Scores/Metrics**: text-4xl to text-6xl, font-bold, tabular-nums

---

## Layout & Spacing System

**Spacing Primitives** (Tailwind units):
- **Core rhythm**: 4, 8, 12, 16, 24 (p-4, gap-8, mb-12, py-16, mt-24)
- **Generous breathing room for data sections**: py-16 to py-24
- **Tight groupings for related info**: gap-2 to gap-4
- **Card padding**: p-6 to p-8

**Container Strategy**:
- Landing page: max-w-7xl centered
- Dashboard: max-w-screen-2xl with sidebar layout
- Content cards: Natural height, never forced viewport constraints
- Reading content: max-w-3xl for optimal readability

---

## Component Library

### Navigation
- **Landing Page Header**: Sticky navigation, logo left, CTA buttons right (Get Started primary, Log In secondary)
- **Dashboard Sidebar**: Fixed left sidebar (w-64), collapsible on mobile, clear section navigation with icons
- **Progress Breadcrumbs**: Show current step in interview journey

### Cards & Containers
- **Elevated Cards**: Subtle shadows (shadow-md), rounded corners (rounded-xl), clear internal padding
- **Info Panels**: Bordered containers for CV comparison, feedback sections
- **Score Cards**: Prominent metric displays with icon, number, label structure
- **Timeline Items**: Connected vertical timeline for session history

### Forms & Inputs
- **File Upload Zone**: Large dropzone with drag-and-drop visual feedback, clear file type indicators
- **Role Selector**: Searchable dropdown with common roles + "Custom" option triggering text area
- **Interview Mode Selector**: Radio button cards with icons and descriptions (not plain radio inputs)
- **Text Inputs**: Full-width with floating labels, helper text below

### Data Visualization
- **Score Breakdown**: Horizontal progress bars for each category (Communication, Confidence, Relevance, Structure)
- **Comparison Charts**: Side-by-side bar charts or radar charts showing Round 1 vs Round 2
- **Progress Indicators**: Circular progress or linear stepper showing interview journey completion

### Feedback Components
- **Executive Summary Cards**: Distinct sections for Top 3 Mistakes (alert style), Top 3 Improvements (success style), Focus Point (highlighted callout)
- **Model Answer Displays**: Expandable panels with answer text + explanatory annotations
- **Weakness Pattern Alerts**: Informational banners with specific actionable insights

### Buttons & Actions
- **Primary CTA**: Large, bold, high contrast (Get Started, Begin Interview, Continue)
- **Secondary Actions**: Outlined or ghost style (View History, Skip for Now)
- **Icon Buttons**: Consistent sizing, tooltips for clarity
- **Blurred backgrounds** on buttons over images

### Navigation & Flow
- **Step Indicators**: Clear visual stepper showing: Upload → Target → Optimize → Interview 1 → Feedback → Interview 2 → Results
- **Back/Forward Navigation**: Always provide clear path forward and ability to review previous steps

---

## Page-Specific Layouts

### Landing Page
**Structure**: 6-7 purposeful sections
1. **Hero**: Large headline emphasizing transformation ("Ace Your Next Interview with AI-Powered Practice"), subheadline with process summary, dual CTAs, large hero image showing dashboard preview or professional interview scene
2. **Process Explanation**: 6-step visual timeline with icons showing Upload CV → Target Role → Improve CV → Interview 1 → Feedback → Interview 2 → Results
3. **Key Features**: 3-column grid showcasing CV Optimization, Mock Interviews, Progress Tracking with icons and concise descriptions
4. **How It Works Detail**: Alternating 2-column layouts with screenshot mockups + explanatory text
5. **Social Proof/Trust**: Testimonial-style cards or success metrics
6. **Final CTA**: Centered call-to-action section with reinforcement message
7. **Footer**: Simple navigation, brief about, no clutter

### Main Dashboard
**Layout**: Sidebar + main content area
- **Left Sidebar**: Navigation (Dashboard, CV Manager, Interview History, Progress, Profile)
- **Main Area**: 
  - Status overview cards (CV uploaded?, Interviews completed, Current score)
  - Quick actions (Start Interview, View Feedback, Upload New CV)
  - Recent activity timeline
  - Progress summary widget

### CV Optimization Page
**Layout**: Side-by-side comparison
- **Left Panel**: Original CV display (scrollable, preserve formatting)
- **Right Panel**: Improved CV with highlighted changes
- **Analysis Section Below**: Expandable cards explaining each improvement with "Why this matters" annotations

### Interview Pages
**Layout**: Clean, focused
- **Header**: Progress indicator, timer (optional), interview type badge
- **Question Display**: Large, clear text with question number
- **Answer Input**: Generous textarea with character/word count
- **Navigation**: Clear "Next Question" button, ability to review previous answers

### Evaluation & Feedback Page
**Layout**: Progressive reveal
1. **Score Hero**: Large overall score (0-100) with celebratory or encouraging messaging
2. **Score Breakdown**: 4 horizontal bars showing category scores
3. **Executive Summary**: 3 distinct cards (Mistakes, Improvements, Focus Point)
4. **Detailed Q&A Review**: Accordion of each question with user answer, evaluation, model answer

### Improvement Analysis Page
**Layout**: Comparison-focused
- **Score Comparison Chart**: Visual chart showing Round 1 vs Round 2 across all categories
- **Improvement Highlights**: Callout cards for significant improvements
- **Areas to Focus**: Cards showing remaining weaknesses
- **Personalized Advice**: Action-oriented recommendations panel
- **Pattern Insights** (if multiple sessions): Alert-style banners showing recurring issues

---

## Images

### Hero Section (Landing Page)
**Large hero image**: Professional interview scene or clean dashboard preview mockup showing the platform in action. Image should convey professionalism, success, and modern technology. Positioned as background with overlay gradient for text readability.

### Process/Feature Sections
**Illustrative screenshots**: Mockups of key features (CV comparison view, score dashboard, interview interface) to build trust and demonstrate value

### Dashboard
**No decorative images**: Focus on data, charts, and functional UI. Only use icons for navigation and feature identification.

---

## Accessibility & Consistency
- Maintain WCAG AA contrast standards throughout
- All interactive elements have clear focus states
- Form inputs have associated labels and error states
- Charts include text-based data tables as alternatives
- Consistent spacing, sizing, and interaction patterns across all pages