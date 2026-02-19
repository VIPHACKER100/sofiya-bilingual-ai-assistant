# 🗺️ SOFIYA Implementation Roadmap (v4.3.0)

This document provides a sequential, step-by-step implementation plan for building the **SOFIYA Bilingual AI Assistant**. It is designed to be executable by developers or LLMs in a predictable order.

---

## 🏗️ Phase 1: Project Setup & Tooling

1. **Initialize Project**: Create a new Vite project using the React-TypeScript template (`npm create vite@latest . -- --template react-ts`).
2. **Environment Configuration**: Create `.env.example` and `.env.local` to house `VITE_OPENROUTER_API_KEY` and `VITE_AI_MODEL`.
3. **Dependency Installation**: Install core UI libraries including `lucide-react` for icons and `framer-motion` for advanced animations.
4. **Type Definitions**: Create `types.ts` to define core Enums (`AppMode`, `Language`, `PersonalityMode`) and Interfaces (`CommandResult`, `SmartDevice`, `HealthData`).
5. **Global Constants**: Create `constants.ts` for error messages, initial state values, and the `TRY_COMMANDS` list for the marquee.

---

## 🎨 Phase 2: UI Foundation & Design System

1. **Base Styling**: Configure `tailwind.config.js` with project-specific colors (e.g., violet-500, cyan-400).
2. **Glassmorphism System**: In `index.html` or `index.css`, define the `.glass-panel` class with `backdrop-filter: blur(12px)` and semi-transparent backgrounds.
3. **Global Animations**: Implement `@keyframes` for `float`, `scanline`, `marquee`, and `shimmer` in the global CSS file.
4. **Core Layout**: Build the `App.tsx` shell with a full-screen relative container, noise texture overlay, and the scanline/vignette effect layers.
5. **Interactive Footnote**: Create the `Marquee` component in the footer that maps over `TRY_COMMANDS` and triggers an execution callback on click.

### 2.6 Detailed Command Processor — Intent Matching Patterns

