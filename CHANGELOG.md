# 📝 SOFIYA — Changelog

All notable changes to SOFIYA are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [5.6.0] — 2026-03-02

### Added — Comprehensive Household & Social Intelligence

#### Collaborative Workspace (Phase 22)

- **Shared Task Board**: Synchronized task management for families and teams with real-time updates.
- **Unified Calendar**: Integrated shared calendar events with conflict detection and automated reminders.
- **Collaborative Sync**: "Sync workspace" / "वर्कस्पेस सिंक करें" command to refresh all shared nodes.

#### Household IQ (Phase 22.3)

- **Inventory Tracking**: "Where are my keys?" / "चाबियाँ कहाँ हैं?" — Shared knowledge base for item locations.
- **Item Expiry Notifications**: Automated alerts for perishables or subscription renewals.
- **Household Widget**: New UI module for managing shared household intelligence and inventory.

#### Stealth Gift Protocol (Phase 23)

- **Privacy-First Gifting**: "Save gift idea: Watch for Sarah" / "उपहार आइडिया: घड़ी" — Automatically hides ideas from specific users.
- **Hidden From Logic**: Backend security prevents gift ideas from being leaked via API or UI to the 'hidden_from' user list.
- **Surprise Protection**: Dedicated Gift Widget with blurred preview for sensitive items.

#### Documentation & API

- **v2 API Specifications**: Full documentation for `/api/household`, `/api/calendar`, and `/api/social` endpoints.
- **New Feature Guides**: Created `HOUSEHOLD_IQ_GUIDE.md`, `STEALTH_GIFT_PROTOCOL.md`, and `COLLABORATIVE_WORKSPACE_GUIDE.md`.

---

## [5.3.0] — 2026-03-02

### Added — JARVIS-Inspired Window & Input Control

#### Hindi App Launcher (JARVIS Reference Integration)

- **30+ App Mappings**: Now recognizes Hindi/Devanagari app names — "नोटपैड खोलो", "कैलकुलेटर खोलो", "क्रोम खोलो", "वीएलसी खोलो", "एक्सेल खोलो", etc.
- **Hindi Web Mappings**: Hindi web names now resolve to URLs — "यूट्यूब", "गूगल", "नेटफ्लिक्स", "जीमेल", "व्हाट्सएप", "चैटजीपीटी".
- **Extended Website Fallback**: Added Reddit, LinkedIn, Amazon, Flipkart, WhatsApp to the `open_app` web fallback map in `window_manager.py`.

#### Window Control Commands

- **Snap Window**: "Snap left" / "बाएं स्नैप" — Snaps active window to left half (Win+←).
- **Snap Window Right**: "Snap right" / "दाएं स्नैप" — Snaps active window to right half (Win+→).
- **Center Window**: "Center window" / "विंडो बीच में" — Centers active window on screen.
- **List Running Apps**: "List apps" / "चल रहे ऐप्स" — Shows all running processes.

#### Clipboard & Keyboard Shortcuts

- **Copy Selection**: "Copy" / "कॉपी करो" — Triggers Ctrl+C via bridge.
- **Paste Clipboard**: "Paste" / "पेस्ट करो" — Triggers Ctrl+V via bridge.
- **Read Clipboard**: "Get clipboard" — Retrieves current clipboard text.
- **Save File**: "Save file" / "सेव करो" — Triggers Ctrl+S.
- **Undo**: "Undo" / "वापस करो" — Triggers Ctrl+Z.
- **New/Close Tab**: "New tab" / "नया टैब", "Close tab" / "टैब बंद करो".
- **Scroll Control**: "Scroll up/down" / "ऊपर/नीचे स्क्रॉल".

#### New Component

- **`DesktopControlPanel.tsx`**: New glassmorphism panel (ported from JARVIS `DesktopControls.tsx`) for wallpaper, taskbar, zoom, theme, icons, and window controls with full bilingual UI.

---

## [5.2.0] — 2026-03-01

