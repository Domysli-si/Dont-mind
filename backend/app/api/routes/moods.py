from fastapi import APIRouter, Depends, Query
from datetime import datetime
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.models.schemas import MoodCreate, MoodResponse
from app.core import json_storage

router = APIRouter(prefix="/api/moods", tags=["moods"])


@router.post("", response_model=MoodResponse, status_code=201)
async def create_mood(body: MoodCreate, user: dict = Depends(get_current_user)):
    settings = get_settings()
    if settings.has_database:
        from app.core.database import get_pool
        pool = await get_pool()
        row = await pool.fetchrow(
            """
            INSERT INTO moods (user_id, value, note, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, user_id, value, note, created_at
            """,
            user["user_id"],
            body.value,
            body.note,
        )
        return MoodResponse(**dict(row))

    mood = json_storage.add_mood(user["user_id"], body.value, body.note)
    return MoodResponse(**mood)


@router.get("", response_model=list[MoodResponse])
async def list_moods(
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    settings = get_settings()
    if settings.has_database:
        from app.core.database import get_pool
        pool = await get_pool()
        query = "SELECT id, user_id, value, note, created_at FROM moods WHERE user_id = $1"
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
        return [MoodResponse(**dict(r)) for r in rows]

    moods = json_storage.get_moods(
        user["user_id"],
        limit=limit,
        start=start.isoformat() if start else None,
        end=end.isoformat() if end else None,
    )
    return [MoodResponse(**m) for m in moods]
