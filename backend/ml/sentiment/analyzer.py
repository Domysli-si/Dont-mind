import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

try:
    nltk.data.find("sentiment/vader_lexicon.zip")
except LookupError:
    nltk.download("vader_lexicon", quiet=True)

_sid = SentimentIntensityAnalyzer()

POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05


def get_sentiment_score(text: str) -> float:
    if not text or not text.strip():
        return 0.0
    scores = _sid.polarity_scores(text)
    return scores["compound"]


def analyze_sentiment(text: str) -> str:
    score = get_sentiment_score(text)
    if score >= POSITIVE_THRESHOLD:
        return "positive"
    elif score <= NEGATIVE_THRESHOLD:
        return "negative"
    return "neutral"