### Added — Advanced System Control & Automation Bridge

#### New System Capabilities

- **System Health Reporting**: "How is my PC?" / "सिस्टम स्वास्थ्य" — Bilingual spoken report of CPU, Memory, Battery, and Disk.
- **Macro Automation System**: "Run macro [name]" — Sequential command execution with recursive callback support.
- **Default Macros**: Added "Deep Cleanup" (Recycle Bin + Health) and "System Vitals Check".
- **Volume Percentage Control**: "Set volume to 50" / "आवाज़ 20 प्रतिशत" — Precise OS-level volume control.
- **Theme & Mode Switching**: "Switch to Focus mode" / "थीम बदलो" — Seamless UI and personality transitions.
- **Work Mode Routine**: "Work mode" / "काम शुरू" — Combined theme shift, personality shift, and task panel opening.

#### Security & UI

- **Authorization Overhaul**: High-contrast, interactive confirmation modals for critical system actions (Shutdown, Restart, Delete).
- **Cyberpunk Aesthetic**: Enhanced `ConfirmationModal` with `framer-motion` and `lucide-react` for a premium feel.

### Fixed

- **TypeScript Type Safety**: Resolved 'unknown' data casting issues in `useAssistant` hook.
- **Battery Null Checks**: Added safety checks for desktop systems without batteries in `SystemStatus` component.

---

## [5.1.0] — 2026-02-26

### Added — Standalone HTML (`sofiya-assistant.html`)

#### New Voice Commands (18)

- **Personality Modes**: "Sass mode" / "Focus mode" / "Storyteller" / "Reset" — dynamically wraps all responses
- **Morning Routine**: "Good morning" / "सुप्रभात" — time-aware spoken briefing
- **Night Routine**: "Good night" / "शुभ रात्रि" — farewell with simulated light-off
- **Jokes** (bilingual bank): "Tell me a joke" / "मजाक सुनाओ" — 5 EN + 3 HI random jokes
- **Facts** (bilingual bank): "Interesting fact" / "रोचक तथ्य" — 5 EN + 3 HI random facts
- **Smart Home – Lights**: "Turn on lights" / "बत्ती जलाओ" — state-tracked toggle
- **Smart Home – Movie Night**: "Movie night" / "मूवी" — scene simulation
- **Media Play/Pause/Resume**: "Play chill music" / "गाना बजाओ" / "Stop music"
- **Communication – Call**: "Call Mom" / "मम्मी को कॉल करो" — `tel:` deep link
- **Weather** (simulated): "Weather" / "मौसम" — random temp + condition
- **News** (simulated): "News" / "समाचार" — bilingual random headline
- **Tasks** (localStorage): "Add task Buy milk" / "कार्य जोड़ो" — persists across refresh
- **Timer/Countdown**: "Set timer for 5 minutes" — live MM:SS display + spoken alert
- **Math/Calculator**: "25 + 17" — inline arithmetic evaluation (safe, no `eval`)
- **Mindfulness**: "Breathe" / "ध्यान" — 4-7-8 breathing exercise guide
- **Sentry Mode**: "Sentry" / "सुरक्षा" — simulated activation
- **Help**: "Help" / "मदद" — lists all capabilities in detected language
- **Web Search Fallback**: Unrecognized commands now open Google search

#### New UI Widgets

- **Timer Panel**: Live countdown display in right panel
- **Task List Panel**: Shows up to 5 tasks with ✓ to complete
- **Updated Quick Commands**: Shows all new feature examples
- **Expanded Marquee**: 30+ clickable example commands

### Changed

- **`sofiya-assistant.html`**: Expanded from 1423 to 1563 lines with all new features
- **`README.md`**: Updated Standalone Demo section with full feature table (24 rows)
- **`CHANGELOG.md`**: Added v5.1.0 entry
- **`USER_GUIDE.md`**: Updated with new features documentation
- **`IMPLEMENTATION_STATUS.md`**: Added Standalone HTML features phase

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
