from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.core.database import get_pool
from app.models.schemas import (
    MoodTrendAnalysis,
    MoodTrendPoint,
    SentimentTrendPoint,
    CorrelationPoint,
)
from ml.trend.detector import detect_mood_trend

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/mood-trend", response_model=MoodTrendAnalysis)
async def mood_trend(user: dict = Depends(get_current_user)):
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

    values = [p.average for p in data_points]
    direction = detect_mood_trend(values)

    return MoodTrendAnalysis(direction=direction, data_points=data_points)


@router.get("/sentiment-trend", response_model=list[SentimentTrendPoint])
async def sentiment_trend(user: dict = Depends(get_current_user)):
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


@router.get("/correlation", response_model=list[CorrelationPoint])
async def correlation(user: dict = Depends(get_current_user)):
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
