# SOFIYA Calendar & Reminders Guide

## 📅 Calendar Integration

### Google Calendar Setup

```javascript
import { CalendarService } from './integrations/calendar-service.js';

const calendar = new CalendarService({
    clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET
});

await calendar.initialize();

// Get authorization URL
const authUrl = calendar.getAuthUrl();
// User visits URL, authorizes, gets code

// Exchange code for tokens
const tokens = await calendar.exchangeCode(authCode);
```

### Creating Events

```javascript
// Create event with specific times
await calendar.createEvent({
    title: 'Team Meeting',
    start: '2026-02-20T15:00:00',
    end: '2026-02-20T16:00:00',
    description: 'Quarterly planning session',
    location: 'Conference Room A',
    attendees: ['colleague@example.com']
});

// Create event from natural language
await calendar.createEventFromText('Meeting tomorrow at 3 PM with John');
```

### Fetching Events

```javascript
// Get upcoming events (next 24 hours)
const upcoming = await calendar.getUpcomingEvents(24);

// Get events in date range
const events = await calendar.getEvents({
    startTime: new Date('2026-02-20'),
    endTime: new Date('2026-02-27'),
    maxResults: 50
});
```

### Conflict Detection

```javascript
// Check for conflicts before creating event
const conflicts = await calendar.checkConflicts(
    new Date('2026-02-20T15:00:00'),
    new Date('2026-02-20T16:00:00')
);

if (conflicts.length > 0) {
    console.log('Conflicts found:', conflicts);
}
```

---

## ⏰ Reminder Engine

### Creating Reminders

```javascript
import { ReminderEngine } from './backend/reminder-engine.js';

const reminderEngine = new ReminderEngine({
    db: dbConnection,
    notificationService: notificationService
});

await reminderEngine.initialize();

// Time-based reminder
await reminderEngine.createReminder({
    userId: 'user123',
    title: 'Call Mom',
    description: 'Check in about weekend plans',
    dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    priority: 'high'
});

// Recurring reminder
await reminderEngine.createReminder({
    userId: 'user123',
    title: 'Weekly Review',
    dueTime: new Date('2026-02-20T09:00:00'),
    recurring: true,
    recurrencePattern: 'weekly'
});
```

### Location-Based Reminders

```javascript
// Create location reminder
await reminderEngine.createLocationReminder({
    userId: 'user123',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
    location: 'Grocery Store',
    radius: 100 // meters
});

// Check location reminders (call when user arrives at location)
await reminderEngine.checkLocationReminders('user123', {
    lat: 37.7749,
    lng: -122.4194
});
```

### Reminder Management

```javascript
// Get user's reminders
const reminders = await reminderEngine.getUserReminders('user123', 'pending');

// Complete reminder
await reminderEngine.completeReminder(reminderId);

// Snooze reminder (15 minutes)
await reminderEngine.snoozeReminder(reminderId, 15);
```

### Escalation Levels

Reminders escalate automatically if not acknowledged:

1. **Level 1**: Visual cue on screen
2. **Level 2**: Audible notification (after 5 minutes)
3. **Level 3**: Repeated notifications every 5 minutes

---

## 📤 Delegation Service

### Delegating Reminders

```javascript
import { DelegationService } from './integrations/delegation-service.js';

const delegationService = new DelegationService({
    whatsappService: whatsappService,
    reminderEngine: reminderEngine,
    contactManager: contactManager
});

// Delegate reminder via WhatsApp
await delegationService.delegateReminder({
    userId: 'user123',
    recipientName: 'Mom',
    message: 'Don\'t forget about dinner tonight at 7 PM',
    dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // Send in 2 hours
    channel: 'whatsapp',
    context: {
        event: 'dinner',
        urgency: 'high'
    }
});

// Delegate via email
await delegationService.delegateReminder({
    userId: 'user123',
    recipientName: 'colleague@example.com',
    message: 'Please review the proposal by Friday',
    channel: 'email',
    context: { event: 'proposal review' }
});
```

### Message Generation

The service automatically generates contextual messages:

- **Time-based greeting**: "Good morning", "Hi", "Good evening"
- **Event context**: Adds context about the event
- **Urgency indicators**: Adds [HIGH] or [URGENT] tags
- **Channel adaptation**: Shorter messages for SMS/WhatsApp

---

## 🤖 Habits Engine

### Logging Actions

