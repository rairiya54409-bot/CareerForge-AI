from app.services.job_provider import get_jobs


print("\n================================")
print("CAREERFORGE LIVE JOB TEST")
print("================================")


jobs = get_jobs(
    query="data",
    include_internships=True,
    limit=10,
)


print(
    "\nLIVE MATCHING JOBS:",
    len(jobs),
)


for index, job in enumerate(
    jobs,
    start=1,
):

    print(
        f"\nJOB {index}"
    )

    print(
        "----------------------------"
    )

    print(
        "Title:",
        job["title"],
    )

    print(
        "Company:",
        job["company"],
    )

    print(
        "Location:",
        job["location"],
    )

    print(
        "Type:",
        job["type"],
    )

    print(
        "Work Model:",
        job["work_model"],
    )

    print(
        "Industry:",
        job["industry"],
    )

    print(
        "Verification:",
        job["verify_status"],
    )

    print(
        "Scam Verdict:",
        job["scam_verdict"],
    )

    print(
        "Apply URL:",
        job["url"],
    )