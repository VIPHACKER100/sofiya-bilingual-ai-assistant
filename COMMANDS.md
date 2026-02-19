# 🗣️ SOFIYA — Voice Commands Reference

Complete list of all supported voice commands in English, Hindi, and Hinglish.

---

## System & Status

| Intent | English | Hindi / Hinglish |
|---|---|---|
| Greeting / Status | "Hello Sofiya" | "Namaste Sofiya" / "Kaisi ho?" |
| System report | "Status report" / "Are you online?" | "System check karo" |
| Current time | "What time is it?" / "What's the time?" | "Abhi kya samay hai?" / "Kya baje hain?" |
| Today's date | "What's today's date?" | "Aaj kya tarikh hai?" |
| Help | "What can you do?" / "Help" | "Madad karo" / "Kya kar sakti ho?" |

---

## Personality Modes

| Mode | English | Hindi / Hinglish |
|---|---|---|
| Sass Mode | "Activate sass mode" | "Attitude mode on karo" |
| Focus Mode | "Switch to focus mode" | "Focus mode chalu karo" |
| Storyteller | "Storyteller mode" | "Kahani mode on karo" |
| Default | "Reset" / "Normal mode" | "Sofiya reset karo" |

---

## Media & Music

| Intent | English | Hindi / Hinglish |
|---|---|---|
| Play music | "Play lo-fi music" / "Play [song name]" | "Lo-fi bajao" / "[gaana] chalao" |
| Pause / Stop | "Stop music" / "Pause" | "Music band karo" / "Gaana roko" |
| Resume | "Resume music" | "Wapas chalao" / "Phir se chala" |

---

## Volume Control

| Intent | English | Hindi / Hinglish |
|---|---|---|
| Increase | "Increase volume" / "Volume up" | "Awaaz badhao" / "Volume tez karo" |
| Decrease | "Decrease volume" / "Volume down" | "Awaaz kam karo" / "Volume dheera karo" |
| Mute | "Mute" / "Silence" | "Chup karo" / "Mute karo" |
| Unmute | "Unmute" | "Awaaz chalu karo" |

---

## Smart Home

| Intent | English | Hindi / Hinglish |
|---|---|---|
| Lights on | "Turn on the lights" / "Lights on" | "Batti jalao" / "Light chalu karo" |
| Lights off | "Turn off the lights" | "Batti band karo" / "Light off karo" |
| Movie night | "Movie night" / "Cinema mode" | "Movie night lagao" |

---

## Communication

| Intent | English | Hindi / Hinglish |
|---|---|---|
| Send message | "Send message to Mom saying I'll be late" | "Mom ko sandesh bhejo ki main late aaunga" |
| Call someone | "Call Dad" / "Phone Raj" | "Papa ko call karo" / "Raj ko phone lagao" |

---

## Weather & News

| Intent | English | Hindi / Hinglish |
|---|---|---|
| Weather | "What's the weather?" / "Check weather" | "Mausam kaisa hai?" / "Mausam batao" |
| News | "Show news" / "Latest headlines" | "Samachar dikhao" / "Khabren batao" |

---

## Health & Wellness

| Intent | English | Hindi / Hinglish |
|---|---|---|
| Health dashboard | "Show my health" / "Heart rate" | "Sehat batao" / "Dil ki dhadkan batao" |
| Breathe | "Start breathing exercise" / "Meditate" | "Dhyan lagao" / "Saans ka wyayam karo" |

---

## Tasks & Timers

| Intent | English | Hindi / Hinglish |
|---|---|---|
| Add task | "Add task buy groceries" | "Grocery khareedna task jodo" |
| Show tasks | "Show tasks" | "Task list dikhao" |
| Set timer | "Set timer for 5 minutes" | "5 minute ka timer lagao" |
| Countdown | "30 second countdown" | "30 second ka countdown lagao" |

---

## Utilities

| Intent | English | Hindi / Hinglish |
|---|---|---|
| Calculator | "What is 45 * 8?" / "125 + 37" | "45 times 8 kitna hoga?" |
| Drawing | "Open drawing canvas" / "Let me draw" | "Drawing kholo" / "Canvas banao" |
| Sentry Mode | "Activate sentry mode" / "Watch the room" | "Suraksha mode on karo" |
| Joke | "Tell me a joke" | "Ek chutkula sunao" / "Hasao mujhe" |
| Fun fact | "Tell me a fact" / "Interesting fact" | "Koi rochak baat batao" |
| Web search | "Search for Mars Rover" | "Mars Rover dhundo" |
| YouTube | "Search YouTube for cooking videos" | "YouTube par cooking dekho" |

---

## Security

SOFIYA's security layer will **automatically block** commands that contain sensitive keywords:

- Passwords / `password` / `पासवर्ड`
- OTP / Bank details / CVV / PIN
- Credit card numbers

These commands will return a **Security Alert** and will not be processed further.

---

> 📖 See [ARCHITECTURE.md](ARCHITECTURE.md) for how intent detection works under the hood.
