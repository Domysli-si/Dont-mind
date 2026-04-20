import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from ml.recommendations.engine import get_recommendations


class TestGetRecommendations:
    def test_low_mood_tags(self):
        tags = get_recommendations([2, 3, 3, 2, 4], ["neutral", "neutral"])
        assert "low_mood" in tags

    def test_negative_sentiment_tags(self):
        tags = get_recommendations(
            [5, 5, 5],
            ["negative", "negative", "negative", "positive"],
        )
        assert "negative_sentiment" in tags

    def test_positive_trend_tags(self):
        tags = get_recommendations(
            [8, 9, 7, 8, 9],
            ["positive", "positive", "neutral"],
        )
        assert "positive_trend" in tags

    def test_empty_input_returns_general(self):
        tags = get_recommendations([], [])
        assert tags == ["general"]

    def test_moderate_mood_returns_general(self):
        tags = get_recommendations([5, 6, 5, 6], ["neutral", "neutral"])
        assert "general" in tags

    def test_combined_low_mood_and_negative(self):
        tags = get_recommendations(
            [2, 3, 1, 2],
            ["negative", "negative", "negative"],
        )
        assert "low_mood" in tags
        assert "negative_sentiment" in tags
