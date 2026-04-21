# Database Schema

dont-worry uses PostgreSQL (hosted on Supabase). All tables use UUID for user references and timezone-aware timestamps.

## Entity Relationship Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email
        timestamp created_at
        varchar role
    }
    moods {
        serial id PK
        uuid user_id FK
        integer value
        text note
        timestamp created_at
    }
    journal_entries {
        serial id PK
        uuid user_id FK
        text content
        varchar sentiment
        timestamp created_at
    }
    recommendations {
        serial id PK
        varchar title
        text description
        text_array tags
    }
    user_preferences {
        uuid user_id PK_FK
        varchar theme
        boolean notifications_enabled
        boolean show_onboarding
        timestamp created_at
        timestamp updated_at
    }
    device_tokens {
        uuid user_id PK_FK
        varchar fcm_token
        varchar platform
        timestamp created_at
    }

    users ||--o{ moods : "records"
    users ||--o{ journal_entries : "writes"
    users ||--o| user_preferences : "has"
    users ||--o| device_tokens : "registers"
```

## Tables

### `users`
Managed by Supabase Auth. The `id` is the Supabase user UUID (`sub` claim in JWT). The `role` field supports `user`, `admin`, and future `therapist` roles.

### `moods`
Mood entries on a 1-10 scale with optional text note. Indexed on `(user_id, created_at)` for fast time-range queries.

### `journal_entries`
Free-text journal entries. The `sentiment` column is populated by the ML sentiment analyzer (NLTK VADER) at write time. Values: `positive`, `neutral`, `negative`.

### `recommendations`
Pre-seeded recommendation cards with tag-based matching. The `tags` column is a PostgreSQL text array used with the `&&` (overlap) operator for filtering.

### `user_preferences`
One-to-one with users. Stores theme choice, notification opt-in, and onboarding state. Upserted on first access.

### `device_tokens`
One-to-one with users. Stores the FCM registration token for push notifications. Updated on each notification opt-in, deleted on opt-out or logout.

## Migrations

Migration files are in `backend/sql/`:

| File | Description |
|------|-------------|
| `001_init.sql` | Initial schema: users, moods, journal_entries, recommendations, user_preferences + seed data |
| `002_device_tokens.sql` | Device tokens table for FCM push notifications |

## Indexes

- `idx_moods_user_date` — `moods(user_id, created_at)` for dashboard and analytics queries
- `idx_journal_user_date` — `journal_entries(user_id, created_at)` for journal listing and sentiment trend
