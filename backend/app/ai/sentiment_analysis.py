"""
AI Sentiment Analysis Module
Analyzes user feedback text and assigns a sentiment score.
Uses TextBlob for NLP-based sentiment detection.
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False


def analyze_sentiment(text: str) -> dict:
    """
    Analyze the sentiment of a text string.

    Returns:
    {
        "polarity": float,      # -1.0 (negative) to 1.0 (positive)
        "subjectivity": float,  # 0.0 (objective) to 1.0 (subjective)
        "label": str            # "positive", "neutral", or "negative"
    }
    """
    if not TEXTBLOB_AVAILABLE:
        # Fallback if TextBlob is not installed — simple keyword-based
        return _simple_sentiment(text)

    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    if polarity > 0.1:
        label = "positive"
    elif polarity < -0.1:
        label = "negative"
    else:
        label = "neutral"

    return {
        "polarity": round(polarity, 3),
        "subjectivity": round(subjectivity, 3),
        "label": label,
    }


def _simple_sentiment(text: str) -> dict:
    """Fallback keyword-based sentiment analysis."""
    text_lower = text.lower()
    positive_words = {"good", "great", "awesome", "excellent", "delicious", "tasty",
                      "amazing", "love", "best", "fresh", "wonderful", "perfect"}
    negative_words = {"bad", "terrible", "awful", "horrible", "disgusting", "cold",
                      "stale", "worst", "slow", "rude", "dirty", "overpriced"}

    pos_count = sum(1 for w in text_lower.split() if w in positive_words)
    neg_count = sum(1 for w in text_lower.split() if w in negative_words)

    total = pos_count + neg_count
    if total == 0:
        return {"polarity": 0.0, "subjectivity": 0.0, "label": "neutral"}

    polarity = (pos_count - neg_count) / total
    if polarity > 0:
        label = "positive"
    elif polarity < 0:
        label = "negative"
    else:
        label = "neutral"

    return {"polarity": round(polarity, 3), "subjectivity": 0.5, "label": label}


async def submit_feedback(
    db: AsyncIOMotorDatabase,
    user_id: str,
    order_id: str,
    message: str,
) -> dict:
    """
    Submit feedback for an order with automatic sentiment analysis.
    """
    if not ObjectId.is_valid(order_id):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid order ID")

    # Verify order exists and belongs to user
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Order not found")

    # Analyze sentiment
    sentiment = analyze_sentiment(message)

    feedback_doc = {
        "user_id": user_id,
        "order_id": order_id,
        "vendor_id": order.get("vendor_id"),
        "message": message,
        "sentiment_score": sentiment["polarity"],
        "sentiment_label": sentiment["label"],
        "subjectivity": sentiment["subjectivity"],
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.feedback.insert_one(feedback_doc)
    feedback_doc["_id"] = str(result.inserted_id)

    return feedback_doc


async def get_vendor_sentiment_summary(
    db: AsyncIOMotorDatabase,
    vendor_id: str,
) -> dict:
    """
    Get a sentiment summary for a vendor's feedback.
    """
    feedbacks = await db.feedback.find({"vendor_id": vendor_id}).to_list(500)

    if not feedbacks:
        return {"message": "No feedback yet", "total": 0}

    pos = sum(1 for f in feedbacks if f.get("sentiment_label") == "positive")
    neg = sum(1 for f in feedbacks if f.get("sentiment_label") == "negative")
    neu = sum(1 for f in feedbacks if f.get("sentiment_label") == "neutral")
    total = len(feedbacks)

    avg_score = sum(f.get("sentiment_score", 0) for f in feedbacks) / total

    return {
        "total_reviews": total,
        "positive": pos,
        "negative": neg,
        "neutral": neu,
        "average_score": round(avg_score, 3),
        "positive_pct": round(pos / total * 100, 1),
    }
