# StudyBuddy AI: Architecture & Implementation Plan (`PLAN.md`)

## 1. System Architecture & End-to-End Data Flow

StudyBuddy AI transforms unstructured study materials (raw notes, markdown summaries, lecture transcripts, JSON outlines) into active-recall quizzes powered by OpenAI GPT-4, executes them in an interactive, keyboard-driven assessment engine, and captures longitudinal performance metrics in Firebase Firestore with local resilience.

```
+---------------------------------------------------------------------------------------------------+
|                                  STUDYBUDDY AI CLIENT ARCHITECTURE                                |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ Note Ingestion Engine ]                                                                        |
|  * Drag-and-drop (.txt, .md, .json) & rich textarea editor                                         |
|  * Real-time metrics: word count, token estimator (~4 chars/token), topic extractor               |
|  * Parameter controls: Difficulty (Beginner / Intermediate / Advanced), Question Count (5/10/15)    |
|                                                                                                   |
|                                     |                                                             |
|                                     v                                                             |
|                                                                                                   |
|  [ Generation Dispatcher (Dual-Mode Resilience) ]                                                  |
|  +----------------------------------------------+  +-------------------------------------------+  |
|  | Path A: OpenAI GPT-4 API                     |  | Path B: Smart Offline Deterministic Engine|  |
|  | - Direct HTTPS /v1/chat/completions          |  | - Regex tokenizer & key-concept extractor |  |
|  | - Model: gpt-4o / gpt-4-turbo                |  | - Distractor synthesizer & cloze generator|  |
|  | - response_format: { type: "json_object" }   |  | - 100% deterministic fallback with zero   |  |
|  | - Strict RFC 8259 JSON validation           |  |   API keys needed during testing          |  |
|  +----------------------------------------------+  +-------------------------------------------+  |
|                                     |                                                             |
|                                     v                                                             |
|                                                                                                   |
|  [ Interactive Quiz State Machine (`QuizRunner.jsx`) ]                                            |
|  * Question-by-question stepper with countdown/elapsed timer and progress bar                     |
|  * Keyboard listeners: keys [1], [2], [3], [4] for options, [Enter] to submit/advance             |
|  * Instant Feedback Mode: Green (correct) / Red (selected incorrect) + GPT-4 explanation card    |
|  * Complete assessment scoring: Accuracy %, timing, weak concepts breakdown, retry missed mode   |
|                                                                                                   |
|                                     |                                                             |
|                                     v                                                             |
|                                                                                                   |
|  [ Persistence & Sync Layer (`firebaseService.js`) ]                                              |
|  +----------------------------------------------+  +-------------------------------------------+  |
|  | Firebase Cloud Services                      |  | Local Storage Reactive Mirror             |  |
|  | - Firebase Auth: Anonymous & Google Sign-In |  | - Instant zero-latency UI reads           |  |
|  | - Firestore: users/{uid}/attempts            |  | - Full offline functionality              |  |
|  | - Firestore: users/{uid}/quizzes             |  | - Bi-directional background sync          |  |
|  +----------------------------------------------+  +-------------------------------------------+  |
|                                     |                                                             |
|                                     v                                                             |
|                                                                                                   |
|  [ Longitudinal Score Tracker & Analytics (`ScoreDashboard.jsx`) ]                                |
|  * KPI Header: Total Quizzes, Overall Accuracy %, Active Study Streak (days), Best Topic Mastery  |
|  * Recharts Time-Series: Interactive chronological trendline with topic & difficulty filters      |
|  * Attempt History Table: Search, filter, "Review Answers" modal, and 1-click "Retake Quiz"       |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Directory & File Tree

```
studybuddy-ai/
├── index.html                       # Entry HTML with custom title and high-contrast dark theme meta
├── package.json                     # Dependencies: React 18, Vite, Lucide, Recharts, Firebase, Tailwind
├── postcss.config.js                # PostCSS config with Tailwind and Autoprefixer
├── tailwind.config.js               # Dark-mode color palette (#090D16, #111827, #38BDF8, #10B981)
├── vite.config.js                   # Vite React plugin setup
├── .env.example                     # Reference environment variables for OpenAI and Firebase
├── src/
│   ├── main.jsx                     # Application bootstrap mounting App inside React.StrictMode
│   ├── App.jsx                      # Main layout, tab navigation, global state, settings drawer wiring
│   ├── index.css                    # Tailwind directives and custom scrollbar / monospace styling
│   ├── components/
│   │   ├── Navbar.jsx               # Header with brand logo, streak indicator, status badge, settings toggle
│   │   ├── NoteUploader.jsx         # Module A: Drag-and-drop file ingestion, metrics, topic tagger, config
│   │   ├── QuizRunner.jsx           # Module C: Keyboard-driven quiz state machine with instant explanations
│   │   ├── ScoreDashboard.jsx       # Module D: KPI cards, Recharts time-series chart, attempt history log
│   │   ├── AttemptReviewModal.jsx   # Detailed question-by-question review of any past quiz attempt
│   │   ├── SettingsDrawer.jsx       # Drawer for OpenAI Key, model select, Firebase credentials, fallback toggle
│   │   └── SampleNotesModal.jsx     # Pre-loaded sample notes (Data Structures, OS, ML) for 1-click testing
│   ├── services/
│   │   ├── openaiService.js         # Module B: GPT-4 chat completion client & smart offline fallback generator
│   │   ├── firebaseService.js       # Module D: Firebase v10 modular auth + Firestore sync + localStorage fallback
│   │   └── storageService.js        # Local persistence manager, streak calculator, analytics aggregator
│   └── data/
│       └── sampleNotes.js           # Comprehensive rich study notes across three engineering domains
```

---

## 3. Firestore Schema & Security Rules

### Collections & Document Models

#### 1. Collection: `users/{uid}/quizzes/{quizId}`
Stores generated quiz definitions for fast re-use and sharing.
```typescript
interface QuizDocument {
  id: string;                    // Unique identifier (UUID or Firestore doc ID)
  userId: string;                // UID of creator (or "guest-user")
  topic: string;                 // e.g. "Data Structures: Red-Black Trees"
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  questionCount: number;         // Total questions (e.g. 5, 10, 15)
  sourceNotePreview: string;     // First 250 characters of source notes
  sourceWordCount: number;       // Word count of source note
  createdAt: string;             // ISO-8601 string timestamp
  questions: Array<{
    id: string;
    question: string;
    options: string[];           // Array of 4 answer options
    correctIndex: number;        // 0 to 3
    explanation: string;         // Detailed rationale citing notes
  }>;
}
```

#### 2. Collection: `users/{uid}/attempts/{attemptId}`
Stores every completed evaluation attempt with longitudinal tracking metrics.
```typescript
interface AttemptDocument {
  id: string;                    // Unique attempt ID
  userId: string;                // UID or "guest-user"
  quizId: string;                // Reference to quiz definition
  topic: string;                 // Subject topic
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  score: number;                 // Correct count (e.g. 8)
  totalQuestions: number;        // Total questions (e.g. 10)
  percentage: number;            // Accuracy percentage (e.g. 80.0)
  durationSeconds: number;       // Elapsed test time in seconds
  timestamp: string;             // ISO-8601 string timestamp
  userAnswers: Array<{           // Per-question audit trail
    questionId: string;
    questionText: string;
    selectedOptionIndex: number;
    correctOptionIndex: number;
    isCorrect: boolean;
    explanation: string;
  }>;
}
```

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Each authenticated user (including anonymous) has full read/write to their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Fallback collection structure for global attempts with user matching
    match /quiz_attempts/{attemptId} {
      allow read, write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 4. Dual-Mode Resilience Specification

1. **Environment Variables**:
   - `VITE_OPENAI_API_KEY`: API key for OpenAI
   - `VITE_OPENAI_MODEL`: Model override (defaults to `gpt-4o`)
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`

