# 🛠️ SOFIYA Tech Stack

This document outlines the complete technology stack for the SOFIYA Bilingual AI Assistant, ensuring a robust, scalable, and modern architecture.

---

## 🖥️ Backend Architecture

- **Environment**: Node.js (Primary for API orchestration & Real-time WebSockets)
- **Language**: TypeScript (for type safety and maintainability)
- **Framework**: Express.js or Fastify
- **Voice Computing**: Python (for heavy NLP or specific audio processing tasks if needed, via child processes or microservices)
- **Task Scheduling**: Node-cron or BullMQ (Redis-backed)

## 🎨 Frontend & Mobile

- **Web Dashboard**: React.js 19+ with Vite (Clean, performant UI)
- **Mobile Application**: React Native or Flutter (Cross-platform portability)
- **Styling**: Vanilla CSS + Tailwind CSS (for utility-first layout)
- **Animations**: Framer Motion (Cinematic UI effects)
- **Icons**: Lucide React
- **State Management**: React Context + Hooks (Custom `useAssistant` hook)

## 🎙️ Intelligence & Voice

- **Natural Language Processing**:
  - Primary: OpenAI GPT-4o / Google Gemini 2.0 (via OpenRouter)
  - Secondary: spaCy / NLTK (for local intent/entity extraction)
- **Speech-to-Text (STT)**:
  - Browser: Web Speech API (webkitSpeechRecognition)
  - Backend: Google Cloud Speech-to-Text or OpenAI Whisper
- **Text-to-Speech (TTS)**:
  - Browser: Web Speech Synthesis API
  - Premium: ElevenLabs or Google Cloud TTS
- **Wake-Word Detection**: Porcupine (Picovoice) - Lightweight, high accuracy

## 🗄️ Data & Storage

- **Relational Database**: PostgreSQL (User profiles, settings, history, relationships)
- **In-Memory Cache**: Redis (Contextual memory, session data, real-time states)
- **Object Storage**: AWS S3 or Google Cloud Storage (For media, logs, and user backups)

## 🔗 Integrations

- **Messaging**: WhatsApp Business API (via Twilio or MessageBird)
- **Smart Home**: Google Home API, Alexa Skills Kit, IFTTT
- **Health/Wearables**: Fitbit API, Apple HealthKit, Google Fit
- **External Data**: NewsAPI, OpenWeatherMap, Google Maps API

## ☁️ Cloud & Infrastructure

- **Hosting**: AWS (EC2/ECS), Google Cloud Platform (GKE), or Vercel (for frontend)
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes (Optional for high-scale)
- **CI/CD**: GitHub Actions
- **Logging/Monitoring**: ELK Stack (Elasticsearch, Logstash, Kibana) or Datadog

## 🛡️ Privacy & Security

- **Authentication**: JWT (JSON Web Tokens) + OAuth 2.0
- **Encryption**: AES-256 (at rest), TLS 1.3 (in transit)
- **Secure Storage**: HashiCorp Vault or AWS Secrets Manager
