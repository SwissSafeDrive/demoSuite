from datetime import UTC, datetime, timedelta
from database import SessionLocal
from main import ensure_schema
from models import Record, SIMULATED_NOTICE


def seed():
    ensure_schema()
    db = SessionLocal()

    if db.query(Record).count() > 0:
        print("Database already seeded.")
        db.close()
        return

    now = datetime.now(UTC)
    records = [
        {"confidence": 0.94, "location": "Urban area — Demo station 1", "offset": 0},
        {"confidence": 0.87, "location": "Urban area — Demo station 2", "offset": 15},
        {"confidence": 0.76, "location": "Urban area — Demo station 3", "offset": 31},
        {"confidence": 0.91, "location": "Urban area — Demo station 4", "offset": 42},
    ]

    for i, r in enumerate(records, start=1):
        record = Record(
            event_id=f"inf_seed_{i:03d}",
            timestamp=now + timedelta(minutes=r["offset"]),
            confidence=r["confidence"],
            location=r["location"],
            demo_id=f"demo-tech-{i:03d}",
            state="pending",
            origin="simulated",
            notice=SIMULATED_NOTICE,
        )
        db.add(record)

    db.commit()
    print(f"Inserted {len(records)} demo records.")
    db.close()


if __name__ == "__main__":
    seed()
