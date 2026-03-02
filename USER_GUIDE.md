# 📖 SOFIYA — User Guide

Welcome to **SOFIYA**. This guide covers every feature available in both the **standalone HTML demo** and the **full React app**.

---

## 🛠️ Getting Started

1. **Grant Permissions**: When you first load SOFIYA, click the **Arc Reactor** (central orb). Your browser will ask for Microphone permission. Click **Allow**.
2. **Activate**: Click the central orb once to put SOFIYA in **LISTENING** mode. The rings will glow and rotate faster.
3. **Speak**: Say a command in English or Hindi. You don't need to specify the language; SOFIYA detects it automatically.

**Keyboard shortcuts:** `Space` — activate/deactivate · `L` — toggle EN/HI · `↑↓` — volume

---

## 🗣️ Full Voice Commands Reference

### 🌐 Web Navigation

| English | Hindi |
| --- | --- |
| "Open YouTube" | "यूट्यूब खोलो" |
| "Go to Google" | "गूगल खोलो" |
| "Open Instagram" | "इंस्टाग्राम खोलो" |

### 🎬 YouTube Search

| English | Hindi |
| --- | --- |
| "Play Bollywood on YouTube" | "यूट्यूब पर बॉलीवुड चलाओ" |
| "Search YouTube for recipes" | "YouTube पर रेसिपी सर्च करो" |

### 💬 WhatsApp Messaging

| English | Hindi |
| --- | --- |
| "Send message to Mom saying hello" | "मम्मी को मैसेज भेजो hello" |
| "WhatsApp Dad saying I'm home" | "पापा को कहो मैं घर आ गया" |

### 📞 Call

| English | Hindi |
| --- | --- |
| "Call Mom" | "मम्मी को कॉल करो" |
| "Phone Dad" | "पापा को फोन करो" |

### 🕐 Time & Date

| English | Hindi |
| --- | --- |
| "What time is it?" | "कितने बजे हैं?" |
| "What's the date today?" | "आज कौन सी तारीख है?" |

### 🔊 Volume Control

| English | Hindi |
| --- | --- |
| "Increase volume" / "Volume up" | "आवाज़ बढ़ाओ" |
| "Decrease volume" | "वॉल्यूम कम करो" |
| "Mute" | "म्यूट करो" |

### 🎭 Personality Modes

| Command | Effect |
| --- | --- |
| "Sass mode" / "Attitude" | Witty, sarcastic responses |
| "Focus mode" | Minimal, direct responses |
| "Storyteller" / "Narrator" | Narrative, dramatic responses |
| "Reset" / "Normal" / "Default" | Restores default personality |

### 🔄 Smart Routines

| English | Hindi |
| --- | --- |
| "Good morning" | "सुप्रभात" / "शुभ प्रभात" |
| "Good night" | "शुभ रात्रि" |

- **Morning**: SOFIYA gives you the time and a motivational greeting.
- **Night**: SOFIYA wishes you goodnight and offers to stand watch.

### 😂 Jokes & Facts

| English | Hindi |
| --- | --- |
| "Tell me a joke" | "मजाक सुनाओ" |
| "Interesting fact" | "रोचक तथ्य" |

Banks: 5 English + 3 Hindi jokes · 5 English + 3 Hindi facts — randomly selected.

### 🏠 Smart Home

| English | Hindi |
| --- | --- |
| "Turn on lights" | "बत्ती जलाओ" / "लाइट ऑन" |
| "Turn off lights" | "बत्ती बंद करो" |
| "Movie night" | "मूवी" |

### 🎵 Media Player

| English | Hindi |
| --- | --- |
| "Play chill music" | "गाना बजाओ" / "संगीत चलाओ" |
| "Stop music" | "गाना रोको" |

### 🌤️ Weather

| English | Hindi |
| --- | --- |
| "Weather" / "Forecast" | "मौसम" / "तापमान" |

