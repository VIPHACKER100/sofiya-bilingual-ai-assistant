# SOFIYA Social & Relationship Management Guide

## 👥 Social Secretary

### Managing Contacts

```javascript
import { SocialSecretary } from './backend/social-secretary.js';

const social = new SocialSecretary({
    db: dbConnection,
    notificationService: notificationService
});

// Add contact with social metadata
await social.addContact({
    userId: 'user123',
    name: 'Sarah',
    phone: '+1234567890',
    email: 'sarah@example.com',
    birthday: '1990-05-15',
    anniversary: '2015-06-20',
    preferences: { hobbies: 'photography', favorite_store: 'Amazon' },
    giftIdeas: ['camera lens', 'photo album'],
    notes: 'Loves nature photography'
});

// Get upcoming birthdays
const birthdays = await social.getUpcomingBirthdays('user123', 30);

// Set birthday reminders (14, 7, 1 days before)
await social.setBirthdayReminders('user123', [14, 7, 1]);
```

### Gift Suggestions & Messages

```javascript
// Get gift suggestions for contact
const giftIdeas = await social.suggestGiftIdeas(contactId);

// Generate birthday message
const message = await social.generateMessage('Sarah', 'birthday', 'heartfelt');
// Returns: "Happy Birthday, Sarah! Wishing you a day filled with joy..."

// Generate anniversary message
const annivMessage = await social.generateMessage('Sarah & John', 'anniversary', 'formal');
```

---

## 📋 Meeting Briefing

### Getting Meeting Briefings

```javascript
import { MeetingBriefing } from './backend/meeting-briefing.js';

const briefing = new MeetingBriefing({
    db: dbConnection,
    calendarService: calendarService,
    newsService: newsService
});

// Get briefings for upcoming meetings (next 24 hours)
const briefings = await briefing.getMeetingBriefings('user123', 24);

// Each briefing includes:
// - Person info (name, interests)
// - Recent news about attendee
// - Common topics
// - Past interactions
// - Suggested talking points
// - Optimal timing (30 min before meeting)
```

### Briefing Structure

```javascript
// Example briefing structure
{
    event: { title: 'Project Review', start: '...', end: '...' },
    person: 'colleague@example.com',
    briefing: {
        recentNews: [...],
        interests: ['tech', 'AI'],
        commonTopics: ['machine learning', 'product development'],
        suggestedTalkingPoints: [
            'Recent news: "AI Startup Raises Funding" - conversation starter',
            'Shared interests: machine learning',
            'Ask about their recent projects'
        ],
        timing: { sendAt: '...', message: '30 minutes before meeting' }
    }
}
```

---

## 📅 Group Coordinator

### Finding Optimal Time Slots

```javascript
import { GroupCoordinator } from './integrations/group-coordinator.js';

const coordinator = new GroupCoordinator({
    calendarService: calendarService,
    whatsappService: whatsappService
});

// Find optimal slots for group meeting
const slots = await coordinator.findOptimalSlots({
    attendees: ['person1@example.com', 'person2@example.com'],
    durationMinutes: 60,
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    preferredTime: 'afternoon' // 'morning', 'afternoon', 'evening'
});

// Returns top 5 ranked slots
// [{ start: Date, end: Date, durationMinutes: 60, score: 110 }, ...]
```

### Sending Invites & Tracking RSVPs

```javascript
// Send meeting invites via WhatsApp
const result = await coordinator.sendInvites({
    eventTitle: 'Team Planning Session',
    startTime: slots[0].start,
    endTime: slots[0].end,
    location: 'Conference Room A',
    attendees: ['+1234567890', '+0987654321'],
    channel: 'whatsapp'
});

// Track RSVP
await coordinator.trackRSVP('event_123', 'person@example.com', 'accepted');

// Get RSVP status
const status = await coordinator.getRSVPStatus('event_123');
// { accepted: 3, declined: 1, tentative: 0, pending: 2 }
```

---

## 🗣️ Voice Commands

### Social Secretary

- "When is Sarah's birthday?" → `getUpcomingBirthdays()`
- "Remind me about upcoming birthdays" → `setBirthdayReminders()`
- "Suggest a gift for Sarah" → `suggestGiftIdeas()`
- "Generate a birthday message for Mom" → `generateMessage()`

### Meeting Briefing

- "Brief me on my meetings today" → `getMeetingBriefings()`
- "What should I talk about with John?" → Briefing talking points

### Group Coordination

- "Find a time for team meeting with Sarah and Mike" → `findOptimalSlots()`
- "Send meeting invites to the team" → `sendInvites()`
- "Who has RSVP'd to the meeting?" → `getRSVPStatus()`

---

## 📊 Database Schema

### Social Contacts Table

```sql
CREATE TABLE social_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    birthday DATE,
    anniversary DATE,
    preferences JSONB DEFAULT '{}',
    gift_ideas JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Meeting History Table

```sql
CREATE TABLE meeting_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    event_title VARCHAR(255),
    event_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Event RSVPs Table

```sql
CREATE TABLE event_rsvps (
    event_id VARCHAR(255) NOT NULL,
    attendee VARCHAR(255) NOT NULL,
    response VARCHAR(20) NOT NULL, -- accepted, declined, tentative
    responded_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (event_id, attendee)
);
```

---

## 📚 Further Reading

- `social-secretary.js` - Contact and relationship management
- `meeting-briefing.js` - Meeting preparation
- `group-coordinator.js` - Group scheduling

---

## 🚀 Standalone Demo Features (`sofiya-assistant.html`)

The standalone demo provides simplified communication tools:

- **Bilingual Identity**: "Who are you?" / "तुम कौन हो?" (Assumes the assistant persona in both languages).
- **Deep Linking**:
  - **WhatsApp Messaging**: "WhatsApp Mom hello" / "मम्मी को व्हाट्सएप करो" (Opens `wa.me` in a new tab).
  - **Voice Calls**: "Call Mom" / "मम्मी को कॉल करो" (Triggers device dialer via `tel:` link).
- **Privacy**: No contact data is sent to a server; communication remains between you and your browser.
