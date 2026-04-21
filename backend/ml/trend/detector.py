import numpy as np
from sklearn.linear_model import LinearRegression

MIN_DATA_POINTS = 3
MAX_DATA_POINTS = 14
SLOPE_THRESHOLD = 0.15


def detect_mood_trend(values: list[float]) -> str:
    if len(values) < MIN_DATA_POINTS:
        return "stable"

    trimmed = values[-MAX_DATA_POINTS:]
    X = np.arange(len(trimmed)).reshape(-1, 1)
    y = np.array(trimmed)

    model = LinearRegression()
    model.fit(X, y)

    slope = model.coef_[0]

    if slope > SLOPE_THRESHOLD:
        return "improving"
    elif slope < -SLOPE_THRESHOLD:
        return "declining"
    return "stable"