> Note: Standalone HTML uses simulated data. Full React app uses Open-Meteo API.

### 📰 News

| English | Hindi |
| --- | --- |
| "News" / "Headlines" | "समाचार" / "खबर" |

> Note: Standalone HTML uses simulated headlines. Full React app fetches live feeds.

### ✅ Tasks

| English | Hindi |
| --- | --- |
| "Add task Buy groceries" | "कार्य जोड़ो दूध खरीदो" |
| "Show tasks" / "Task list" | "कार्य दिखाओ" |

Tasks are saved in `localStorage` and persist across page refreshes. Click ✓ to mark complete.

### ⏱️ Timer / Countdown

| English | Hindi |
| --- | --- |
| "Set timer for 5 minutes" | "5 मिनट का टाइमर लगाओ" |
| "Set timer for 30 seconds" | "30 सेकंड का टाइमर" |

- Supports hours, minutes, and seconds (combinable).
- Live MM:SS countdown in the right panel.
- Spoken alert on completion.

### 🧮 Calculator

Just say any math expression:

- "25 + 17" → "25 + 17 = 42"
- "100 / 4" → "100 / 4 = 25"
- "15 *3" → "15* 3 = 45"

### 🧘 Mindfulness

| English | Hindi |
| --- | --- |
| "Breathe" / "Meditate" | "ध्यान" / "सांस" / "शांत" |

SOFIYA guides you through a 4-7-8 breathing exercise.

### 🛡️ Sentry & Security

| English | Hindi |
| --- | --- |
| "Sentry" / "Security" | "सुरक्षा" / "निगरानी" |
| "Activate Sentry Mode" | "सुरक्षा सक्रिय करो" |

### 🖥️ System Control & Health

| English | Hindi |
| --- | --- |
| "How is my PC?" / "System Health" | "सिस्टम स्वास्थ्य" / "कैसा है मेरा पीसी" |
| "Show Network Info" | "नेटवर्क विवरण" |
| "Set volume to 50" | "आवाज़ 50 प्रतिशत" |
| "Switch to Zen mode" | "ज़ेन मोड लगाओ" |
| "Work mode" / "Focus" | "काम शुरू" / "फोकस मोड" |

### 🪟 Window Control

| English | Hindi |
| --- | --- |
| "Snap left" / "Snap window left" | "बाएं स्नैप" / "विंडो बाईं ओर" |
| "Snap right" / "Snap window right" | "दाएं स्नैप" / "विंडो दाईं ओर" |
| "Center window" | "विंडो बीच में" |
| "Minimize window" | "विंडो छोटी करो" |
| "Maximize window" | "विंडो बड़ी करो" |
| "Show desktop" | "डेस्कटॉप दिखाओ" |
| "List running apps" | "ऐप्स सूची" / "चल रहे ऐप्स" |

### 📦 App Launcher & Navigation

| English | Hindi |
| --- | --- |
| "Open Notepad" | "नोटपैड खोलो" |
| "Open Calculator" | "कैलकुलेटर खोलो" |
| "Open Paint" | "पेंट खोलो" |
| "Open VLC" | "वीएलसी खोलो" |
| "Open Chrome" | "क्रोम खोलो" |
| "Open VS Code" | "कोड खोलो" |
| "Open Spotify" | "स्पोटिफाई चलाओ" |
| "Open YouTube" | "यूट्यूब खोलो" |
| "Open Netflix" | "नेटफ्लिक्स खोलो" |
| "Open Amazon" | "अमेज़न देखो" |
| "Open Flipkart" | "फ्लिपकार्ट खोलो" |
| "Go to GitHub" | "गिटहब खोलो" |
| "Open Gmail" | "जीमेल चेक करो" |
| "Search Wikipedia" | "विकिपीडिया पर खोजो" |
| "Open Word" | "वर्ड खोलो" |
| "Open Excel" | "एक्सेल खोलो" |
| "Open Terminal" | "टर्मिनल खोलो" |
| "Open ChatGPT" | "चैटजीपीटी खोलो" |

