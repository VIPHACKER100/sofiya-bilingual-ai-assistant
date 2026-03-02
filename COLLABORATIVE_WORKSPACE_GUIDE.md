# 🤝 Collaborative Workspace Guide

The Collaborative Workspace module turns SOFIYA into a coordination engine for shared tasks, schedules, and team/family projects.

## 🚀 Core Modules

1. **Shared Task Boards**: Managed via the Task Panel.
2. **Synchronized Calendar**: Managed via the Calendar Widget.
3. **Family/Team Routine**: Coordinated starts for the morning or work day.

---

## 🗣️ Voice Commands (EN + HI)

### 📅 Calendar Coordination

- **EN**: "Add event Family Brunch on Sunday at 11am."
- **HI**: "रविवार सुबह 11 बजे 'फैमिली ब्रंच' का इवेंट जोड़ो।"
- **EN**: "What is our schedule for today?"
- **HI**: "आज हमारा शेड्यूल क्या है?"

### ✅ Shared Tasks

- **EN**: "Add shared task: Pay electricity bill."
- **HI**: "साझा कार्य जोड़ो: बिजली का बिल भरें।"
- **EN**: "Show team tasks."
- **HI**: "टीम के काम दिखाओ।"

---

## 🖱️ Interactive UI Features

### 🗓️ Smart Calendar Widget

- **Visual Grid**: View local and shared events in a glassmorphism interface.
- **Manual Entry**: Use the **NEW_EVENT** button for quick title-only entry (defaults to +1 hour from now).
- **Proactive Alerts**: Spoken reminders 10 minutes before shared events.

### 📋 Task Sync

- **Checkboxes**: Real-time completion sync across all clients.
- **Bilingual Support**: Tasks can be entered and viewed in English or Devanagari.

---

## 🏢 Workspace Routine (Macro)

Say **"Work Mode"** or **"कंप्यूटर मोड"** to trigger the Collaborative Workspace macro:

1. Sets UI to **Classic** or **Focus** theme.
2. Opens the **Task Panel** and **Calendar**.
3. Fetches latest shared news and system vitals.
4. Switches personality to **Focus** (brief/direct).

---

## 🛠️ Technical Details

- **Database**: Uses `shared_tasks` and `calendar_events` tables in PostgreSQL.
- **WebSocket Sync**: Real-time updates delivered via the System Bridge when a change is made.
- **API Endpoints**: `/api/calendar/events` and `/api/tasks`.

---

*Last Updated: March 2026 | SOFIYA v5.6.0*
