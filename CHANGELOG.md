# 📝 SOFIYA — Changelog

All notable changes to SOFIYA are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [5.0.0] — 2026-02-19

### Added

#### New Services (10)
- **`themeService.ts`**: 4 switchable themes (sofiya/classic/focus/zen) with localStorage persistence
- **`i18nService.ts`**: Multi-language support for EN, HI, ES, FR, DE, JA with translation system
- **`analyticsService.ts`**: Event tracking, session management, auto-flush queue
- **`notificationService.ts`**: Toast notifications with auto-dismiss, info/success/warning/error types
- **`cacheService.ts`**: TTL-based in-memory caching with getOrFetch pattern
- **`storageService.ts`**: Enhanced localStorage wrapper with export/import
- **`privacyControlService.ts`**: Privacy modes (private/standard/optimized) with granular controls
- **`smartHomeSceneManager.ts`**: 8 pre-built scenes + custom scene creation
- **`conversationEngineService.ts`**: Multi-intent parsing, entity extraction, sentiment analysis
- **`loggerService.ts`**: Debug logging with levels and export

#### New Hooks
- **`useUndoRedo.ts`**: Undo/Redo state management for tasks
- **`useCommon.ts`**: 15+ utility hooks (debounce, throttle, localStorage, mediaQuery, etc.)

#### Accessibility
- **`accessibilityService.ts`**: ARIA labels, screen reader announcements, keyboard navigation, focus trap

#### Testing
- **`tests/commandProcessor.test.ts`**: 45+ unit tests for command processor
- **`tests/privacy.test.ts`**: Privacy service tests
- **`tests/e2e.spec.ts`**: Playwright E2E tests
- **`playwright.config.ts`**: Multi-browser testing config (Chromium, Firefox, Safari, Mobile)

### Changed

- **package.json**: Added vitest and @playwright/test as devDependencies
- **useAssistant.ts**: Integrated analytics tracking and theme service
- **README.md**: Updated architecture, features, and testing sections

---

## [4.3.0] — 2026-02-19

### Added

- **`ROUTINE_MORNING` command**: "Good morning" / "Suprabhat" — Triggers weather, news, and task list briefing.
- **`ROUTINE_NIGHT` command**: "Good night" / "Shubh ratri" — Automatically mutes media, turns off virtual lights, and engages Focus Mode.
- **Interactive Command Marquee**: The footer marquee is now interactive; clicking any command executes it instantly.
- **`useAssistant` Custom Hook**: Centralized all assistant state and logic into a clean, reusable React hook.

### Changed

- **UI Refinement**: Added glassmorphism shimmer effects and refined marquee animations.
- **Improved Language Detection**: Enhanced scoring for mixed-language "Hinglish" commands.
- **System Version Update**: Core internal version bumped to 4.3.0.

---

## [4.2.0] — 2026-02-19

### Added

- **`TIME_DATE` command**: "What time is it?" / "Aaj kya samay hai?" — returns live local time and date
- **`SYSTEM_STATUS` command**: "Status report" / "Namaste Sofiya" with time-aware greeting (Good Morning, etc.)
- **`VOLUME_UP/DOWN/MUTE/UNMUTE` commands**: Full voice-based volume control with Hinglish support ("Awaaz badhao", "Chup karo")
- **`SOCIAL` command**: Built-in bilingual joke and fun fact banks (3 Hindi jokes, 5 English jokes, 5 facts each language)
- **YouTube intent**: "Search YouTube for [query]" / "YouTube par [topic] dekho" opens direct YouTube search
- **`DRAWING_MODE`**: Extended trigger words — "draw", "sketch", "paint", "bana", "banao"
- **Timer improvements**: Now supports hours + minutes + seconds combined ("set a 1 hour 30 minute timer")
- **`extractQuery()` helper**: Clean query extraction by stripping command keywords before search
- **Extended Hindi vocabulary**: 30+ new words in `HINDI_STRONG_WORDS` and `HINDI_COMMON_WORDS`
- **Grammar markers**: `ka/ki/ke` postpositions (+1.5), `ne...ko` ergative pattern (+2.0)

### Changed

- **`commandProcessor.ts` refactored**: Flat `if/else` chain replaced with regex-based intent patterns — faster matching, easier to extend
- **`personalizeResponse()`**: Unused `type` parameter renamed to `_type` to suppress TypeScript warnings
- **Media play extraction**: Removed more filler words from song title extraction (`suno`, `sunao`, `please`, `can you`)
- **Message extraction**: Handles more conjunctions for splitting message body (`mein`, `likhna`, `with`, `:`)
- **`App.tsx` handlers**: Added handlers for all 7 new action types

### Removed

- Unused `CONTACTS` import from `commandProcessor.ts`
- Dead-code CONTACTS lookup that always returned the same value

### Fixed

- TypeScript lint error: `Cannot find name 'CONTACTS'` — removed unused reference
- Hinglish scoring imbalance: media/tech verbs ("play", "stop", "music") no longer over-score English when surrounded by Hindi grammar

---

## [4.1.0] — 2026-02-17

### Added

- Smart Home: light on/off, thermostat, lock simulation via `SmartHomeWidget`
- Communication: message draft and call initiation via `CommunicationWidget`
- Media Player: `MediaWidget` with play/pause/resume voice control
- Health Dashboard: steps, heart rate, sleep, calories via `HealthWidget`
- Mindfulness: guided breathing sequence via `MindfulnessWidget`
- Sentry Mode: camera-based motion detection via `SentryMode`
- Drawing Canvas: freehand HTML5 canvas via `DrawingCanvas`
- Timer: countdown timer via `TimerWidget`
- 4 Visual Themes: Sofiya (violet), Classic (cyan), Focus (red), Zen (emerald)
- `BootSequence`: cinematic startup animation
- `StatusPanel`: clock and system info overlay

### Changed

- Language detection upgraded from simple keyword check to weighted scoring model
- Personality TTS modulation added (rate & pitch per mode)
- News/Weather widgets given dedicated panel components

---

## [4.0.0] — 2026-02-16

### Added

- Hindi language support — full bilingual command processing
- Weighted language detection algorithm (Hindi vs English scoring)
- 4 Personality Modes: Default, Focus, Sass, Storyteller
- `SecurityService`: XSS sanitization + phishing keyword detection
- `voiceService.ts`: Web Speech API abstraction with voice preference selection
- `soundService.ts`: Procedural Web Audio API sound effects
- Weather integration via Open-Meteo (free, no API key needed)
- News feed widget
- Task panel with localStorage persistence
- Calculator with inline expression evaluation
- OpenRouter AI integration for conversational fallback

### Changed

- Migrated from JARVIS branding to **SOFIYA**
- Moved from Gemini API to OpenRouter for model flexibility

---

## [3.x] — 2026-02-15 and earlier

- Initial JARVIS concept
- Basic English voice commands
- Arc reactor UI concept
- Web Speech API integration proof-of-concept