| Intent | English Regex | Hindi Keywords | Data Extraction |
| --- | --- | --- | --- |
| **SYSTEM_STATUS** | `/\b(hello\|namaste\|hi\|hey\|how are you\|status\|system check\|online\|are you there\|help\|what can you do)\b/i` | "namaste", "kaisi ho", "kaise ho", "system", "check", "batao" | None |
| **TIME_DATE** | `/\b(time\|date\|what.*time\|what.*date\|current\|now\|when)\b/i` and NOT `/\b(in.*minutes\|after\|timer)\b/i` | "samay", "tarikh", "aaj", "kya baje", "kya samay" | Extract date/time from system |
| **PERSONALITY_CHANGE** | `/\b(activate\|switch\|enable\|turn on)\b.*\b(sass\|attitude\|focus\|storyteller\|normal\|default\|reset)\b.*\b(mode\|on\|personality)\b/i` | "mode", "on karo", "chalu karo", "attitude", "bahut", "personality" | Extract mode name from groups |
| **WEATHER_FETCH** | `/\b(weather\|temperature\|forecast\|rain\|cloudy\|sunny\|clear\|storm\|heat\|cold\|wind)\b/i` | "mausam", "temperature", "garmi", "barsat", "sardi", "tez hawa" | Extract location (if specified) |
| **NEWS_FETCH** | `/\b(news\|headlines\|latest\|breaking\|read\|updates\|current events)\b/i` | "samachar", "khabren", "latest", "news", "padho" | Category filter (optional) |
| **MEDIA_PLAY** | `/\b(play\|start\|stream)\b.*\b(music\|song\|track\|radio\|podcast\|audio\|guitar\|jazz\|lo-fi\|rock\|pop)\b/i` | "bajao", "chalao", "gaana", "music", "suno" | Extract song/artist name after keywords |
| **MEDIA_PAUSE** | `/\b(stop\|pause\|halt\|quit)\b.*\b(music\|song\|track\|audio\|gaana)\b/i` | "roko", "band karo", "chup", "gaana roko" | None |
| **MEDIA_RESUME** | `/\b(resume\|continue\|play again\|restart\|go back)\b/i` | "chalao", "wapas", "phir se", "dobara" | None |
| **COMM_MESSAGE_DRAFT** | `/\b(message\|text\|send\|dm\|whatsapp\|sms\|tell)\b.*\b(to\|for)\b.*\b(\w+)\b/i` | "bhejo", "sandesh", "kehna", "ko", "whatsapp" | Extract contact + message body |
| **COMM_CALL_START** | `/\b(call\|phone\|ring\|dial\|speak to\|talk to)\b.*\b(to\|for)\b.*\b(\w+)\b/i` | "call", "phone lagao", "karo", "ko" | Extract contact name |
| **SMART_HOME_ACTION** | `/\b(light\|lights\|lamp\|bulb\|thermostat\|ac\|lock\|door\|camera\|device\|fan)\b.*\b(on\|off\|up\|down\|increase\|decrease\|unlock\|lock)\b/i` | "batti", "light", "jalao", "band", "chalu", "thermostat" | Extract device + action |
| **SMART_HOME_SCENE** | `/\b(movie\|cinema\|bedtime\|morning\|night\|dinner\|scene\|mode\|night mode\|movie night)\b/i` | "movie night", "cinema", "scene", "mode" | Extract scene name |
| **VOLUME_UP** | `/\b(volume\|sound\|loud)\b.*\b(up\|increase\|raise\|higher\|more\|max)\b/i` | "awaaz", "tez", "badhao", "volume up" | None |
| **VOLUME_DOWN** | `/\b(volume\|sound\|loud)\b.*\b(down\|decrease\|lower\|less\|reduce\|min)\b/i` | "awaaz", "kam", "dheera", "volume down" | None |
| **VOLUME_MUTE** | `/\b(mute\|silence\|quiet\|shush\|hush)\b/i` | "chup", "mute", "silent", "awaaz band" | None |
| **VOLUME_UNMUTE** | `/\b(unmute\|unsilence\|sound on\|activate sound)\b/i` | "awaaz", "chalu", "unmute", "sound on" | None |
| **HEALTH_SHOW** | `/\b(health\|heartrate\|heart\|steps\|sleep\|calories\|fitness\|vitals\|wellness\|biometric)\b/i` | "sehat", "dil", "dhadkan", "steps", "neend" | None |
| **MINDFULNESS_START** | `/\b(breathe\|breathing\|meditate\|meditation\|relax\|calm\|yoga\|zen\|mindful)\b/i` | "dhyan", "saans", "vyayam", "relax", "shant" | None |
| **SENTRY_MODE** | `/\b(sentry\|guard\|watch\|monitor\|security\|camera\|surveillance\|protect)\b/i` | "suraksha", "guard", "watch", "security", "protect" | None |
| **DRAWING_MODE** | `/\b(draw\|sketch\|paint\|canvas\|art\|doodle\|brush\|pen)\b/i` | "banao", "likho", "draw", "sketch", "canvas" | None |
| **TASK_ADD** | `/\b(add\|create\|new)\b.*\b(task\|todo\|reminder\|item)\b/i` | "add", "kaam", "task", "todo" | Extract task text after keywords |
| **TASK_SHOW** | `/\b(show\|display\|list\|view)\b.*\b(task\|todo\|reminder)\b/i` | "dikhao", "list", "tasks", "kaam" | None |
| **TIMER** | `/\b(timer\|countdown\|set.*timer\|in)\b.*(\d+)\b.*\b(minute\|second\|hour\|min\|sec\|hr)\b/i` | "timer", "countdown", "laga", "minute", "second" | Extract duration + unit |
| **CALCULATION** | `/(\d+)\s*[\+\-\*/÷x]\s*(\d+)/` | Match numeric expressions | Evaluate math expression |
| **SOCIAL** | `/\b(joke\|funny\|laugh\|fact\|interesting\|tell me\|say something)\b/i` | "chutkula", "hasao", "funny", "baat", "kahani" | Determine joke vs fact |
| **ROUTINE_MORNING** | `/\b(good morning\|morning\|wake up\|i.*awake\|i.*up\|suprabhat\|prabhat)\b/i` | "suprabhat", "shubh", "prabhat", "uthao" | None (multi-action routine) |
| **ROUTINE_NIGHT** | `/\b(good night\|bedtime\|sleep\|night\|going to bed\|shubh ratri\|sone jao)\b/i` | "shubh ratri", "sone", "neend", "sleep", "ratri" | None (multi-action routine) |
| **SEARCH_QUERY** (YouTube) | `/youtube.*search\|search youtube\|youtube.*\b(\w+)\b/i` | "youtube", "search", "youtube par", "dekho" | Extract search query |
| **SEARCH_QUERY** (Google) | Default fallback for unmatched | Any unmatched intent | Use full transcript as query |

---

## 🎙️ Phase 3: Service Layer (Non-UI Logic)

1. **Voice Service**: Implement `services/voiceService.ts` using the browser's `webkitSpeechRecognition` and `speechSynthesis`. Handle language switching between `en-US` and `hi-IN`.
2. **Sound Service**: Build `services/soundService.ts` using the Web Audio API to generate procedural beeps/blips for UI confirmation, startup, and error states.
3. **Security Service**: Implement `services/securityService.ts` to sanitize text input and check for sensitive keywords (e.g., passwords, bank details).
4. **AI Service**: Create `services/aiService.ts` to handle `fetch` requests to the OpenRouter API completions endpoint.

