from fastapi import APIRouter, Depends, Query
from datetime import datetime
from app.core.auth import get_current_user
from app.core.database import get_pool
from app.models.schemas import JournalCreate, JournalResponse
from ml.sentiment.analyzer import analyze_sentiment

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.post("", response_model=JournalResponse, status_code=201)
async def create_entry(body: JournalCreate, user: dict = Depends(get_current_user)):
    sentiment = analyze_sentiment(body.content)

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


@router.get("", response_model=list[JournalResponse])
async def list_entries(
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
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
