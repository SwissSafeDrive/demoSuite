from datetime import datetime, timedelta
from database import SessionLocal, engine, Base
from models import Registro


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Registro).count() > 0:
        print("Database già popolato. Skip.")
        db.close()
        return

    ahora = datetime.utcnow()
    registros = [
        {"confianza": 0.94, "ubicacion": "Area urbana — Postazione demo 1", "offset": 0},
        {"confianza": 0.87, "ubicacion": "Area urbana — Postazione demo 2", "offset": 15},
        {"confianza": 0.76, "ubicacion": "Area urbana — Postazione demo 3", "offset": 31},
        {"confianza": 0.91, "ubicacion": "Area urbana — Postazione demo 4", "offset": 42},
    ]

    for i, r in enumerate(registros, start=1):
        reg = Registro(
            inf_id=f"inf_seed_{i:03d}",
            timestamp=ahora + timedelta(minutes=r["offset"]),
            confianza=r["confianza"],
            ubicacion=r["ubicacion"],
            identificatore_demo=f"demo-tech-{i:03d}",
            estado="pendiente",
            origen="simulato",
        )
        db.add(reg)

    db.commit()
    print(f"Inseriti {len(registros)} registri di prova.")
    db.close()


if __name__ == "__main__":
    seed()
