import re
import json
import requests
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Review

YANDEX_ORG_URL = "https://yandex.by/maps/org/193405220203/reviews/"


def fetch_yandex_reviews() -> list[dict]:
    """Fetch and parse 5-star reviews from Yandex Maps."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    session = requests.Session()
    resp = session.get(YANDEX_ORG_URL, headers=headers, allow_redirects=True, timeout=30)
    resp.raise_for_status()
    html = resp.text

    # Extract review objects from inline JSON inside <script> tags
    scripts = re.findall(r"<script[^>]*>(.*?)</script>", html, re.DOTALL)
    reviews: list[dict] = []

    for script in scripts:
        if len(script) < 50_000 or "rating" not in script:
            continue

        for match in re.finditer(r'"reviews"\s*:\s*\[', script):
            start = match.end() - 1
            depth = 1
            in_string = False
            escape = False

            for j in range(start + 1, min(len(script), start + 500_000)):
                ch = script[j]
                if escape:
                    escape = False
                    continue
                if ch == "\\":
                    escape = True
                    continue
                if ch == '"' and not in_string:
                    in_string = True
                elif ch == '"' and in_string:
                    in_string = False
                elif not in_string:
                    if ch == "[":
                        depth += 1
                    elif ch == "]":
                        depth -= 1
                        if depth == 0:
                            end = j + 1
                            try:
                                arr = json.loads(script[start:end])
                                if (
                                    isinstance(arr, list)
                                    and arr
                                    and isinstance(arr[0], dict)
                                    and "rating" in arr[0]
                                ):
                                    reviews = arr
                                    break
                            except Exception:
                                pass
                            break
            else:
                continue
            break
        if reviews:
            break

    five_star = [
        {
            "yandexReviewId": str(r.get("reviewId", "")),
            "name": r.get("author", {}).get("name", "Аноним"),
            "avatarUrl": _resolve_avatar(r.get("author", {}).get("avatarUrl", "")),
            "rating": r.get("rating", 0),
            "text": r.get("text", ""),
        }
        for r in reviews
        if r.get("rating") == 5 and r.get("text")
    ]

    return five_star


def _resolve_avatar(template: str) -> str | None:
    if not template:
        return None
    return template.replace("{size}", "islands-200")


async def sync_yandex_reviews(db: AsyncSession) -> dict:
    """Sync 5-star Yandex reviews into local DB."""
    raw_reviews = fetch_yandex_reviews()
    created = 0
    skipped = 0

    for data in raw_reviews:
        if not data["yandexReviewId"]:
            continue

        existing = await db.execute(
            select(Review).where(Review.yandexReviewId == data["yandexReviewId"])
        )
        if existing.scalar_one_or_none():
            skipped += 1
            continue

        review = Review(
            name=data["name"],
            rating=data["rating"],
            text=data["text"],
            avatarUrl=data["avatarUrl"],
            yandexReviewId=data["yandexReviewId"],
            isActive=True,
        )
        db.add(review)
        created += 1

    await db.commit()
    return {"created": created, "skipped": skipped, "total_fetched": len(raw_reviews)}
