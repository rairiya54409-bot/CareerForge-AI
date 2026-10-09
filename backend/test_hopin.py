
import requests

BASE_URL = "https://api.hopinjobs.com/api"

tests = [
    ("/jobs", {}),
    ("/jobs", {"is_unofficial": "true"}),
    ("/internships", {}),
    ("/internships", {"is_unofficial": "true"}),
]

for endpoint, params in tests:
    try:
        response = requests.get(
            BASE_URL + endpoint,
            params=params,
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()

        key = "internships" if endpoint == "/internships" else "jobs"
        listings = data.get(key, [])

        print(
            f"{endpoint} | params={params} | "
            f"status={response.status_code} | count={len(listings)}"
        )

        if listings:
            job = listings[0]
            print("Sample:", {
                "title": job.get("title"),
                "company": job.get("company"),
                "location": job.get("location"),
            })

    except Exception as exc:
        print(f"{endpoint} | ERROR: {type(exc).__name__}: {exc}")
