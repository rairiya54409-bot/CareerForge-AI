
from typing import Any, Dict, List
from html import unescape
import re
import time

import requests

HOPIN_BASE_URL = "https://api.hopinjobs.com/api"
REMOTIVE_URL = "https://remotive.com/api/remote-jobs"
REQUEST_TIMEOUT = 20
CACHE_SECONDS = 6 * 60 * 60

_remotive_cache: List[Dict[str, Any]] = []
_remotive_cache_time = 0.0


def clean_html(value: Any) -> str:
    """Convert HTML descriptions into readable text."""
    if not value:
        return ""

    value = re.sub(
        r"<(script|style)\b[^>]*>.*?</\1>",
        " ",
        str(value),
        flags=re.IGNORECASE | re.DOTALL,
    )
    value = re.sub(r"<[^>]+>", " ", value)
    value = unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def normalize_job(
    job: Dict[str, Any],
    source: str = "Hopin",
) -> Dict[str, Any]:
    """Normalize provider job records for CareerForge."""

    if source == "Remotive":
        title = job.get("title", "")
        company = job.get("company_name") or "Unknown company"
        url = job.get("url", "")
        description = clean_html(job.get("description", ""))
        tags = job.get("tags", [])
        location = job.get("candidate_required_location") or "Remote"
        posted = job.get("publication_date")

        return {
            "id": f"remotive-{job.get('id', url)}",
            "title": title,
            "company": company,
            "company_name": company,
            "location": location,
            "description": description,
            "url": url,
            "apply_url": url,
            "job_type": job.get("job_type", ""),
            "employment_type": job.get("job_type", ""),
            "skills": tags if isinstance(tags, list) else [],
            "tags": tags if isinstance(tags, list) else [],
            "category": job.get("category", ""),
            "salary": job.get("salary", ""),
            "posted_date": posted,
            "publication_date": posted,
            "source": "Remotive",
            "provider": "Remotive",
            "remote": True,
            "is_active": True,
        }

    title = job.get("title") or job.get("position") or ""
    company = job.get("company") or job.get("company_name") or "Unknown company"
    url = (
        job.get("url")
        or job.get("apply_url")
        or job.get("application_url")
        or ""
    )
    tags = job.get("tags") or job.get("skills") or []

    return {
        **job,
        "id": str(job.get("id") or url or f"{company}-{title}"),
        "title": title,
        "company": company,
        "company_name": company,
        "location": job.get("location") or "Not specified",
        "description": clean_html(job.get("description", "")),
        "url": url,
        "apply_url": url,
        "skills": tags if isinstance(tags, list) else [],
        "tags": tags if isinstance(tags, list) else [],
        "source": source,
        "provider": source,
        "is_active": job.get("is_active", True),
    }


def fetch_hopin_jobs() -> List[Dict[str, Any]]:
    """Fetch jobs and internships from Hopin."""
    results: List[Dict[str, Any]] = []

    for endpoint, key in [
        ("/jobs", "jobs"),
        ("/internships", "internships"),
    ]:
        try:
            response = requests.get(
                HOPIN_BASE_URL + endpoint,
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
            listings = data.get(key, []) if isinstance(data, dict) else []

            if isinstance(listings, list):
                for item in listings:
                    if isinstance(item, dict):
                        results.append(normalize_job(item, "Hopin"))

        except (requests.RequestException, ValueError) as exc:
            print(f"Hopin {endpoint} failed: {exc}")

    return results


def fetch_remotive_jobs(
    force_refresh: bool = False,
) -> List[Dict[str, Any]]:
    """Fetch and cache Remotive remote job listings."""
    global _remotive_cache, _remotive_cache_time

    now = time.time()

    if (
        not force_refresh
        and _remotive_cache
        and now - _remotive_cache_time < CACHE_SECONDS
    ):
        return list(_remotive_cache)

    try:
        response = requests.get(
            REMOTIVE_URL,
            params={"limit": 100},
            timeout=REQUEST_TIMEOUT,
            headers={"User-Agent": "CareerForge-AI/1.0"},
        )
        response.raise_for_status()
        data = response.json()
        listings = data.get("jobs", []) if isinstance(data, dict) else []

        normalized: List[Dict[str, Any]] = []

        if isinstance(listings, list):
            for item in listings:
                if not isinstance(item, dict):
                    continue

                job = normalize_job(item, "Remotive")

                if job["title"] and job["url"]:
                    normalized.append(job)

        _remotive_cache = normalized
        _remotive_cache_time = now

        print(f"Remotive returned {len(normalized)} usable jobs")
        return list(normalized)

    except (requests.RequestException, ValueError) as exc:
        print(f"Remotive provider failed: {exc}")
        return []


def get_live_jobs() -> List[Dict[str, Any]]:
    """Use Hopin first, with Remotive as a fallback."""
    hopin_jobs = fetch_hopin_jobs()

    if hopin_jobs:
        print(f"Hopin returned {len(hopin_jobs)} jobs")
        return hopin_jobs

    print("Hopin returned zero jobs; trying Remotive.")
    return fetch_remotive_jobs()


def get_live_internships() -> List[Dict[str, Any]]:
    """Return listings whose title or type suggests an internship."""
    jobs = get_live_jobs()
    terms = ("intern", "internship", "trainee", "co-op")

    return [
        job
        for job in jobs
        if any(
            term in (
                str(job.get("title", ""))
                + " "
                + str(job.get("job_type", ""))
            ).lower()
            for term in terms
        )
    ]


def filter_jobs(
    jobs: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Remove malformed and duplicate listings."""
    unique: Dict[str, Dict[str, Any]] = {}

    for job in jobs:
        title = str(job.get("title", "")).strip()
        url = str(job.get("url") or job.get("apply_url") or "").strip()

        if not title or not url:
            continue

        job["url"] = url
        job["apply_url"] = job.get("apply_url") or url
        unique[url.lower()] = job

    return list(unique.values())



def get_jobs(
    include_internships: bool = True,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    """
    Return normalized jobs for CareerForge recommendations.

    include_internships: Include internship and trainee listings.
    limit: Maximum number of jobs returned.
    """
    jobs = filter_jobs(get_live_jobs())

    if not include_internships:
        terms = ("intern", "internship", "trainee", "co-op")

        jobs = [
            job
            for job in jobs
            if not any(
                term in (
                    str(job.get("title", ""))
                    + " "
                    + str(job.get("job_type", ""))
                ).lower()
                for term in terms
            )
        ]

    # Avoid negative limits; limit=0 returns no jobs.
    limit = max(0, int(limit))
    jobs = jobs[:limit]

    print(
        f"get_jobs(include_internships={include_internships}, "
        f"limit={limit}) returned: {len(jobs)}"
    )

    return jobs