2. **In-App Settings Drawer**:
   - Persists user-supplied keys in `localStorage` under `studybuddy_config`.
   - Allows on-the-fly toggling between Live GPT-4 API and Smart Deterministic Offline Fallback.
   - Provides connection health verification tests.

3. **Smart Offline Fallback Engine**:
   - When no API key is supplied or when the network call fails, the client uses an NLP regex sentence segmenter, key-term definition matcher, and concept distractor generator to manufacture rigorous, high-quality multiple choice questions directly from the provided study notes.
   - Never fails to generate a quiz: 100% testable out-of-the-box.

---

## 5. Verification Checklist

1. **Scaffold & Dependencies**:
   - `npm install` runs cleanly without dependency conflicts.
   - Core libraries installed: `react`, `react-dom`, `lucide-react`, `recharts`, `firebase`, `tailwindcss`, `postcss`, `autoprefixer`.
2. **Build Verification**:
   - `npm run build` runs through Vite with exit code `0`.
   - Zero syntax errors, zero missing imports, zero unclosed tags.
3. **Execution & Smoke Testing**:
   - Verified upload of notes via paste, file drag-and-drop, and pre-loaded sample notes.
   - Verified quiz generation (both via live API and offline deterministic mode).
   - Verified keyboard-driven quiz interaction (1-4 keys and Enter).
   - Verified instant feedback and summary score calculation.
   - Verified attempt persistence to localStorage and Firestore.
   - Verified Recharts score trajectory graph and KPI stats calculation.

