# ⚙️ SOFIYA — Configuration Guide (v5.6.0)

All configuration is done via environment variables across the distributed nodes.

---

## Quick Setup

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your values.

---

## Environment Variables

### `VITE_OPENROUTER_API_KEY` *(Recommended)*

Your [OpenRouter](https://openrouter.ai) API key. Required for AI conversational fallback responses.

```env
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
```

**How to get one:**

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Go to **Keys** → **Create Key**
3. Copy and paste here

If not set, SOFIYA will fall back to web search for unrecognised commands.

---

### `VITE_AI_MODEL` *(Optional)*

The model to use via OpenRouter. Defaults to `openai/gpt-3.5-turbo`.

```env
VITE_AI_MODEL=openai/gpt-4o-mini
```

**Recommended free models on OpenRouter:**

| Model ID | Notes |
|---|---|
| `openai/gpt-3.5-turbo` | Fast, reliable default |
| `openai/gpt-4o-mini` | Better reasoning, still fast |
| `meta-llama/llama-3-8b-instruct:free` | Free tier, good quality |
| `mistralai/mistral-7b-instruct:free` | Free tier |
| `openai/gpt-oss-120b:free` | Large model, free tier |

Find all models at [openrouter.ai/models](https://openrouter.ai/models).

---

### `VITE_GEMINI_API_KEY` *(Legacy — Not Used)*

This variable is present for historical reasons but is **not used** in the current version. You can safely ignore or remove it.

---

---

## 🖥️ System Bridge (Python)

Located in `system-bridge/`. Create a `.env` file there if it doesn't exist.

| Variable | Default | Purpose |
|---|---|---|
| `BACKEND_PORT` | `8000` | Port for the Python bridge server |
| `FRONTEND_URL` | `http://localhost:5173` | UI origin for CORS |
| `ENABLE_DANGEROUS_COMMANDS` | `true` | Allows shutdown/restart commands |
| `WHATSAPP_DESKTOP_PATH` | - | Manual path to WhatsApp.exe |

---

## 🏢 Backend Service (Node.js)

Located in `backend/`. Requires PostgreSQL for persistent features.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Required for Household IQ & Calendar) |
| `JWT_SECRET` | Secret key for user authentication |
| `TWILIO_ACCOUNT_SID` | Required for server-side WhatsApp messaging |

---

## Browser Requirements

SOFIYA uses the **Web Speech API** for voice recognition and text-to-speech.

| Browser | STT Support | TTS Support |
|---|---|---|
| ✅ Chrome / Chromium | Full | Full |
| ✅ Microsoft Edge | Full | Full |
| ⚠️ Safari | Partial (iOS only) | Full |
| ❌ Firefox | Not supported | Full |

### Enabling Microphone

On first launch, your browser will prompt for microphone access. You must allow it.

If you denied it accidentally:

1. Click the 🔒 lock icon in the address bar
2. Find **Microphone** → Set to **Allow**
3. Reload the page

---

## Contacts Directory

To personalise calls & messages, edit `constants.ts`:

```typescript
export const CONTACTS: Record<string, string> = {
  "mom": "919876543210",     // +91 phone number format
  "dad": "919876543211",
  "raj": "919876543213",
  // Add your own contacts:
  "alice": "919112233445",

  // Hindi keys (what you say in Hindi)
  "मम्मी": "919876543210",
  "पिता जी": "919876543211",
};
```

---

## Vite Dev Server

Default port: **3000**. To change it, edit `vite.config.ts`:

```typescript
server: {
  port: 4000,   // Change to any available port
  host: '0.0.0.0',
}
```

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy this folder to any static host:

- [Vercel](https://vercel.com): `vercel --prod`
- [Netlify](https://netlify.com): drag & drop `dist/` folder
- [GitHub Pages](https://pages.github.com): use `gh-pages` package

- [GitHub Pages](https://pages.github.com): use `gh-pages` package

---

## 🚀 Standalone Demo (`sofiya-assistant.html`)

The standalone version is **zero-config** for basic use, but can be customized by editing the script block directly inside the file:

### Customizing Contacts

Search for `const CONTACTS` in the `<script>` tag (around line 1021):

```javascript
const CONTACTS = {
    'mom': '1234567890',
    'dad': '0987654321',
    'मम्मी': '1234567890'
};
```

### Customizing App Links

Search for `const APPS` (around line 1007) to update URLs for YouTube, Google, or social platforms.

### Environment

Since it's a static file, it does not support `.env` files. If you need a full LLM integration, move to the React stack.
