import numpy as np
from sklearn.linear_model import LinearRegression


def detect_mood_trend(values: list[float]) -> str:
    """
    Analyze mood values over time and classify the trend.

    Uses linear regression on the last 14 data points.
    Returns 'improving', 'stable', or 'declining'.
    """
    if len(values) < 3:
        return "stable"

    recent = values[-14:]
    X = np.arange(len(recent)).reshape(-1, 1)
    y = np.array(recent)

    model = LinearRegression()
    model.fit(X, y)

    slope = model.coef_[0]

    # Threshold: slope of ~0.1 per day is meaningful on a 1-10 scale
    if slope > 0.1:
        return "improving"
    elif slope < -0.1:
        return "declining"
    else:
        return "stable"