---

## 🧠 Phase 4: State Orchestration (Custom Hook)

1. **Hook Skeleton**: Create `hooks/useAssistant.ts` and initialize state for `AppMode`, `transcript`, `history`, and `volume`.
2. **Widget Management**: Add state toggles for all major widgets (Weather, Tasks, Health, News, SmartHome).
3. **Permission Handler**: Implement a `useEffect` to check for microphone permissions and trigger the `PermissionModal` if denied.
4. **Action Handlers**: Create the `handleCommandResult` function that maps `actionType` strings to state updates (e.g., `setPersonality`, `setShowNews`).

---

## ⚡ Phase 5: Intent Engine (Command Processor)

1. **Language Detection**: In `services/commandProcessor.ts`, implement a scoring mechanism that checks for English vs. Hindi keywords to set the response language.
2. **Regex Intent Matching**: Create a massive switch-like structure using regex to match user input to standard intents (e.g., `VOLUME_UP`, `WEATHER_FETCH`, `MEDIA_PLAY`).
3. **Routine Logic**: Implement the `ROUTINE_MORNING` and `ROUTINE_NIGHT` intents that return special action types for multi-step sequences.
4. **Fallback Logic**: Ensure that if no regex matches, the script first attempts `AIService.getAIResponse` and finally a Google Search URL.

---

## 🍱 Phase 6: Component & Widget Development

1. **Arc Reactor**: Build the main `ArcReactor.tsx` component with SVG rings that rotate and pulse based on the `AppMode` (IDLE, LISTENING, PROCESSING).
2. **Status Badges**: Create `StatusBadges.tsx` to display real-time clock, CPU load simulation, and uptime.
3. **Media Widget**: Build `MediaWidget.tsx` with playback controls, progress bar, and rotating album art.
4. **Smart Home Panel**: Create `SmartHome.tsx` to display a grid of interactive devices (lights, locks) with toggle states.
5. **Communication Modal**: Build `CommPanel.tsx` for drafting messages and displaying contact details.

---

## 🧠 PHASE 10: Optimization & Performance Tips

### 10.3 Performance Optimization Checklist

- **Code Splitting**: Lazy load heavy components like `SentryMode` and `DrawingCanvas` using `React.lazy` and `Suspense`.
- **Memoization**: Wrap stateless display widgets in `React.memo` to prevent unnecessary re-renders.
- **Debouncing**: Debounce expensive operations like Text-to-Speech triggers or frequent storage updates.
- **Sound Control**: Limit simultaneous audio playback using a simple procedural queue.

### 10.4 Bundle Size Optimization

- **Vite Config**: Use `manualChunks` in Rollup options to split vendor libraries from UI components.
- **Terser**: Enable Terser minification and configure it to drop `console.log` in production builds.

---

## 🧪 Phase 11: Testing & Migration

1. **Command Flow Verification**: Use the interactive marquee to verify that every command correctly triggers the corresponding `actionType`.
2. **Bilingual TTS Validation**: Test that switching to Hindi correctly changes the `voiceService` language and the AI system prompt.
3. **Security Check**: Input "my password is 123" to verify the `SecurityService` blocks the command.
4. **Routine Execution**: Say "Good Morning" to verify that Weather, News, and Tasks all activate simultaneously.

### 11.2 Rollback Strategy

- **Vercel/Netlify**: Use the dashboard to redeploy the previous stable build instantly if the master branch fails.
- **Git**: Keep a `stable` branch separate from `main` for critical releases.

---

## 🚀 Phase 12: Deployment & Maintenance

1. **Production Build**: Run `npm run build` and verify that all assets are correctly bundled in the `dist` folder.
2. **Documentation Sync**: Update `README.md`, `USER_GUIDE.md`, and `DEVELOPMENT.md` to match the final implemented API.
3. **Maintenance**: Schedule weekly audits of OpenRouter API usage and browser compatibility updates.

---

## PHASE 13: Advanced UI/UX Implementation

## 13.1 Glassmorphism & Cinematic Effects

**What**: Create the signature glass-panel aesthetic with depth and animation.

**Where**: `index.html` (global styles) and individual components

### Glass Panel Effect Implementation

