from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.models.schemas import DeviceTokenRegister, DeviceTokenResponse

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.post("/register-token", status_code=201)
async def register_device_token(
    body: DeviceTokenRegister, user: dict = Depends(get_current_user)
):
    return {"message": "Token registered (local mode — notifications not available)"}


@router.delete("/unregister-token", status_code=204)
async def unregister_device_token(user: dict = Depends(get_current_user)):
    return


@router.post("/test", status_code=200)
async def send_test_notification(user: dict = Depends(get_current_user)):
    return {"message": "Notifications not available in local mode"}
