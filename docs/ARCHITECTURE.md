# 🏗️ SOFIYA — Architecture Documentation (v5.6.0)

> Deep-dive into how SOFIYA is designed, how data flows, and how the key systems work.

---

## High-Level Architecture

```
            ┌─────────────────────────────────────────┐
            │              Browser / DOM               │
            │  ┌───────────────────────────────────┐  │
            │  │          App.tsx (Root)            │  │
            │  │   UI Shell & Protocol Orchestrator │  │
            │  └────────────────┬───────────┬──────┘  │
            │                   │           │          │
            │     ┌─────────────┼───────────┴──────┐  │
            │     ▼             ▼                  ▼  │
            │  useAssistant   soundService     State Sync
            │  (Custom Hook)  (Web Audio)     (WebSocket)
            │     │                                │
            │     ▼                                │
            └─────┬────────────────────────────────┴──┘
                  │ (Command/Event)
                  ▼
            ┌─────────────┐       (ZMQ Sync)       ┌────────────────┐
            │   Backend   │◄──────────────────────►│  System Bridge  │
            │  (Node.js)  │                        │    (Python)    │
            └──────┬──────┘                        └────────┬───────┘
                   │                                        │
            ┌──────┴──────┐                        ┌────────┴───────┐
            │  PostgreSQL │                        │  OS APIs/OCR   │
            │ (Household) │                        │ (Desktop Ctrl) │
            └─────────────┘                        └────────────────┘
```

---

## Service Layer

### `commandProcessor.ts` — The Brain

The central intent engine. Receives raw text transcript and returns a `ProcessedCommand` object.

**Processing Pipeline:**

1. **Sanitize** — `SecurityService.sanitizeCommand()` strips XSS / injection payloads
2. **Phishing Check** — Blocks requests containing sensitive financial keywords
3. **Language Detection** — `detectLanguage()` assigns `'en'` or `'hi'` using a weighted scoring model
4. **Intent Matching** — Ordered regex + keyword rules map to `actionType` strings
5. **AI Fallback** — If no rule fires, `AIService.getAIResponse()` is called
6. **Web Search Fallback** — If AI also fails/returns empty, a Google search URL is generated

**Language Detection Algorithm:**

```
tokenize(text)
  → for each token:
      +3.0 if HINDI_STRONG_WORD  (karo, kya, kaise...)
      +1.0 if HINDI_COMMON_WORD  (hai, ka, ki...)
      +2.0 if ENGLISH_STRONG_WORD (would, schedule, weather...)
      +1.0 if ENGLISH_COMMON_WORD (with optional Hinglish discount)
  → position bonus: verb-at-end +2.5 (Hindi SOV), verb-at-start +1.5 (English SVO)
  → grammar markers: 'mein' +3.0, 'ko' vs 'to', 'ka/ki/ke' +1.5
  → hiScore >= enScore → 'hi', else → 'en'
```

**Supported `actionType` values:**

| Action Type | Trigger | UI Effect |
|---|---|---|
| `SYSTEM_STATUS` | "How are you?" / "Status report" | Spoken response only |
| `TIME_DATE` | "What time?" / "Date batao" | Spoken response only |
| `PERSONALITY_CHANGE` | "Focus mode" / "Sass mode" | Updates personality state |
| `WEATHER_FETCH` | "Weather" / "Mausam" | Fetches geo location & temperature |
| `NEWS_FETCH` | "News" / "Samachar" | Opens news widget |
| `MEDIA_PLAY` | "Play [song]" | Opens media player widget |
| `MEDIA_PAUSE` | "Stop music" | Pauses media widget |
| `MEDIA_RESUME` | "Resume" | Resumes media widget |
| `COMM_MESSAGE_DRAFT` | "Message to [contact]" | Opens communication widget |
| `COMM_CALL_START` | "Call [contact]" | Opens communication widget |
| `SMART_HOME_ACTION` | "Lights on/off" | Updates smart device state |
| `SMART_HOME_SCENE` | "Movie night" | Sets scene & dims lights |
| `VOLUME_UP/DOWN/MUTE/UNMUTE` | "Volume badhao" | Adjusts app volume state |
| `HEALTH_SHOW` | "Health" / "Sehat" | Opens health dashboard |
| `MINDFULNESS_START` | "Breathe" / "Meditate" | Opens breathing exercise |
| `SENTRY_MODE` | "Sentry" / "Guard" | Activates camera surveillance |
| `DRAWING_MODE` | "Draw" / "Canvas" | Opens drawing canvas |
| `TASK_ADD` | "Add task [text]" | Adds task to localStorage |
| `TASK_SHOW` | "Show tasks" | Opens task panel |
| `TIMER` | "Timer for N minutes" | Sets countdown timer |
| `CALCULATION` | "12 * 4" | Opens calculator with result |
| `SOCIAL` | "Joke" / "Fact" | Spoken joke or fun fact |
| `SECURITY_ALERT` | Password/OTP/CVV keywords | Security warning response |
| `SEARCH_QUERY` | Unmatched query | Google/YouTube search URL |
| `AI_RESPONSE` | AI fallback | Spoken AI-generated response |
| `HOUSEHOLD_QU` | "Where are keys?" | Query shared inventory DB |
| `GIFT_STEALTH` | "Gift idea for X" | Secure add with `hidden_from` check |
| `BRIDGE_CTRL` | "Open Notepad" | Routed to Python System Bridge |
| `OCR_NARRATE` | "Narrate screen" | OCR processing on Bridge |

