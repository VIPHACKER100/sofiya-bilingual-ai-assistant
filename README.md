<div align="center">

# 🤖 SOFIYA — Bilingual AI Assistant

> *Your intelligent, voice-powered AI companion that speaks both English and Hindi*

[![Version](https://img.shields.io/badge/version-5.0.0-8b5cf6?style=for-the-badge)](CHANGELOG.md)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/license-MIT-10b981?style=for-the-badge)](LICENSE)
[![Made by](https://img.shields.io/badge/made_by-VIPHACKER100-ec4899?style=for-the-badge)](https://github.com/VIPHACKER100)

</div>

---

## ✨ Overview

**SOFIYA** (Smart Omnilingual Framework for Intelligent Yet Approachable AI) is a futuristic, voice-controlled browser assistant that recognises and responds to commands in **English, Hindi, and Hinglish** — with personality, style, and precision.

Built with React 19, TypeScript, and the Web Speech API, SOFIYA runs in the browser with optional backend services. An **OpenRouter** integration enables full conversational AI responses. The full-stack setup adds voice NLP, smart home, calendar, health integrations, and more.

---

## 🎯 Core Features

| Feature | Description |
|---|---|
| 🎙️ **Bilingual Voice Recognition** | Real-time speech capture in English & Hindi |
| 🧠 **Smart Intent Engine** | Weighted language detection + regex-based command routing |
| 🔄 **Smart Routines** | "Good Morning" & "Good Night" multi-action sequences |
| 🖱️ **Interactive Marquee** | Click-to-execute voice commands from the scrolling footer |
| 🤖 **AI Fallback** | OpenRouter API integration (GPT / Llama / any model) |
| 🎭 **4 Personality Modes** | Default, Focus, Sass, Storyteller |
| 🏠 **Smart Home Control** | Virtual light, thermostat, lock simulation |
| 🎵 **Media Player** | Voice-triggered music playback widget |
| 📰 **News & Weather** | Live meteorological data + news feed |
| 💬 **Communication Panel** | Draft messages & initiate calls by voice |
| ❤️ **Health Dashboard** | Steps, heart rate, sleep score, calories |
| 🧘 **Mindfulness Mode** | Guided breathing exercise |
| 🔒 **Sentry Mode** | Camera-based surveillance with motion detection |
| ✏️ **Drawing Canvas** | Full in-browser freehand drawing tool |
| 🖌️ **Visual Themes** | Sofiya (violet), Classic (cyan), Focus (red), Zen (emerald) |

### Advanced Features (v5.0+)

| Feature | Description |
|---|---|
| 🌐 **Multi-Language Support** | English, Hindi, Spanish, French, German, Japanese |
| 📊 **Analytics Dashboard** | Event tracking, session metrics, engagement insights |
| 🔔 **Notification System** | Toast notifications with auto-dismiss |
| 💾 **Cache Service** | TTL-based in-memory caching |
| 🗄️ **Storage Service** | Enhanced localStorage with export/import |
| 🛡️ **Privacy Controls** | Private, Standard, Optimized modes |
| 💡 **Scene Manager** | 8 pre-built smart home scenes + custom scenes |
| 📈 **Health Monitoring** | Detailed metrics, insights, wellness score |
| 💭 **Conversation Engine** | Multi-intent parsing, entity extraction, sentiment |
| ♿ **Accessibility** | ARIA labels, keyboard navigation, screen reader |

---

## 🗣️ Voice Commands Reference

### System

| English | Hindi / Hinglish |
|---|---|
| "Hello Sofiya" / "Status report" | "Namaste Sofiya" / "Kaisi ho?" |
| "What time is it?" | "Abhi kya samay hai?" / "Kya baje hain?" |
| "Switch to Focus Mode" | "Focus mode on karo" |
| "Tell me a joke" | "Chutkula sunao" |

### Media

| English | Hindi / Hinglish |
|---|---|
| "Play lo-fi music" | "Lo-fi music bajao" |
| "Stop music" | "Music band karo" / "Gaana roko" |
| "Resume" | "Wapas chalao" |

### Smart Home

| English | Hindi / Hinglish |
|---|---|
| "Turn on lights" | "Batti jalao" / "Light chalu karo" |
| "Movie night" | "Movie night lagao" |

### Communication

| English | Hindi / Hinglish |
|---|---|
| "Send message to Mom saying I'm home" | "Mom ko sandesh bhejo ki main ghar aa gaya" |
| "Call Dad" | "Papa ko call karo" |

### Volume

| English | Hindi / Hinglish |
|---|---|
| "Increase volume" | "Awaaz badhao" / "Volume tez karo" |
| "Mute" | "Chup karo" / "Mute karo" |

> 📖 Full command reference: [COMMANDS.md](COMMANDS.md)

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- A modern Chromium browser (for Web Speech API support)
- An [OpenRouter](https://openrouter.ai) API key (optional, for AI responses)

### Frontend Only (browser + OpenRouter)

```bash
cd frontend
npm install
cp .env.example .env.local   # Add VITE_OPENROUTER_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome.

### Full Stack (backend + voice-engine + frontend)

```bash
# 1. Install all dependencies
cd backend && npm install
cd ../voice-engine && npm install
cd ../frontend && npm install

# 2. Configure environment
cp backend/.env.example backend/.env
cp voice-engine/.env.example voice-engine/.env
# Edit .env files with your credentials

# 3. Start services (3 terminals)
cd backend && npm run dev        # Port 3001
cd voice-engine && npm run dev   # Voice NLP
cd frontend && npm run dev       # Port 3000 (proxies /api to backend)
```

### Docker (recommended for production)

```bash
docker compose -f deployment/docker-compose.yml up
```

> ⚠️ The Web Speech API is only supported in Chromium-based browsers (Chrome, Edge). Firefox and Safari have limited or no support.

---

## ⚙️ Configuration

Edit `.env.local`:

```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_AI_MODEL=openai/gpt-4o-mini   # or any OpenRouter-supported model
```

See [CONFIGURATION.md](CONFIGURATION.md) for all options.

---

## 🏗️ Architecture

```
sofiya-bilingual-ai-assistant/
├── services/                      # Core services (20 total)
│   ├── commandProcessor.ts       # Intent detection & command routing
│   ├── aiService.ts             # OpenRouter API integration
│   ├── voiceService.ts           # Web Speech API (STT + TTS)
│   ├── soundService.ts           # Procedural audio feedback
│   ├── securityService.ts        # Input sanitization & threat detection
│   ├── themeService.ts           # Theme management (4 themes)
│   ├── i18nService.ts            # Multi-language translations
│   ├── analyticsService.ts       # Event tracking & metrics
│   ├── cacheService.ts           # TTL-based caching
│   ├── storageService.ts         # localStorage wrapper
│   ├── notificationService.ts    # Toast notifications
│   ├── privacyControlService.ts  # Privacy mode controls
│   ├── smartHomeSceneManager.ts  # Scene orchestration
│   ├── healthMonitoringService.ts # Health metrics & insights
│   ├── conversationEngineService.ts # Multi-intent parsing
│   ├── accessibilityService.ts   # ARIA & keyboard utilities
│   └── loggerService.ts          # Debug logging
├── hooks/                        # React hooks
│   ├── useAssistant.ts          # Main state management
│   ├── useUndoRedo.ts           # Undo/Redo functionality
│   └── useCommon.ts             # Utilities (15+ hooks)
├── components/                   # 19 React UI components
├── tests/                        # Unit & E2E tests
├── App.tsx                       # Root application & state orchestration
├── types.ts                      # TypeScript types & enums
├── constants.ts                  # App constants & contact directory
└── index.html                    # Entry point with Tailwind CDN
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system design. For the full implementation status (17 phases), see [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

---

## 🧪 Testing

```bash
# Frontend unit tests
cd frontend && npm test

# Backend + voice-engine tests (from project root)
npm run test:backend

# E2E tests
npm run test:e2e

# Load test (requires backend running on :3001)
npm run test:load
```

---

## 📦 Build & Deploy

```bash
# Frontend production build
cd frontend && npm run build

# Preview production build locally
cd frontend && npm run preview
```

Output is in `frontend/dist/`. For full-stack deployment, use Docker:

```bash
./deployment/deploy-staging.sh   # or deploy-production.sh
```

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for the complete feature list and [deployment/](deployment/) for Docker and Kubernetes configs.

---

## 🤝 Contributing

Pull requests are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## 📄 License

MIT © [VIPHACKER100](https://github.com/VIPHACKER100)

---

<div align="center">
Made with ❤️ by <strong>VIPHACKER100</strong>
</div>
