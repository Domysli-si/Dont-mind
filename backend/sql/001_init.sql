-- dont-worry initial schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(20) NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS moods (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value INTEGER NOT NULL CHECK (value >= 1 AND value <= 10),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_moods_user_date ON moods(user_id, created_at);

CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sentiment VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_journal_user_date ON journal_entries(user_id, created_at);

CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(10) NOT NULL DEFAULT 'system',
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    show_onboarding BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default recommendations
INSERT INTO recommendations (title, description, tags) VALUES
    ('Take a Walk', 'A short 15-minute walk can significantly improve your mood and reduce stress.', '{activity,low_mood,negative_sentiment}'),
    ('Practice Meditation', 'Try a 5-minute guided meditation to center yourself and find calm.', '{mindfulness,low_mood,negative_sentiment}'),
    ('Write in Your Journal', 'Expressing your thoughts in writing can help process difficult emotions.', '{journaling,negative_sentiment}'),
    ('Connect with Someone', 'Reach out to a friend or family member for a brief chat.', '{social,low_mood}'),
    ('Try Deep Breathing', 'Box breathing (4-4-4-4) can activate your parasympathetic nervous system.', '{mindfulness,negative_sentiment}'),
    ('Listen to Music', 'Put on your favorite uplifting playlist to shift your mood.', '{activity,low_mood}'),
    ('Get Some Sunlight', 'Natural light exposure helps regulate serotonin production.', '{activity,low_mood}'),
    ('Practice Gratitude', 'Write down three things you are grateful for today.', '{mindfulness,general}'),
    ('Stretch Your Body', 'A few minutes of gentle stretching can release physical tension.', '{activity,general}'),
    ('Celebrate Progress', 'Your mood has been improving — keep up the positive habits!', '{positive_trend,general}');
