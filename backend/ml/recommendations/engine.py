from statistics import mean


def get_recommendations(
    mood_values: list[int | float],
    sentiments: list[str],
) -> list[str]:
    if not mood_values and not sentiments:
        return ["general"]

    tags: list[str] = []

    if mood_values:
        avg_mood = mean(mood_values)
        if avg_mood <= 4.0:
            tags.append("low_mood")
        elif avg_mood >= 7.0:
            tags.append("positive_trend")

    if sentiments:
        neg_ratio = sentiments.count("negative") / len(sentiments)
        if neg_ratio >= 0.5:
            tags.append("negative_sentiment")

    if not tags:
        tags.append("general")

    return tags
