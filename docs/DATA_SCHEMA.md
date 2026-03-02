# 🗄️ SOFIYA Data Schema

This document outlines the database schema for PostgreSQL and Redis.

## 🐘 PostgreSQL Schema (Relational)

### `users` Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique user ID |
| `username` | VARCHAR(50) | Display name |
| `email` | VARCHAR(255) | Unique email |
| `password_hash`| TEXT | Encrypted password |
| `settings` | JSONB | Personality, language, theme preferences |
| `created_at` | TIMESTAMP | Creation time |

### `contacts` Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique contact ID |
| `user_id` | UUID (FK) | Owner of the contact |
| `name` | VARCHAR(100) | Contact name/nickname |
| `phone` | VARCHAR(20) | WhatsApp/Phone number |
| `metadata` | JSONB | Birthdays, relationship, etc. |

### `reminders` Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK) | |
| `text` | TEXT | |
| `due_time` | TIMESTAMP | |
| `status` | ENUM | PENDING, COMPLETED, SNOOZED |
| `escalation` | INT | 1, 2, or 3 |

### `scenes` Table

| Column | Type | Description |
|---|---|---|
| `id` | VARCHAR(50) (PK) | e.g., 'movie_night' |
| `name` | VARCHAR(100) | |
| `actions` | JSONB | Array of device commands |

### `health_data` Table

| Column | Type | Description |
|---|---|---|
| `id` | BIGSERIAL (PK) | |
| `user_id` | UUID (FK) | |
| `metric_type` | VARCHAR(50) | steps, heart_rate, sleep |
| `value` | NUMERIC | |
| `recorded_at` | TIMESTAMP | |

### `item_locations` Table

| Column | Type | Description |
|---|---|---|
| `user_id` | UUID (FK) | Owner of the item |
| `item_name` | VARCHAR(100)| Unique item name per user |
| `location` | VARCHAR(255) | Current location |
| `room` | VARCHAR(50) | Room name |
| `confidence` | DECIMAL | OCR/Verfication confidence |
| `is_shared` | BOOLEAN | Household visibility |
| `last_seen` | TIMESTAMP | Last movement time |

### `calendar_events` Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK) | |
| `title` | VARCHAR(255) | |
| `start_time` | TIMESTAMP | |
| `end_time` | TIMESTAMP | |
| `is_shared` | BOOLEAN | Household visibility |
| `created_at` | TIMESTAMP | |

### `shared_gifts` Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK) | |
| `target_contact_id`| UUID (FK)| Linked contact |
| `gift_idea` | TEXT | Description |
| `price_estimate` | DECIMAL | |
| `hidden_from` | UUID[] | Stealth Protocol IDs |
| `created_at` | TIMESTAMP | |

---

## ⚡ Redis Schema (Key-Value/Cache)

### `session:{user_id}`

- **Type**: String (JSON)
- **Content**: Current session state, active tokens.
- **TTL**: 24 hours.

### `context:{user_id}`

- **Type**: List
- **Content**: Last 10 conversation turns (transcript + response).
- **TTL**: 1 hour.

### `cache:weather:{lat}:{lon}`

- **Type**: String (JSON)
- **Content**: Cached API response from Open-Meteo.
- **TTL**: 30 minutes.
