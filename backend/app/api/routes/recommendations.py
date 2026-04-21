from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.models.schemas import RecommendationResponse, RecommendationCreate
from ml.recommendations.engine import get_recommendations
from app.core import json_storage

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

LOCAL_RECOMMENDATIONS = [
    {"id": 1, "title": "Deep Breathing", "description": "Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s.", "tags": ["low_mood", "general"]},
    {"id": 2, "title": "Gratitude Journal", "description": "Write down 3 things you're grateful for today.", "tags": ["general", "positive_trend"]},
    {"id": 3, "title": "Take a Walk", "description": "A 15-minute walk outdoors can boost your mood.", "tags": ["low_mood", "negative_sentiment"]},
    {"id": 4, "title": "Mindful Meditation", "description": "Spend 5 minutes focusing on your breath.", "tags": ["negative_sentiment", "general"]},
    {"id": 5, "title": "Connect with Someone", "description": "Reach out to a friend or family member.", "tags": ["low_mood", "negative_sentiment"]},
    {"id": 6, "title": "Celebrate Progress", "description": "Acknowledge your positive streak — you're doing great!", "tags": ["positive_trend"]},
    {"id": 7, "title": "Creative Expression", "description": "Draw, write, or play music for 15 minutes.", "tags": ["general", "low_mood"]},
    {"id": 8, "title": "Sleep Hygiene", "description": "Aim for 7-9 hours and keep a consistent schedule.", "tags": ["low_mood", "negative_sentiment"]},
]


@router.get("", response_model=list[RecommendationResponse])
async def list_recommendations(user: dict = Depends(get_current_user)):
    settings = get_settings()
    if settings.has_database:
        from app.core.database import get_pool
        pool = await get_pool()
        mood_rows = await pool.fetch(
            "SELECT value FROM moods WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days' ORDER BY created_at DESC",
            user["user_id"],
        )
        journal_rows = await pool.fetch(
            "SELECT sentiment FROM journal_entries WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days' ORDER BY created_at DESC",
            user["user_id"],
        )
        mood_values = [r["value"] for r in mood_rows]
        sentiments = [r["sentiment"] for r in journal_rows]
        tags = get_recommendations(mood_values, sentiments)

        if not tags:
            all_recs = await pool.fetch("SELECT id, title, description, tags FROM recommendations LIMIT 5")
            return [RecommendationResponse(**dict(r)) for r in all_recs]

        recs = await pool.fetch("SELECT id, title, description, tags FROM recommendations WHERE tags && $1", tags)
        return [RecommendationResponse(**dict(r)) for r in recs]

    moods = json_storage.get_moods(user["user_id"], limit=50)
    journals = json_storage.get_journals(user["user_id"], limit=50)
    mood_values = [m["value"] for m in moods]
    sentiments = [j.get("sentiment", "neutral") for j in journals]
    tags = get_recommendations(mood_values, sentiments)

    matched = [r for r in LOCAL_RECOMMENDATIONS if any(t in r["tags"] for t in tags)]
    if not matched:
        matched = [r for r in LOCAL_RECOMMENDATIONS if "general" in r["tags"]]
    return [RecommendationResponse(**r) for r in matched[:5]]
