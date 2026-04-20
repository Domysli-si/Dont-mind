# API Documentation

Base URL: `http://localhost:8000` (development) or your Railway deployment URL.

All protected endpoints require a valid Supabase JWT in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Health Check

### `GET /api/health`

Returns API health status. No authentication required.

**Response:**
```json
{ "status": "ok" }
```

---

## Moods

### `POST /api/moods`

Create a new mood entry.

**Request Body:**
```json
{
  "value": 7,
  "note": "Feeling pretty good today"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| value | integer (1-10) | yes | Mood value |
| note | string | no | Optional note |

**Response (201):**
```json
{
  "id": 1,
  "user_id": "uuid",
  "value": 7,
  "note": "Feeling pretty good today",
  "created_at": "2026-01-15T10:30:00Z"
}
```

### `GET /api/moods`

List mood entries for the authenticated user.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| start | datetime | null | Filter from date |
| end | datetime | null | Filter to date |
| limit | integer | 50 | Max results (1-200) |

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": "uuid",
    "value": 7,
    "note": "Feeling pretty good today",
    "created_at": "2026-01-15T10:30:00Z"
  }
]
```

---

## Journal

### `POST /api/journal`

Create a journal entry. Sentiment is automatically analyzed by the ML module.

**Request Body:**
```json
{
  "content": "Today I went for a walk and it really helped clear my mind."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string (1-5000 chars) | yes | Journal text |

**Response (201):**
```json
{
  "id": 1,
  "user_id": "uuid",
  "content": "Today I went for a walk and it really helped clear my mind.",
  "sentiment": "positive",
  "created_at": "2026-01-15T10:30:00Z"
}
```

### `GET /api/journal`

List journal entries for the authenticated user. Same query parameters as moods.

---

## Analytics

### `GET /api/analytics/mood-trend`

Returns daily average mood for the last 14 days and trend direction.

**Response (200):**
```json
{
  "direction": "improving",
  "data_points": [
    { "date": "2026-01-10", "average": 5.0 },
    { "date": "2026-01-11", "average": 6.5 }
  ]
}
```

### `GET /api/analytics/sentiment-trend`

Returns daily sentiment counts for the last 30 days.

**Response (200):**
```json
[
  {
    "date": "2026-01-10",
    "positive": 2,
    "neutral": 1,
    "negative": 0
  }
]
```

### `GET /api/analytics/correlation`

Returns mood value vs sentiment score pairs for scatter chart visualization.

**Response (200):**
```json
[
  {
    "date": "2026-01-10",
    "mood_value": 7.0,
    "sentiment_score": 0.5
  }
]
```

---

## Recommendations

### `GET /api/recommendations`

Returns personalized recommendations based on the user's mood and sentiment data from the last 7 days.

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Take a Walk",
    "description": "A short 15-minute walk can significantly improve your mood.",
    "tags": ["activity", "low_mood"]
  }
]
```

### `POST /api/recommendations/admin` (admin only)

Create a new recommendation.

### `DELETE /api/recommendations/admin/{rec_id}` (admin only)

Delete a recommendation.

---

## User Preferences

### `GET /api/user/preferences`

Get the authenticated user's preferences. Creates defaults if none exist.

**Response (200):**
```json
{
  "user_id": "uuid",
  "theme": "system",
  "notifications_enabled": true,
  "show_onboarding": true,
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

### `PUT /api/user/preferences`

Update user preferences. All fields are optional (partial update).

**Request Body:**
```json
{
  "theme": "dark",
  "notifications_enabled": false
}
```

---

## Sync

### `POST /api/sync`

Batch sync offline data. Uses last-write-wins conflict resolution.

**Request Body:**
```json
{
  "moods": [
    { "value": 7, "note": "Good day", "created_at": "2026-01-15T10:30:00Z" }
  ],
  "journals": [
    { "content": "Went for a walk.", "created_at": "2026-01-15T11:00:00Z" }
  ]
}
```

**Response (200):**
```json
{
  "synced_moods": 1,
  "synced_journals": 1
}
```
