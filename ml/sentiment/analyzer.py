import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

nltk.download("vader_lexicon", quiet=True)

_analyzer = SentimentIntensityAnalyzer()

POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05


def analyze_sentiment(text: str) -> str:
    """Classify text as positive, neutral, or negative using VADER."""
    if not text or not text.strip():
        return "neutral"

    scores = _analyzer.polarity_scores(text)
    compound = scores["compound"]

    if compound >= POSITIVE_THRESHOLD:
        return "positive"
    elif compound <= NEGATIVE_THRESHOLD:
        return "negative"
    else:
        return "neutral"


def get_sentiment_score(text: str) -> float:
    """Return the raw VADER compound score for a text."""
    if not text or not text.strip():
        return 0.0
    return _analyzer.polarity_scores(text)["compound"]
