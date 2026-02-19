# 📖 SOFIYA — User Guide

Welcome to **SOFIYA**. This guide will help you master your bilingual AI assistant and get the most out of its features.

---

## 🛠️ Getting Started

1. **Grant Permissions**: When you first load SOFIYA, click the **Arc Reactor** (central orb). Your browser will ask for Microphone permission. Click **Allow**.
2. **Activate**: Click the central orb once to put SOFIYA in **LISTENING** mode. The rings will glow and rotate faster.
3. **Speak**: Say a command in English or Hindi. You don't need to specify the language; SOFIYA detects it automatically.

---

## 🎭 Personalizing Your Experience

SOFIYA has four **Protocols** (Themes & Personalities). You can switch them by voice or by setting the default in the code:

- **"Activate Sass Mode"**: Switch to the **Sass** personality (Red/Focus theme). She'll be a bit more "direct" with you.
- **"Storyteller Mode"**: Switch to the **Narrator** personality (Violet/Zen theme). Great for a more poetic interaction.
- **"Normal Mode"**: Restores the default **SOFIYA** personality and violet theme.

---

## 🔄 Using Smart Routines

Routines are designed to handle your daily transition periods:

- **Morning**: Say *"Good morning"* or *"Suprabhat"*. SOFIYA will automatically fetch your local weather, open the news panel, and show your task list.
- **Night**: Say *"Good night"* or *"Shubh ratri"*. SOFIYA will stop any media playing, turn off the smart home lights, and switch to **Focus Mode** so you can rest.

---

## 📱 Interactive Marquee

At the bottom of the screen, you'll see a scrolling list of commands. These are not just suggestions!

- **Click any command**: SOFIYA will process it as if you had spoken it. This is a great way to learn what she can do without speaking.

---

## 🏠 Controlling Your Smart Home

SOFIYA simulates a smart home environment:

- **"Lights On" / "Batti jalao"**: Turns on the virtual room lights.
- **"Movie Night"**: Dims the lights and switches the UI to Focus mode.
- **"Check Thermostat"**: Displays the current indoor temperature.

---

## 🔒 Security Features

SOFIYA is designed with your privacy in mind:

- **No Background Listening**: SOFIYA only listens when you click the orb to activate her.
- **Sensitive Data Blocking**: If she hears words like "Password", "OTP", or "Credit Card", the security layer will instantly block the command and show an alert.

---

## ❓ Troubleshooting

- **Not Listening**: Ensure you are using Chrome or Edge (Web Speech API works best there). Check if another tab is using your microphone.
- **Weather Error**: Make sure you allowed Location permissions when prompted.
- **AI Not Responding**: Ensure you have added a valid `VITE_OPENROUTER_API_KEY` to your `.env.local` file for AI features.

---
*For technical details, see [ARCHITECTURE.md](ARCHITECTURE.md).*
