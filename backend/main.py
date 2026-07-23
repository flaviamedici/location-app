from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
import json
import math
import os
import sqlite3
from pathlib import Path

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
DATA_DIR = PROJECT_DIR / "data"
DB_FILE = DATA_DIR / "location.db"
SEED_FILE = DATA_DIR / "users.json"
FRONTEND_DIR = PROJECT_DIR / "frontend"

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserIn(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    age: int
    gender: str | None = None
    city: str | None = None
    bio: str | None = None
    interests: list[str] | str = []
    photo: str | None = None
    lat: float | None = None
    lon: float | None = None


class LocationIn(BaseModel):
    lat: float
    lon: float


class EmailIn(BaseModel):
    email: EmailStr


def get_db_connection():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    with conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                age INTEGER,
                gender TEXT,
                city TEXT,
                bio TEXT,
                interests TEXT,
                photo TEXT,
                lat REAL,
                lon REAL
            )
            """
        )

        row = conn.execute("SELECT COUNT(*) as count FROM users").fetchone()
        if row is None or row["count"] == 0:
            seed_database(conn)
    conn.close()


def seed_database(conn):
    if not SEED_FILE.exists():
        return

    with open(SEED_FILE, "r", encoding="utf-8") as file:
        users = json.load(file)

    for user in users:
        interests = user.get("interests", [])
        if isinstance(interests, str):
            interests = [i.strip() for i in interests.split(",") if i.strip()]

        lat = user.get("lat") if user.get("lat") is not None else user.get("latitude")
        lon = user.get("lon") if user.get("lon") is not None else user.get("longitude")

        conn.execute(
            """
            INSERT OR IGNORE INTO users
            (first_name, last_name, email, age, gender, city, bio, interests, photo, lat, lon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user.get("first_name"),
                user.get("last_name"),
                user.get("email") or f"seed{user.get('id')}@example.com",
                user.get("age"),
                user.get("gender"),
                user.get("city"),
                user.get("bio"),
                json.dumps(interests),
                user.get("photo", ""),
                lat,
                lon,
            ),
        )


def distance_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return 3958.8 * c


def row_to_user(row):
    if row is None:
        return None

    interests = []
    if row["interests"]:
        try:
            interests = json.loads(row["interests"])
        except json.JSONDecodeError:
            interests = [i.strip() for i in str(row["interests"]).split(",") if i.strip()]

    return {
        "id": row["id"],
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "email": row["email"],
        "age": row["age"],
        "gender": row["gender"],
        "city": row["city"],
        "bio": row["bio"] or "",
        "interests": interests,
        "photo": row["photo"] or "",
        "lat": row["lat"],
        "lon": row["lon"],
    }


def load_users():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM users").fetchall()
    conn.close()
    return [row_to_user(row) for row in rows]


def find_user_by_email(email: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    return row_to_user(row)


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/users")
def get_users():
    return load_users()


@app.get("/profile/{user_id}")
def get_profile(user_id: int):
    user = next((u for u in load_users() if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# -------------------------
# Nearby users (GET version)
# -------------------------
@app.get("/nearby-users")
def nearby_users(lat: float, lon: float, interest: str | None = None):
    users = load_users()
    nearby = []

    for user in users:
        if user["lat"] is None or user["lon"] is None:
            continue

        dist = distance_miles(lat, lon, user["lat"], user["lon"])
        if dist <= 50:
            if interest:
                if interest.lower() not in [i.lower() for i in user["interests"]]:
                    continue

            nearby.append({**user, "distance": round(dist, 2)})

    return nearby


# -------------------------
# Nearby users (POST version)
# Used by new JS code
# -------------------------
@app.post("/users-nearby")
def users_nearby(location: LocationIn):
    users = load_users()
    nearby = []

    for user in users:
        if user["lat"] is None or user["lon"] is None:
            continue

        dist = distance_miles(location.lat, location.lon, user["lat"], user["lon"])
        if dist <= 50:
            nearby.append({**user, "distance": round(dist, 2)})

    return nearby


# -------------------------
# Signup endpoint
# -------------------------
@app.post("/signup")
def signup(user: UserIn):
    interests = user.interests
    if isinstance(interests, str):
        interests = [i.strip() for i in interests.split(",") if i.strip()]

    conn = get_db_connection()
    try:
        with conn:
            cursor = conn.execute(
                """
                INSERT INTO users
                (first_name, last_name, email, age, gender, city, bio, interests, photo, lat, lon)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user.first_name,
                    user.last_name,
                    user.email,
                    user.age,
                    user.gender,
                    user.city,
                    user.bio,
                    json.dumps(interests),
                    user.photo or "",
                    user.lat,
                    user.lon,
                ),
            )
            new_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    finally:
        conn.close()

    return {"message": "User created", "user_id": new_id}


# -------------------------
# Simple login
# -------------------------
@app.post("/login")
def login(payload: EmailIn):
    user = find_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user["id"]}


# Serve static frontend files
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)