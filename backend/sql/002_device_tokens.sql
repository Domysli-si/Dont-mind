-- Device tokens for FCM push notifications

CREATE TABLE IF NOT EXISTS device_tokens (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    fcm_token VARCHAR(500) NOT NULL,
    platform VARCHAR(20) NOT NULL DEFAULT 'web',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