```css
/* Global CSS in index.html */
.glass-panel {
  background: rgba(10, 10, 15, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  box-shadow: 
    0 4px 30px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.glass-panel:hover {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(10, 10, 15, 0.7);
  box-shadow: 
    0 8px 32px rgba(139, 92, 246, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease-out;
}

/* Neon glow effect */
.neon-glow {
  text-shadow: 
    0 0 10px currentColor,
    0 0 20px currentColor,
    0 0 30px rgba(139, 92, 246, 0.5);
  filter: drop-shadow(0 0 8px currentColor);
}

/* Animated border shimmer */
.shimmer-border {
  position: relative;
  border: 2px solid transparent;
  background-image: 
    linear-gradient(rgba(10, 10, 15, 0.6), rgba(10, 10, 15, 0.6)),
    linear-gradient(90deg, #8b5cf6, #06b6d4, #8b5cf6);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 200% 0%;
  }
}

/* Scanline effect for cinematic feel */
.scanline-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0) 50%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.1)
  );
  background-size: 100% 4px;
  z-index: 50;
  opacity: 0.15;
  mix-blend-mode: overlay;
}

/* Vignette effect */
.vignette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-shadow: 0 0 150px rgba(0, 0, 0, 0.9) inset;
  pointer-events: none;
  z-index: 40;
}
```

---

## 13.2 Animation Patterns & Timing

**What**: Implement consistent, performant animations throughout the UI.

**Where**: `index.html` (keyframes) and component-level CSS

### Animation Library Patterns

```css
/* Stagger animations for list items */
@keyframes stagger-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-list > * {
  animation: stagger-in 0.3s ease-out;
}

/* ... stagger delays ... */

/* Pulse animation for active state */
@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 10px currentColor;
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 20px currentColor;
  }
}

.pulse-active {
  animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## 13.3 Responsive Design Implementation

**What**: Ensure the app works perfectly on all screen sizes.

**Where**: All components using Tailwind's responsive prefixes

---

## 13.4 Dark Mode & Theme System

**What**: Implement dynamic theming system that persists user preference.

**Where**: Add to `useAssistant.ts` and theme service

```typescript
// services/themeService.ts
type ThemeKey = 'sofiya' | 'classic' | 'focus' | 'zen';

interface ThemeConfig {
  name: string;
  subtitle: string;
  primary: string;
  primaryRGB: string;
  secondary: string;
}
```

---

## PHASE 14: Localization & Internationalization

1. **Multi-Language Support**: Extend beyond English/Hindi to support languages like Spanish, French, and Japanese using a central `i18nService.ts`.
2. **RTL Support**: Implement layout reversals for Right-to-Left languages in the Tailwind config and component logic.

---

## PHASE 15: Accessibility Implementation

1. **WCAG Compliance**: Ensure color contrast ratios meet AA standards (4.5:1).
2. **ARIA Labels**: Implement descriptive labels for voice-activated controls.
3. **Keyboard Navigation**: Enable full app control via Tab, Enter, and Arrow keys.
4. **Voice Feedback**: Provide screen-reader specific announcements for microphone status.

---

## PHASE 16: Advanced State Management Patterns

1. **Undo/Redo**: Implement a history stack for state transitions (e.g., task management).
2. **Optimistic Updates**: Update UI states immediately while background API calls resolve.

---

## PHASE 17: Performance Profiling & Optimization

1. **React Profiler**: Identify slow-rendering components using Chrome DevTools.
2. **Web Vitals**: Monitor LCP, FID, and CLS scores for production builds.
3. **Network Optimization**: Implement request deduplication and aggressive caching in `CacheManager`.

---

## PHASE 18: Analytics & Metrics Collection

1. **Event Tracking**: Log command success rates and widget usage patterns.
2. **Engagement Metrics**: Track session duration and average command processing time.

---

## PHASE 19: Community & Support Systems

1. **User Feedback**: Implement a `FeedbackModal` for user bug reports and feature requests.
2. **Contextual Help**: Add tooltips and walkthrough overlays for first-time users.

---

## PHASE 20: Final Testing & Quality Assurance

1. **End-to-End Testing**: Automate critical flows using Playwright or Cypress.
2. **Load Testing**: Use k6 to simulate high-frequency voice command processing.
3. **Security Audit**: Verify sanitization against refined XSS and Phishing patterns.

---

## 🏁 Final Checklist

- [ ] All 19 components implemented and tested.
- [ ] Language detection accuracy > 90%.
- [ ] Security alert blocks correctly for sensitive keywords.
- [ ] Morning/Night routines execute multi-modal actions correctly.
- [ ] Interactive Marquee executes all example commands on click.

---

### ⚠️ Assumptions & Constraints

- **Browser Capability**: Assumes a modern Chromium-based browser (Chrome/Edge) for full Web Speech API support.
- **Connectivity**: AI Fallback and Weather/News widgets require an active internet connection.
- **API Limits**: Assumes usage of OpenRouter's free-tier models unless configured otherwise.
