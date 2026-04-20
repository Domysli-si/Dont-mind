import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.schemas import MoodCreate, JournalCreate, UserPreferencesUpdate


class TestMoodCreate:
    def test_valid_mood(self):
        mood = MoodCreate(value=5, note="Feeling okay")
        assert mood.value == 5
        assert mood.note == "Feeling okay"

    def test_min_value(self):
        mood = MoodCreate(value=1)
        assert mood.value == 1

    def test_max_value(self):
        mood = MoodCreate(value=10)
        assert mood.value == 10

    def test_below_min_raises(self):
        with pytest.raises(Exception):
            MoodCreate(value=0)

    def test_above_max_raises(self):
        with pytest.raises(Exception):
            MoodCreate(value=11)

    def test_note_optional(self):
        mood = MoodCreate(value=7)
        assert mood.note is None


class TestJournalCreate:
    def test_valid_entry(self):
        entry = JournalCreate(content="Today was a good day.")
        assert entry.content == "Today was a good day."

    def test_empty_content_raises(self):
        with pytest.raises(Exception):
            JournalCreate(content="")


class TestUserPreferencesUpdate:
    def test_partial_update(self):
        update = UserPreferencesUpdate(theme="dark")
        assert update.theme.value == "dark"
        assert update.notifications_enabled is None
        assert update.show_onboarding is None

    def test_all_fields(self):
        update = UserPreferencesUpdate(
            theme="light",
            notifications_enabled=False,
            show_onboarding=True,
        )
        assert update.theme.value == "light"
        assert update.notifications_enabled is False
        assert update.show_onboarding is True
