# 📡 SOFIYA API Specification

This document defines the RESTful API endpoints for the SOFIYA Backend.

## Base URL

`http://api.sofiya.local/v1` (Development)
`https://api.sofiya.ai/v1` (Production)

---

## 🤖 Command Execution

### Process Command

- **Endpoint**: `POST /commands/execute`
- **Auth**: Required (JWT)
- **Body**:

  ```json
  {
    "transcript": "Turn off the kitchen lights",
    "context": {
      "location": "Kitchen",
      "personality": "SASS"
    }
  }
  ```

- **Response**: `ProcessedCommand` object with actionType, response, and data.

---

## 📅 Reminders & Tasks

### List Reminders

- **Endpoint**: `GET /reminders`
- **Response**: Array of reminder objects.

### Create Reminder

- **Endpoint**: `POST /reminders/create`
- **Body**:

  ```json
  {
    "text": "Call mom",
    "due_time": "2026-02-20T10:00:00Z",
    "escalation_level": 1
  }
  ```

---

## 🏠 Smart Home

### Execute Scene

- **Endpoint**: `POST /scenes/execute`
- **Body**: `{ "scene_id": "movie_night" }`

### Control Device

- **Endpoint**: `POST /devices/control`
- **Body**: `{ "device_id": "lamp_1", "action": "toggle", "value": "on" }`

---

## 💬 Messaging

### Send WhatsApp Message

- **Endpoint**: `POST /messages/send-whatsapp`
- **Body**:

  ```json
  {
    "recipient_id": "contact_123",
    "message": "Hey John, are we still on for dinner?"
  }
  ```

---

## 🏥 Health & Wellness

### Get Health Summary

- **Endpoint**: `GET /health/summary`
- **Query Params**: `range=7d`
- **Response**: Aggregated data for steps, heart rate, sleep.

---

## ⚙️ Integrations & Auth

### Connect Service

- **Endpoint**: `POST /integrations/connect`
- **Body**: `{ "service": "google_calendar", "auth_code": "..." }`

### User Profile

- **Endpoint**: `GET /user/profile`
- **Endpoint**: `PATCH /user/settings`
