<div align="center">

# 🤖 SOFIYA — Bilingual AI Assistant

> *Your intelligent, voice-powered AI companion that speaks both English and Hindi*

[![Version](https://img.shields.io/badge/version-4.2.0-8b5cf6?style=for-the-badge)](CHANGELOG.md)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/license-MIT-10b981?style=for-the-badge)](LICENSE)
[![Made by](https://img.shields.io/badge/made_by-VIPHACKER100-ec4899?style=for-the-badge)](https://github.com/VIPHACKER100)

</div>

---

## ✨ Overview

**SOFIYA** (Smart Omnilingual Framework for Intelligent Yet Approachable AI) is a futuristic, voice-controlled browser assistant that recognises and responds to commands in **English, Hindi, and Hinglish** — with personality, style, and precision.

Built with React 19, TypeScript, and the Web Speech API, SOFIYA runs entirely in the browser with zero backend required. An optional **OpenRouter** integration enables full conversational AI responses via state-of-the-art LLMs.

---

## 🎯 Core Features

| Feature | Description |
|---|---|
| 🎙️ **Bilingual Voice Recognition** | Real-time speech capture in English & Hindi |
| 🧠 **Smart Intent Engine** | Weighted language detection + regex-based command routing |
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
| ⏱️ **Timer & Tasks** | Voice-set countdown timers and task manager |
| 🔢 **Calculator** | Inline math evaluation with voice input |
| 🛡️ **Security Layer** | XSS sanitization & phishing keyword detection |
| 🎨 **4 Visual Themes** | Sofiya (violet), Classic (cyan), Focus (red), Zen (emerald) |

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

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and add your API key

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome.

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
├── services/
│   ├── commandProcessor.ts  # Intent detection & command routing
│   ├── aiService.ts         # OpenRouter API integration
│   ├── voiceService.ts      # Web Speech API (STT + TTS)
│   ├── soundService.ts      # Procedural audio feedback
│   └── securityService.ts   # Input sanitization & threat detection
├── components/              # 19 React UI components
├── App.tsx                  # Root application & state orchestration
├── types.ts                 # TypeScript types & enums
├── constants.ts             # App constants & contact directory
└── index.html               # Entry point with Tailwind CDN
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design.

---

## 📦 Build & Deploy

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

Output is in `dist/`. Deploy to Vercel, Netlify, or any static host.

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
