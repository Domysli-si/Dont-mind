from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.core.database import get_pool
from app.models.schemas import SyncRequest, SyncResponse
from ml.sentiment.analyzer import analyze_sentiment

router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.post("", response_model=SyncResponse)
async def sync_offline_data(
    body: SyncRequest, user: dict = Depends(get_current_user)
):
    pool = await get_pool()
    synced_moods = 0
    synced_journals = 0

    async with pool.acquire() as conn:
        async with conn.transaction():
            for mood in body.moods:
                existing = await conn.fetchrow(
                    """
                    SELECT id FROM moods
                    WHERE user_id = $1 AND created_at = $2
                    """,
                    user["user_id"],
                    mood.created_at,
                )
                if existing:
                    await conn.execute(
                        """
                        UPDATE moods SET value = $1, note = $2
                        WHERE user_id = $3 AND created_at = $4
                        """,
                        mood.value,
                        mood.note,
                        user["user_id"],
                        mood.created_at,
                    )
                else:
                    await conn.execute(
                        """
                        INSERT INTO moods (user_id, value, note, created_at)
                        VALUES ($1, $2, $3, $4)
                        """,
                        user["user_id"],
                        mood.value,
                        mood.note,
                        mood.created_at,
                    )
                synced_moods += 1

            for entry in body.journals:
                sentiment = analyze_sentiment(entry.content)
                existing = await conn.fetchrow(
                    """
                    SELECT id FROM journal_entries
                    WHERE user_id = $1 AND created_at = $2
                    """,
                    user["user_id"],
                    entry.created_at,
                )
                if existing:
                    await conn.execute(
                        """
                        UPDATE journal_entries SET content = $1, sentiment = $2
                        WHERE user_id = $3 AND created_at = $4
                        """,
                        entry.content,
                        sentiment,
                        user["user_id"],
                        entry.created_at,
                    )
                else:
                    await conn.execute(
                        """
                        INSERT INTO journal_entries
                            (user_id, content, sentiment, created_at)
                        VALUES ($1, $2, $3, $4)
                        """,
                        user["user_id"],
                        entry.content,
                        sentiment,
                        entry.created_at,
                    )
                synced_journals += 1

    return SyncResponse(synced_moods=synced_moods, synced_journals=synced_journals)
