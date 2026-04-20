from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.core.database import get_pool
from app.models.schemas import RecommendationResponse, RecommendationCreate
from ml.recommendations.engine import get_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("", response_model=list[RecommendationResponse])
async def list_recommendations(user: dict = Depends(get_current_user)):
    pool = await get_pool()

    mood_rows = await pool.fetch(
        """
        SELECT value FROM moods
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        """,
        user["user_id"],
    )
    journal_rows = await pool.fetch(
        """
        SELECT sentiment FROM journal_entries
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        """,
        user["user_id"],
    )

    mood_values = [r["value"] for r in mood_rows]
    sentiments = [r["sentiment"] for r in journal_rows]

    tags = get_recommendations(mood_values, sentiments)

    if not tags:
        all_recs = await pool.fetch(
            "SELECT id, title, description, tags FROM recommendations LIMIT 5"
        )
        return [RecommendationResponse(**dict(r)) for r in all_recs]

    recs = await pool.fetch(
        "SELECT id, title, description, tags FROM recommendations WHERE tags && $1",
        tags,
    )
    return [RecommendationResponse(**dict(r)) for r in recs]


# --- Admin endpoints ---

@router.post("/admin", response_model=RecommendationResponse, status_code=201)
async def create_recommendation(
    body: RecommendationCreate, user: dict = Depends(get_current_user)
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO recommendations (title, description, tags)
        VALUES ($1, $2, $3)
        RETURNING id, title, description, tags
        """,
        body.title,
        body.description,
        body.tags,
    )
    return RecommendationResponse(**dict(row))


@router.delete("/admin/{rec_id}", status_code=204)
async def delete_recommendation(rec_id: int, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    pool = await get_pool()
    result = await pool.execute(
        "DELETE FROM recommendations WHERE id = $1", rec_id
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Recommendation not found")
