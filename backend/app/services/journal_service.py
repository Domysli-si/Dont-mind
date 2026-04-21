from app.core.database import get_pool
from ml.sentiment.analyzer import analyze_sentiment


async def get_recent_journals(user_id: str, days: int = 30) -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT id, content, sentiment, created_at
        FROM journal_entries
        WHERE user_id = $1 AND created_at >= NOW() - make_interval(days => $2)
        ORDER BY created_at DESC
        """,
        user_id,
        days,
    )
    return [dict(r) for r in rows]


async def create_journal(user_id: str, content: str) -> dict:
    sentiment = analyze_sentiment(content)
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO journal_entries (user_id, content, sentiment)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, content, sentiment, created_at
        """,
        user_id,
        content,
        sentiment,
    )
    return dict(row)