```javascript
import { HabitsEngine } from './backend/habits-engine.js';

const habitsEngine = new HabitsEngine({
    db: dbConnection,
    habitDetector: habitDetector,
    reminderEngine: reminderEngine
});

await habitsEngine.initialize();

// Log user action
await habitsEngine.logAction({
    userId: 'user123',
    action: 'check_weather',
    context: {
        hour: 9,
        dayOfWeek: 1, // Monday
        location: 'home',
        weather: 'sunny'
    },
    result: { temperature: 72, condition: 'sunny' }
});
```

### Predicting Next Actions

```javascript
// Predict next likely action
const prediction = await habitsEngine.predictNextAction('user123', {
    hour: 9,
    location: 'home'
});

// Returns:
// {
//     predicted: 'check_weather',
//     confidence: 0.85,
//     reason: 'Based on pattern: Checks weather every morning at 9 AM',
//     habit: { ... }
// }
```

### Proactive Assistance

```javascript
// Offer proactive assistance
const suggestion = await habitsEngine.offerProactiveAssistance('user123', {
    hour: 9,
    location: 'home'
});

if (suggestion) {
    console.log(suggestion.suggestion);
    // "Would you like me to check the weather?"
}
```

### Learning Preferences

```javascript
// Learn user preference
await habitsEngine.learnPreference('user123', 'order_food', {
    usualOrder: 'Pizza Margherita',
    restaurant: 'Tony\'s Pizza',
    autoExecute: false
});

// Future suggestions will use this preference
```

---

## 🗣️ Voice Commands

### Calendar Commands

- "Schedule a meeting tomorrow at 3 PM" → `createEventFromText()`
- "What's on my calendar today?" → `getUpcomingEvents(24)`
- "Do I have any conflicts?" → `checkConflicts()`
- "Cancel the meeting at 3 PM" → `deleteEvent()`

### Reminder Commands

- "Remind me to call Mom in 2 hours" → `createReminder()`
- "Remind me to buy groceries when I'm at the store" → `createLocationReminder()`
- "Snooze this reminder for 15 minutes" → `snoozeReminder()`
- "Mark reminder as done" → `completeReminder()`

### Delegation Commands

- "Remind Sarah about dinner tonight" → `delegateReminder()`
- "Send a reminder to Mom via WhatsApp" → `delegateReminder({ channel: 'whatsapp' })`

### Habits Commands

- "What do I usually do at this time?" → `predictNextAction()`
- "What should I do next?" → `offerProactiveAssistance()`

---

## 🔗 Integration with Command Router

```javascript
// In command-router.js
async handleSchedule(entities, context) {
    const { title, date, time, location } = entities;
    
    const result = await this.services.calendar.createEvent({
        title,
        start: `${date}T${time}`,
        location
    });
    
    return {
        status: 'success',
        service: 'calendar',
        action: 'create',
        data: result
    };
}

async handleReminder(entities, context) {
    const { title, time, location } = entities;
    
    if (location) {
        return await this.services.reminder.createLocationReminder({
            userId: context.userId,
            title,
            location
        });
    } else {
        return await this.services.reminder.createReminder({
            userId: context.userId,
            title,
            dueTime: time
        });
    }
}
```

---

## 📊 Database Schema

### Reminders Table

```sql
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_time TIMESTAMP NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    triggered_at TIMESTAMP,
    completed_at TIMESTAMP,
    snoozed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reminders_user_status ON reminders(user_id, status);
CREATE INDEX idx_reminders_due_time ON reminders(due_time);
```

### Location Reminders Table

```sql
CREATE TABLE location_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    radius INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'pending',
    triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Action History Table

```sql
CREATE TABLE action_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    context JSONB,
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_action_history_user_action ON action_history(user_id, action);
CREATE INDEX idx_action_history_created ON action_history(created_at);
```

### User Preferences Table

```sql
CREATE TABLE user_preferences (
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    preference JSONB,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, action)
);
```

---

## 🎯 Best Practices

1. **Reminder Timing**: Set reminders 15 minutes before events, or use location-based reminders for tasks
2. **Habit Detection**: Log actions consistently to build accurate patterns
3. **Delegation**: Use contextual messages to make delegated reminders more effective
4. **Conflict Detection**: Always check for conflicts before creating calendar events
5. **Preference Learning**: Let the system learn user preferences over time for better suggestions

---

## 📚 Further Reading

- `calendar-service.js` - Google Calendar integration
- `reminder-engine.js` - Reminder management
- `delegation-service.js` - Delegation feature
- `habits-engine.js` - Habits and predictions
- `ml/habit-detector.js` - ML-based habit detection
