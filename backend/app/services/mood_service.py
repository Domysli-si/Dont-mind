from app.core.database import get_pool


async def get_recent_moods(user_id: str, days: int = 14) -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT id, value, note, created_at
        FROM moods
        WHERE user_id = $1 AND created_at >= NOW() - make_interval(days => $2)
        ORDER BY created_at DESC
        """,
        user_id,
        days,
    )
    return [dict(r) for r in rows]


async def create_mood(user_id: str, value: int, note: str | None = None) -> dict:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO moods (user_id, value, note)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, value, note, created_at
        """,
        user_id,
        value,
        note,
    )
    return dict(row)
