"""Fetch job description text from a URL."""
import re
import requests
from bs4 import BeautifulSoup
from fastapi import HTTPException

_URL_RE = re.compile(r"^https?://\S+$", re.IGNORECASE)

# Sites that block scraping — tell user to paste text manually
_BLOCKED_DOMAINS = ["linkedin.com", "xing.com"]

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
}


def is_url(text: str) -> bool:
    """Return True if the entire input looks like a single URL."""
    return bool(_URL_RE.match(text.strip()))


def fetch_job_description(url: str) -> str:
    """
    Fetch and return plain text from a job posting URL.
    Raises HTTPException with a user-friendly message on failure.
    """
    url = url.strip()

    # Check blocked domains
    for domain in _BLOCKED_DOMAINS:
        if domain in url:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"LinkedIn blocks automated access — please open the job posting, "
                    f"copy the full job description text, and paste it directly into the field."
                ),
            )

    try:
        resp = requests.get(url, headers=_HEADERS, timeout=10, allow_redirects=True)
        resp.raise_for_status()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=422, detail="Could not fetch the URL — request timed out. Please paste the job description text directly.")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=422, detail=f"Could not fetch the URL: {e}. Please paste the job description text directly.")

    soup = BeautifulSoup(resp.text, "html.parser")

    # Remove scripts, styles, nav, footer noise
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()

    text = soup.get_text(separator="\n")
    # Collapse excessive blank lines
    lines = [line.strip() for line in text.splitlines()]
    text = "\n".join(line for line in lines if line)

    if len(text) < 100:
        raise HTTPException(
            status_code=422,
            detail="Could not extract enough text from that URL. Please paste the job description text directly.",
        )

    # Trim to 8 000 chars to stay within reasonable token limits
    return text[:8000]
