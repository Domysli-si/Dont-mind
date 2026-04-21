from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.core.database import get_pool
from app.models.schemas import DeviceTokenRegister, DeviceTokenResponse
from app.services.notification_service import send_push

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.post("/register-token", response_model=DeviceTokenResponse, status_code=201)
async def register_device_token(
    body: DeviceTokenRegister, user: dict = Depends(get_current_user)
):
    """Register or update an FCM device token for push notifications."""
    pool = await get_pool()

    row = await pool.fetchrow(
        """
        INSERT INTO device_tokens (user_id, fcm_token, platform)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET fcm_token = $2, platform = $3
        RETURNING user_id, fcm_token, platform, created_at
        """,
        user["user_id"],
        body.fcm_token,
        body.platform,
    )
    return DeviceTokenResponse(**dict(row))


@router.delete("/unregister-token", status_code=204)
async def unregister_device_token(user: dict = Depends(get_current_user)):
    """Remove device token (e.g. on logout or notification opt-out)."""
    pool = await get_pool()
    await pool.execute(
        "DELETE FROM device_tokens WHERE user_id = $1",
        user["user_id"],
    )


@router.post("/test", status_code=200)
async def send_test_notification(user: dict = Depends(get_current_user)):
    """Send a test push notification to the current user's registered device."""
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT fcm_token FROM device_tokens WHERE user_id = $1",
        user["user_id"],
    )

    if not row:
        raise HTTPException(status_code=404, detail="No device token registered")

    ok = await send_push(
        token=row["fcm_token"],
        title="dont-worry",
        body="Testovaci notifikace — vse funguje!",
    )

    if not ok:
        raise HTTPException(status_code=502, detail="Failed to send notification")

    return {"message": "Notification sent"}
