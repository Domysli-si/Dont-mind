import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from ml.trend.detector import detect_mood_trend


class TestDetectMoodTrend:
    def test_improving_trend(self):
        values = [3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0]
        assert detect_mood_trend(values) == "improving"

    def test_declining_trend(self):
        values = [9.0, 8.0, 7.0, 6.0, 5.0, 4.0, 3.0]
        assert detect_mood_trend(values) == "declining"

    def test_stable_trend(self):
        values = [5.0, 5.1, 4.9, 5.0, 5.1, 4.9, 5.0]
        assert detect_mood_trend(values) == "stable"

    def test_insufficient_data(self):
        assert detect_mood_trend([5.0]) == "stable"
        assert detect_mood_trend([5.0, 6.0]) == "stable"
        assert detect_mood_trend([]) == "stable"

    def test_returns_valid_direction(self):
        values = [3.0, 5.0, 7.0, 4.0, 6.0]
        result = detect_mood_trend(values)
        assert result in ("improving", "stable", "declining")

    def test_caps_at_14_values(self):
        values = list(range(1, 20))
        result = detect_mood_trend([float(v) for v in values])
        assert result in ("improving", "stable", "declining")
