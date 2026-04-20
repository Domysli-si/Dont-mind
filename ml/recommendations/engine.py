def get_recommendations(
    mood_values: list[int],
    sentiments: list[str],
) -> list[str]:
    """
    Generate recommendation tags based on mood patterns and sentiment.

    Returns a list of tags to match against the recommendations table.
    """
    if not mood_values and not sentiments:
        return ["general"]

    tags: set[str] = set()

    avg_mood = sum(mood_values) / len(mood_values) if mood_values else 5.0
    negative_ratio = (
        sentiments.count("negative") / len(sentiments) if sentiments else 0.0
    )

    if avg_mood <= 4:
        tags.add("low_mood")
    if negative_ratio >= 0.5:
        tags.add("negative_sentiment")

    if avg_mood >= 7 and negative_ratio < 0.3:
        tags.add("positive_trend")

    if not tags:
        tags.add("general")

    return list(tags)
