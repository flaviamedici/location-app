from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from auth import hash_password, create_access_token
from geoalchemy2.functions import ST_DWithin
from geoalchemy2.elements import WKTElement

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/signup")
def signup(username: str, email: str, password: str, lat: float, lon: float, db: Session = Depends(get_db)):
    location = WKTElement(f'POINT({lon} {lat})', srid=4326)

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        location=location
    )

    db.add(user)
    db.commit()

    return {"message": "User created"}

@app.get("/nearby")
def nearby(user_id: int, db: Session = Depends(get_db)):

    current_user = db.query(User).filter(User.id == user_id).first()

    nearby_users = db.query(User).filter(
        ST_DWithin(
            User.location,
            current_user.location,
            8046
        )
    ).all()

    return [{"username": u.username} for u in nearby_users if u.id != user_id]
