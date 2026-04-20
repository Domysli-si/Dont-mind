import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from ml.sentiment.analyzer import analyze_sentiment, get_sentiment_score


class TestAnalyzeSentiment:
    def test_positive_text(self):
        result = analyze_sentiment("I feel great today, everything is wonderful!")
        assert result == "positive"

    def test_negative_text(self):
        result = analyze_sentiment("I feel terrible and everything is going wrong.")
        assert result == "negative"

    def test_neutral_text(self):
        result = analyze_sentiment("The meeting is at 3pm.")
        assert result == "neutral"

    def test_empty_string(self):
        result = analyze_sentiment("")
        assert result == "neutral"

    def test_whitespace_only(self):
        result = analyze_sentiment("   ")
        assert result == "neutral"

    def test_returns_valid_label(self):
        for text in [
            "happy day",
            "sad moment",
            "just a regular update",
        ]:
            result = analyze_sentiment(text)
            assert result in ("positive", "neutral", "negative")


class TestGetSentimentScore:
    def test_positive_score(self):
        score = get_sentiment_score("I love this, it's amazing!")
        assert score > 0

    def test_negative_score(self):
        score = get_sentiment_score("I hate this, it's terrible.")
        assert score < 0

    def test_empty_returns_zero(self):
        assert get_sentiment_score("") == 0.0

    def test_score_range(self):
        score = get_sentiment_score("Some random text here.")
        assert -1.0 <= score <= 1.0
