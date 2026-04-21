from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.models.schemas import UserPreferencesResponse, UserPreferencesUpdate
from app.core import json_storage

router = APIRouter(prefix="/api/user/preferences", tags=["preferences"])


@router.get("", response_model=UserPreferencesResponse)
async def get_preferences(user: dict = Depends(get_current_user)):
    settings = get_settings()
    if settings.has_database:
        from app.core.database import get_pool
        pool = await get_pool()
        row = await pool.fetchrow(
            """
            SELECT user_id, theme, notifications_enabled, show_onboarding,
                   created_at, updated_at
            FROM user_preferences WHERE user_id = $1
            """,
            user["user_id"],
        )
        if not row:
            row = await pool.fetchrow(
                """
                INSERT INTO user_preferences
                    (user_id, theme, notifications_enabled, show_onboarding,
                     created_at, updated_at)
                VALUES ($1, 'system', true, true, NOW(), NOW())
                RETURNING user_id, theme, notifications_enabled, show_onboarding,
                          created_at, updated_at
                """,
                user["user_id"],
            )
        return UserPreferencesResponse(**dict(row))

    pref = json_storage.get_preferences(user["user_id"])
    return UserPreferencesResponse(**pref)


@router.put("", response_model=UserPreferencesResponse)
async def update_preferences(
    body: UserPreferencesUpdate, user: dict = Depends(get_current_user)
):
    settings = get_settings()
    if settings.has_database:
        from app.core.database import get_pool
        pool = await get_pool()
        existing = await pool.fetchrow(
            "SELECT 1 FROM user_preferences WHERE user_id = $1",
            user["user_id"],
        )
        if not existing:
            await pool.execute(
                """
                INSERT INTO user_preferences
                    (user_id, theme, notifications_enabled, show_onboarding,
                     created_at, updated_at)
                VALUES ($1, 'system', true, true, NOW(), NOW())
                """,
                user["user_id"],
            )

        updates = []
        params: list = []
        idx = 1
        if body.theme is not None:
            updates.append(f"theme = ${idx}")
            params.append(body.theme.value)
            idx += 1
        if body.notifications_enabled is not None:
            updates.append(f"notifications_enabled = ${idx}")
            params.append(body.notifications_enabled)
            idx += 1
        if body.show_onboarding is not None:
            updates.append(f"show_onboarding = ${idx}")
            params.append(body.show_onboarding)
            idx += 1

        if updates:
            updates.append("updated_at = NOW()")
            params.append(user["user_id"])
            await pool.execute(
                f"UPDATE user_preferences SET {', '.join(updates)} WHERE user_id = ${idx}",
                *params,
            )

        row = await pool.fetchrow(
            """
            SELECT user_id, theme, notifications_enabled, show_onboarding,
                   created_at, updated_at
            FROM user_preferences WHERE user_id = $1
            """,
            user["user_id"],
        )
        return UserPreferencesResponse(**dict(row))

    updates = {}
    if body.theme is not None:
        updates["theme"] = body.theme.value
    if body.notifications_enabled is not None:
        updates["notifications_enabled"] = body.notifications_enabled
    if body.show_onboarding is not None:
        updates["show_onboarding"] = body.show_onboarding

    pref = json_storage.update_preferences(user["user_id"], updates)
    return UserPreferencesResponse(**pref)
