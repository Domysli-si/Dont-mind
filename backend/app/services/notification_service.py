import json
import firebase_admin
from firebase_admin import credentials, messaging
from app.core.config import get_settings

_app_initialized = False


def _ensure_firebase():
    global _app_initialized
    if _app_initialized:
        return
    settings = get_settings()
    try:
        cred = credentials.Certificate(settings.firebase_credentials)
        firebase_admin.initialize_app(cred)
        _app_initialized = True
    except Exception:
        pass


async def send_push(token: str, title: str, body: str, data: dict | None = None) -> bool:
    _ensure_firebase()
    if not _app_initialized:
        return False

    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data=data or {},
        token=token,
    )

    try:
        messaging.send(message)
        return True
    except messaging.UnregisteredError:
        return False
    except Exception:
        return False


async def send_daily_reminders(pool) -> int:
    """Send mood reminder to all users with notifications enabled and a stored FCM token."""
    rows = await pool.fetch(
        """
        SELECT up.user_id, dt.fcm_token
        FROM user_preferences up
        JOIN device_tokens dt ON dt.user_id = up.user_id
        WHERE up.notifications_enabled = true
        """
    )

    sent = 0
    for row in rows:
        ok = await send_push(
            token=row["fcm_token"],
            title="dont-worry",
            body="Jak se dnes citite? Zaznamenejte svou naladu.",
        )
        if ok:
            sent += 1

    return sent
