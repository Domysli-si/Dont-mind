from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.models.schemas import (
    MoodTrendAnalysis,
    MoodTrendPoint,
    SentimentTrendPoint,
    CorrelationPoint,
)
from ml.trend.detector import detect_mood_trend
from app.core import json_storage
from collections import defaultdict

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/mood-trend", response_model=MoodTrendAnalysis)
async def mood_trend(user: dict = Depends(get_current_user)):
    settings = get_settings()
    if settings.has_database:
        from app.core.database import get_pool
        pool = await get_pool()
        rows = await pool.fetch(
            """
            SELECT DATE(created_at) AS date, AVG(value) AS average
            FROM moods
            WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '14 days'
            GROUP BY DATE(created_at)
            ORDER BY date
            """,
            user["user_id"],
        )
        data_points = [
            MoodTrendPoint(date=str(r["date"]), average=float(r["average"]))
            for r in rows
        ]
    else:
        moods = json_storage.get_moods(user["user_id"], limit=200)
        by_date: dict[str, list[float]] = defaultdict(list)
        for m in moods:
            day = m["created_at"][:10]
            by_date[day].append(float(m["value"]))
        data_points = sorted(
            [MoodTrendPoint(date=d, average=sum(vs) / len(vs)) for d, vs in by_date.items()],
            key=lambda p: p.date,
        )[-14:]

    values = [p.average for p in data_points]
    direction = detect_mood_trend(values)
    return MoodTrendAnalysis(direction=direction, data_points=data_points)


@router.get("/sentiment-trend", response_model=list[SentimentTrendPoint])
async def sentiment_trend(user: dict = Depends(get_current_user)):
    settings = get_settings()
    if settings.has_database:
        from app.core.database import get_pool
        pool = await get_pool()
        rows = await pool.fetch(
            """
            SELECT DATE(created_at) AS date,
                   COUNT(*) FILTER (WHERE sentiment = 'positive') AS positive,
                   COUNT(*) FILTER (WHERE sentiment = 'neutral') AS neutral,
                   COUNT(*) FILTER (WHERE sentiment = 'negative') AS negative
            FROM journal_entries
            WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date
            """,
            user["user_id"],
        )
        return [
            SentimentTrendPoint(
                date=str(r["date"]),
                positive=r["positive"],
                neutral=r["neutral"],
                negative=r["negative"],
            )
            for r in rows
        ]

    journals = json_storage.get_journals(user["user_id"], limit=500)
    by_date: dict[str, dict[str, int]] = defaultdict(lambda: {"positive": 0, "neutral": 0, "negative": 0})
    for j in journals:
        day = j["created_at"][:10]
        s = j.get("sentiment", "neutral")
        if s in by_date[day]:
            by_date[day][s] += 1
    return sorted(
        [SentimentTrendPoint(date=d, **counts) for d, counts in by_date.items()],
        key=lambda p: p.date,
    )[-30:]


@router.get("/correlation", response_model=list[CorrelationPoint])
async def correlation(user: dict = Depends(get_current_user)):
    settings = get_settings()
    if settings.has_database:
        from app.core.database import get_pool
        pool = await get_pool()
        rows = await pool.fetch(
            """
            SELECT
                m.date,
                m.avg_mood AS mood_value,
                CASE j.dominant_sentiment
                    WHEN 'positive' THEN 1.0
                    WHEN 'neutral' THEN 0.0
                    WHEN 'negative' THEN -1.0
                    ELSE 0.0
                END AS sentiment_score
            FROM (
                SELECT DATE(created_at) AS date, AVG(value) AS avg_mood
                FROM moods WHERE user_id = $1
                GROUP BY DATE(created_at)
            ) m
            JOIN (
                SELECT DATE(created_at) AS date,
                       MODE() WITHIN GROUP (ORDER BY sentiment) AS dominant_sentiment
                FROM journal_entries WHERE user_id = $1
                GROUP BY DATE(created_at)
            ) j ON m.date = j.date
            ORDER BY m.date
            """,
            user["user_id"],
        )
        return [
            CorrelationPoint(
                date=str(r["date"]),
                mood_value=float(r["mood_value"]),
                sentiment_score=float(r["sentiment_score"]),
            )
            for r in rows
        ]

    moods = json_storage.get_moods(user["user_id"], limit=500)
    journals = json_storage.get_journals(user["user_id"], limit=500)

    mood_by_date: dict[str, list[float]] = defaultdict(list)
    for m in moods:
        mood_by_date[m["created_at"][:10]].append(float(m["value"]))

    journal_by_date: dict[str, list[str]] = defaultdict(list)
    for j in journals:
        journal_by_date[j["created_at"][:10]].append(j.get("sentiment", "neutral"))

    results = []
    for day in sorted(set(mood_by_date) & set(journal_by_date)):
        avg_mood = sum(mood_by_date[day]) / len(mood_by_date[day])
        sents = journal_by_date[day]
        score_map = {"positive": 1.0, "neutral": 0.0, "negative": -1.0}
        avg_sent = sum(score_map.get(s, 0) for s in sents) / len(sents)
        results.append(CorrelationPoint(date=day, mood_value=avg_mood, sentiment_score=avg_sent))

    return results
