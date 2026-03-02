# 🚀 SOFIYA — Setup & Installation Guide

This guide will walk you through setting up SOFIYA, from a zero-install demo to a full-stack, voice-controlled AI assistant.

---

## 🏗️ Choose Your Setup

| Path | Complexity | Capabilities | Best For |
| :--- | :--- | :--- | :--- |
| **[Standalone](#-standalone-mode-zero-install)** | ⭐ | Voice commands, Local tasks, UI Widgets | Quick testing, No coding |
| **[Frontend Only](#-frontend-only-setup)** | ⭐⭐ | Smart NLP (OpenRouter), Customization | Web developers, LLM testing |
| **[Full-Stack](#-full-stack-deployment-recommended)** | ⭐⭐⭐ | OS Control, OCR, Household AI, DB Persistence | Power users, Home automation |

---

## 📋 Prerequisites

Ensure you have the following installed for the Full-Stack version:

- **Node.js**: v18 or higher ([Download](https://nodejs.org/))
- **Python**: v3.10 or higher ([Download](https://www.python.org/))
- **PostgreSQL**: v14+ (Required for database-backed features)
- **Redis**: v6+ (Optional, for intelligent caching)
- **Tesseract OCR**: Required for OCR & Screen Narration Features ([Installation Guide](https://github.com/tesseract-ocr/tesseract))
- **Chrome / Edge**: A Chromium browser is **required** for Web Speech API support.

---

## ⚡ Standalone Mode (Zero Install)

The fastest way to experience SOFIYA.

1. Locate `sofiya-assistant.html` in the root directory.
2. **Double-click** to open it in Google Chrome.
3. Allow **Microphone Access** when prompted.
4. Say "Hello Sofiya" or "नमस्ते सोफिया".

---

## 🌐 Frontend Only Setup

Run the modern React 19 interface with OpenRouter AI support.

1. **Install Dependencies**:

   ```powershell
   cd frontend
   npm install
   ```

2. **Configure Environment**:
   - Rename `.env.example` to `.env.local`
   - Add your `VITE_OPENROUTER_API_KEY` (Get one at [openrouter.ai](https://openrouter.ai))

3. **Launch**:

   ```powershell
   npm run dev
   ```

   *Access at: [http://localhost:3000](http://localhost:3000)*

---

## 🏢 Full-Stack Deployment (Recommended)

This setup enables the System Bridge (OS Control), Backend (PostgreSQL), and Voice NLP.

### Step 1: Initialize Database

Ensure PostgreSQL is running. Create a database named `sofiya_db`.

```sql
CREATE DATABASE sofiya_db;
```

### Step 2: Configure All Services

Create `.env` files for each module based on their `.env.example` templates:

- `backend/.env`: Set `DATABASE_URL`
- `system-bridge/.env`: Set ports and CORS
- `voice-engine/.env`: Set NLP configurations
- `frontend/.env.local`: Set OpenRouter keys

### Step 3: Global Installation

You can install everything manually or use the automated launcher:

**Automated (Windows Recommended):**

```powershell
./launch.ps1
```

*This script will auto-detect ports, install missing dependencies, and launch all 4 consoles.*

**Manual (Linux/Mac/Advanced):**

```bash
# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: System Bridge
cd system-bridge
python -m venv venv
source venv/bin/activate # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py

# Terminal 3: Voice Engine
cd voice-engine && npm install && npm run dev

# Terminal 4: Frontend
cd frontend && npm install && npm run dev
```

---

## 📦 Docker Setup (Production)

For a containerized environment, use the provided Docker Compose configuration.

```bash
docker compose -f deployment/docker-compose.yml up --build -d
```

---

## 🛠️ Configuration Reference

### Key Environment Variables

| Variable | Location | Purpose |
| :--- | :--- | :--- |
| `VITE_OPENROUTER_API_KEY` | `frontend/.env.local` | Logic/Mental Model (LLM) |
| `DATABASE_URL` | `backend/.env` | User Data & Household IQ |
| `BACKEND_PORT` | `system-bridge/.env` | OS Automation Server |

---

## ❓ Troubleshooting

### Microphone Not Working?

1. Click the **Lock Icon** 🔒 in the Chrome address bar.
2. Ensure **Microphone** is set to **Allow**.
3. Reload the page.

### Command Not Recognized?

- Check the **Voice Commands Reference** in [COMMANDS.md](COMMANDS.md).
- Ensure you are using **Chrome** or **Edge**.
- If Using Hindi, ensure your OS language pack for Hindi is installed (optional but helpful).

### Port Conflicts?

SOFIYA uses the following ports by default:

- **3000**: Frontend
- **3001**: Backend API
- **8000**: System Bridge
- **5432**: PostgreSQL
- **6379**: Redis

---

## 📖 Related Documents

- [COMMANDS.md](COMMANDS.md) - Full voice interface reference.
- [CONFIGURATION.md](CONFIGURATION.md) - Deep dive into all settings.
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Technical roadmap.

---

**SOFIYA AI Assistant**  
Built by **VIPHACKER100**
