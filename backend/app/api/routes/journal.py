from fastapi import APIRouter, Depends, Query
from datetime import datetime
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.models.schemas import JournalCreate, JournalResponse
from ml.sentiment.analyzer import analyze_sentiment
from app.core import json_storage

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.post("", response_model=JournalResponse, status_code=201)
async def create_entry(body: JournalCreate, user: dict = Depends(get_current_user)):
    sentiment = analyze_sentiment(body.content)
    settings = get_settings()

    if settings.has_database:
        from app.core.database import get_pool
        pool = await get_pool()
        row = await pool.fetchrow(
            """
            INSERT INTO journal_entries (user_id, content, sentiment, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, user_id, content, sentiment, created_at
            """,
            user["user_id"],
            body.content,
            sentiment,
        )
        return JournalResponse(**dict(row))

    entry = json_storage.add_journal(user["user_id"], body.content, sentiment)
    return JournalResponse(**entry)


@router.get("", response_model=list[JournalResponse])
async def list_entries(
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    settings = get_settings()
    if settings.has_database:
        from app.core.database import get_pool
        pool = await get_pool()
        query = """
            SELECT id, user_id, content, sentiment, created_at
            FROM journal_entries WHERE user_id = $1
        """
        params: list = [user["user_id"]]
        idx = 2

        if start:
            query += f" AND created_at >= ${idx}"
            params.append(start)
            idx += 1
        if end:
            query += f" AND created_at <= ${idx}"
            params.append(end)
            idx += 1

        query += f" ORDER BY created_at DESC LIMIT ${idx}"
        params.append(limit)

        rows = await pool.fetch(query, *params)
        return [JournalResponse(**dict(r)) for r in rows]

    journals = json_storage.get_journals(
        user["user_id"],
        limit=limit,
        start=start.isoformat() if start else None,
        end=end.isoformat() if end else None,
    )
    return [JournalResponse(**j) for j in journals]
