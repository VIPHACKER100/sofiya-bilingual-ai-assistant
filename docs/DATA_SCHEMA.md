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

### `household_items` Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `name` | VARCHAR(100) | Item name |
| `location` | VARCHAR(255) | Current location |
| `category` | VARCHAR(50) | e.g., electronics, tools |
| `owner_id` | UUID (FK) | Primary owner |
| `updated_at` | TIMESTAMP | |

### `shared_calendar_events` Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `title` | VARCHAR(255) | |
| `start_time` | TIMESTAMP | |
| `end_time` | TIMESTAMP | |
| `is_shared` | BOOLEAN | Household visibility |
| `created_by` | UUID (FK) | |

### `gift_ideas` Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `recipient_name`| VARCHAR(100) | |
| `item_description`| TEXT | |
| `hidden_from` | UUID[] | Stealth Protocol IDs |
| `is_bought` | BOOLEAN | |
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