### ⌨️ Clipboard & Keyboard Shortcuts

| English | Hindi |
| --- | --- |
| "Copy" / "Copy selection" | "कॉपी करो" / "चुनाव कॉपी" |
| "Paste" | "पेस्ट करो" / "चिपकाओ" |
| "Get clipboard" / "What is in clipboard?" | "क्लिपबोर्ड क्या है" |
| "Save file" | "सेव करो" / "फाइल सेव" |
| "Undo" | "वापस करो" / "अनडू" |
| "New tab" | "नया टैब" |
| "Close tab" | "टैब बंद करो" |
| "Scroll up" | "ऊपर स्क्रॉल" |
| "Scroll down" | "नीचे स्क्रॉल" |

### 🖥️ Desktop Control Panel (v5.3.0)

Access the desktop control dashboard via the (Monitor) icon in the toolbar or press `Shift + D`.

- **Features**: Change Wallpaper, Empty Recycle Bin, Toggle Taskbar, System Theme, Screen Zoom, and Window Snapping.
- **Voice Commands**:
  - "Change wallpaper" / "वॉलपेपर बदलो"
  - "Empty recycle bin" / "कचरा साफ करो"
  - "Toggle taskbar" / "टास्कबार"
  - "Zoom in/out" / "ज़ूम इन/आउट"
  - "System health" / "सिस्टम स्वास्थ्य"

### 👁️ Vision & OCR (Phase 21)

SOFIYA can now "see" your screen and extract information from media files.

| English | Hindi |
| --- | --- |
| "Narrate screen" / "What's on screen?" | "स्क्रीन पढ़ो" / "स्क्रीन पर क्या है?" |
| "Screen summary" | "स्क्रीन का सारांश" |
| "Extract text from image" (OCR) | "फोटो से टेक्स्ट निकालो" |
| "Read PDF" | "पीडीएफ पढ़ो" |
| "What is selected?" | "क्या चुना है?" |
| "Make drawing" / "Open Paint" | "ड्राइइंग बनाओ" / "पेंट खोलें" |

### 🤖 Macros & Automation

| English | Hindi |
| --- | --- |
| "Run macro Deep Cleanup" | "मैक्रो चलाओ डीप क्लीनअप" |
| "System Vitals Check" | "सिस्टम चेक" |

### ❓ Help

| English | Hindi |
| --- | --- |
| "Help" / "What can you do?" | "मदद" / "क्या कर सकती हो?" |

Lists all available capabilities in the detected language.

### 🔍 Web Search Fallback

Any command that SOFIYA doesn't recognize is automatically searched on Google.

---

## 🎨 Interactive Marquee

At the bottom of the screen, you'll see a scrolling list of 30+ commands. **Click any command** to execute it instantly — great for discovering features.

---

## 🔒 Security Features

- **No Background Listening**: SOFIYA only listens when you click the reactor to activate.
- **Sensitive Data Blocking** (React app): Commands containing "Password", "OTP", or "Credit Card" are blocked.

---

## ❓ Troubleshooting

| Problem | Solution |
| --- | --- |
| Not Listening | Use Chrome or Edge. Check if another tab is using your microphone. |
| Hindi not detected | Speak naturally. SOFIYA uses Devanagari Unicode detection. |
| Timer not visible | Check the right panel — the MM:SS countdown is below the volume bar. |
| Tasks disappeared | Tasks are saved in `localStorage`. Clearing browser data will remove them. |
| AI Not Responding | (React app only) Add a valid `VITE_OPENROUTER_API_KEY` to `.env.local`. |

---

*For technical details, see [ARCHITECTURE.md](docs/ARCHITECTURE.md). For configuration, see [CONFIGURATION.md](CONFIGURATION.md).*
