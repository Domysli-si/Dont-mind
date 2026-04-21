from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


# --- Mood ---

class MoodCreate(BaseModel):
    value: int = Field(..., ge=1, le=10)
    note: str | None = None


class MoodResponse(BaseModel):
    id: int
    user_id: str
    value: int
    note: str | None
    created_at: datetime


# --- Journal ---

class SentimentLabel(str, Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class JournalCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class JournalResponse(BaseModel):
    id: int
    user_id: str
    content: str
    sentiment: SentimentLabel | None
    created_at: datetime


# --- Recommendations ---

class RecommendationResponse(BaseModel):
    id: int
    title: str
    description: str
    tags: list[str]


class RecommendationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
    tags: list[str] = Field(default_factory=list)


# --- User Preferences ---

class ThemeChoice(str, Enum):
    light = "light"
    dark = "dark"
    system = "system"


class UserPreferencesResponse(BaseModel):
    user_id: str
    theme: ThemeChoice
    notifications_enabled: bool
    show_onboarding: bool
    created_at: datetime
    updated_at: datetime


class UserPreferencesUpdate(BaseModel):
    theme: ThemeChoice | None = None
    notifications_enabled: bool | None = None
    show_onboarding: bool | None = None


# --- Analytics ---

class MoodTrendPoint(BaseModel):
    date: str
    average: float


class SentimentTrendPoint(BaseModel):
    date: str
    positive: int
    neutral: int
    negative: int


class TrendDirection(str, Enum):
    improving = "improving"
    stable = "stable"
    declining = "declining"


class MoodTrendAnalysis(BaseModel):
    direction: TrendDirection
    data_points: list[MoodTrendPoint]


class CorrelationPoint(BaseModel):
    mood_value: float
    sentiment_score: float
    date: str


# --- Device Tokens / Notifications ---

class DeviceTokenRegister(BaseModel):
    fcm_token: str = Field(..., min_length=1, max_length=500)
    platform: str = Field(default="web", max_length=20)


class DeviceTokenResponse(BaseModel):
    user_id: str
    fcm_token: str
    platform: str
    created_at: datetime


# --- Sync ---

class SyncMoodItem(BaseModel):
    value: int = Field(..., ge=1, le=10)
    note: str | None = None
    created_at: datetime


class SyncJournalItem(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    created_at: datetime


class SyncRequest(BaseModel):
    moods: list[SyncMoodItem] = Field(default_factory=list)
    journals: list[SyncJournalItem] = Field(default_factory=list)


class SyncResponse(BaseModel):
    synced_moods: int
    synced_journals: int