---

### `voiceService.ts` — Speech I/O

Singleton class wrapping the Web Speech API.

| Method | Purpose |
|---|---|
| `startListening(onResult, onEnd, onError)` | Starts STT with callbacks |
| `stopListening()` | Stops active recognition session |
| `speak(text, lang)` | TTS with voice selection & personality rate/pitch |
| `setLanguage(lang)` | Sets recognition language (`hi-IN` / `en-US`) |
| `setPersonality(mode)` | Adjusts TTS rate and pitch per personality |

**Personality TTS tuning:**

| Mode | Rate | Pitch |
|---|---|---|
| DEFAULT | 1.0 | 1.0 |
| FOCUS | 1.2 | 1.0 (faster, efficient) |
| STORYTELLER | 0.85 | 0.95 (slower, dramatic) |
| SASS | 1.05 | 1.1 (expressive) |

---

### `aiService.ts` — LLM Integration

Connects to [OpenRouter](https://openrouter.ai) to enable conversational AI fallback.

- **Model**: configurable via `VITE_AI_MODEL` env variable
- **System prompt** is selected based on detected language (English or Hindi)
- Returns empty string on failure (allowing graceful fallback to web search)

---

### `soundService.ts` — Procedural Audio

Synthesizes all UI sounds in real-time using the Web Audio API (no audio files needed).

| Sound | Trigger |
|---|---|
| `playUIConfirm()` | Successful command, widget open |
| `playUIClick()` | Button click, volume change |
| `playStartup()` | Personality mode switch |
| `playScan()` | Sentry mode scan sweep |
| `playAlert()` | Security alert |
| `playMessageSent()` | Message sent action |

---

### `weatherService.ts` — Meteorological Data

Fetches weather forecasting data using the Open-Meteo API.

- **Caching**: Implements internal caching to prevent redundant API calls.
- **Mapping**: Converts numeric WMO weather codes into human-readable conditions (e.g., "Thunderstorm", "Partly Cloudy").

---

### `newsService.ts` — Global Headlines

Fetches live news headlines using an RSS-to-JSON bridge for BBC News.

- **Filtering**: Automatically slices the top 5 most relevant global stories.
- **Fallbacks**: Includes mock data patterns for offline/development environments.

---

### `securityService.ts` — Security Layer

| Method | Protection |
|---|---|
| `sanitizeCommand(text)` | Strips `<script>`, `javascript:`, event handlers (`onclick=` etc.) |
| `analyzeForPhishing(text)` | Blocks 10+ Hindi and English sensitive keyword patterns |
| `validateWhatsAppNumber(num)` | Validates Indian mobile format (`+91 XXXXXXXXXX`) |

---

## Component Map

```
App.tsx
├── BootSequence         — Cinematic startup animation
├── ArcReactor           — Central activation button with state rings
├── Waveform             — Audio level visualizer (SVG)
├── HistoryLog           — Last N command results log
├── VolumeControl        — Volume slider display
├── StatusPanel          — System clock & status info
├── WeatherWidget        — Temperature & location display
├── NewsWidget           — Scrollable news feed panel
├── TaskPanel            — Todo list panel
├── MediaWidget          — Music player widget
├── CalculatorWidget     — Math result display
├── TimerWidget          — Countdown timer
├── HealthWidget         — Biometric stats dashboard
├── SmartHomeWidget      — Virtual device controls grid
├── CommunicationWidget  — Message/call draft panel
├── MindfulnessWidget    — Guided breathing animation
├── SentryMode           — Camera capture + motion detection
├── DrawingCanvas        — HTML5 canvas drawing board
└── PermissionModal      — Microphone permission request dialog
```

---

## Data Flow: Voice Command Lifecycle

```
User speaks
    │
    ▼
voiceService.startListening()
    │
    ▼ onResult(transcript, isFinal)
App.tsx → handleCommandResult()
    │
    ▼
processTranscript(text, personality)   [commandProcessor.ts]
    │
    ├─ SecurityService.sanitizeCommand()
    ├─ SecurityService.analyzeForPhishing()
    ├─ detectLanguage() → 'en' | 'hi'
    ├─ Intent matching rules (ordered)
    ├─ AIService.getAIResponse() [if no match]
    └─ Google search fallback [if AI empty]
    │
    ▼ ProcessedCommand { actionType, response, language, data }
App.tsx
    │
    ├─ Update relevant widget state
    ├─ addToHistory()
    ├─ voiceService.speak(spokenResponse)
    └─ soundService.play*()
```

---

## State Management

All state lives in `App.tsx` using React `useState` hooks. No external state library is needed given the app's scope.

| State | Type | Purpose |
|---|---|---|
| `mode` | `AppMode` | IDLE / LISTENING / PROCESSING / SPEAKING |
| `transcript` | `string` | Live voice input display |
| `history` | `CommandResult[]` | Command history log |
| `personality` | `PersonalityMode` | Active personality mode |
| `language` | `Language` | Recognition language (EN/HI toggle) |
| `theme` | `string` | Visual theme key |
| `volume` | `number` | Master volume (0–100) |
| `tasks` | `string[]` | Task list (persisted via localStorage) |
| `weatherData` | `any` | Fetched weather object |
| `mediaTrack` | `MediaTrack \| null` | Currently playing track |
| `smartDevices` | `SmartDevice[]` | Virtual device states |
| `commData` | `CommunicationData \| null` | Active comm draft/call |
| `activeTimer` | `{duration, label} \| null` | Active countdown |

---

## Extended Services (v5.0+)

### `themeService.ts` — Theme Management

Manages 4 visual themes with localStorage persistence.

| Theme | Primary Color | Description |
|---|---|---|
| sofiya | #8b5cf6 (violet) | Default futuristic AI look |
| classic | #06b6d4 (cyan) | Standard interface |
| focus | #ef4444 (red) | Productivity mode |
| zen | #10b981 (emerald) | Mindfulness protocol |

### `i18nService.ts` — Internationalization

Provides translations for 6 languages: EN, HI, ES, FR, DE, JA

- Browser language auto-detection
- Translation key fallback system
- Persisted language preference

### `analyticsService.ts` — Event Tracking

Tracks user interactions for insights:

- Session start/end
- Command execution
- Widget open/close
- Theme/language changes
- Voice activation
- Auto-flush queue (30s)

### `notificationService.ts` — Toast Notifications

Provides in-app notifications:

- Types: info, success, warning, error
- Auto-dismiss support
- Subscribe/publish pattern

### `cacheService.ts` — TTL Caching

In-memory cache with time-to-live:

- `set(key, data, ttl)`
- `get(key)` — returns null if expired
- `getOrFetch(key, fetcher, ttl)` — fetch-if-miss pattern
- Auto-cleanup every 60s

### `privacyControlService.ts` — Privacy Modes

Granular privacy controls:

| Mode | Cloud Processing | Third-Party Sharing |
|---|---|---|
| private | ❌ | ❌ |
| standard | ✅ | ✅ |
| optimized | ✅ | ✅ |

### `smartHomeSceneManager.ts` — Scene Orchestration

8 pre-built smart home scenes:

- Movie Night, Good Morning, Focus Work
- Bedtime, Party Mode, Relax
- Away Mode, Arriving Home

### `healthMonitoringService.ts` — Health Metrics

Detailed health tracking:

- Steps, Heart Rate, Sleep Quality
- Calories, Activity Minutes, Hydration
- Wellness Score calculation
- Personalized insights

### `householdIntelligenceService.ts` (v5.6.0)

- **Shared Knowledge**: Syncs item locations and inventory across nodes.
- **Conflict Resolution**: Handles simultaneous updates to shared household state.

### `socialSecretaryService.ts` (v5.6.0)

- **Stealth Protocol**: Filters gift ideas based on the active user profile.
- **Relationship Tracking**: Manages birthday reminders and social coordination.

### `conversationEngineService.ts` — Advanced NLP

Multi-intent parsing and sentiment:

- Multi-intent detection ("book flight AND add reminder")
- Entity extraction (time, numbers, locations)
- Sentiment analysis (positive/negative/neutral)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_OPENROUTER_API_KEY` | Recommended | OpenRouter API key for AI responses |
| `VITE_AI_MODEL` | Optional | Model identifier (default: `openai/gpt-3.5-turbo`) |
| `VITE_GEMINI_API_KEY` | Unused | Legacy — not used in current version |

---

> 📖 See [COMMANDS.md](COMMANDS.md) for the full voice command reference.
