# 🔌 SOFIYA Integration Guide

How to add new third-party services to the SOFIYA ecosystem.

---

## 🏗️ Architecture for Integrations

All integrations reside in the `/integrations/` directory. Each integration should follow the **Connector Pattern**:

1. **Connector**: Low-level API wrapper handling auth and requests.
2. **Service**: High-level business logic that uses the Connector.
3. **Command Router**: Mapping intents to Service methods.

---

## 📝 Steps to Add a New Integration

### 1. Create a Connector

Create `integrations/{service-name}-connector.js`.

```javascript
// Example: philips-hue-connector.js
export const getDevices = async (apiKey) => { ... };
export const setLightState = async (deviceId, state) => { ... };
```

### 2. Register Credentials

Add required API keys to the `.env` file and update `TECH_STACK.md`.

### 3. Implement Intent Handlers

Update `nlp-processor.js` to recognize new intents related to the service.

### 4. Update Command Router

Map the new intent in `command-router.js`.

```javascript
case 'LIGHT_STATUS':
  return await HueService.getStatus(entities.room);
```

---

## 🛠️ Supported Integration Types

- **Messaging**: WhatsApp, SMS, Email.
- **Smart Home**: Google Home, Alexa, IFTTT, Philips Hue.
- **Health**: Fitbit, Apple Health, Google Fit.
- **Information**: NewsAPI, Google Search, Maps.
- **Productivity**: Google Calendar, Todoist.
