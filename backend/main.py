from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import math
import os

app = FastAPI()

DATA_FILE = "../data/users.json"

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Load users
# -------------------------
def load_users():

    if not os.path.exists(DATA_FILE):
        return []

    with open(DATA_FILE, "r") as file:
        return json.load(file)


# -------------------------
# Save users
# -------------------------
def save_users(users):

    with open(DATA_FILE, "w") as file:
        json.dump(users, file, indent=4)


# -------------------------
# Distance calculation
# -------------------------
def distance_miles(lat1, lon1, lat2, lon2):

    R = 3958.8

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat/2)**2 +
        math.cos(math.radians(lat1)) *
        math.cos(math.radians(lat2)) *
        math.sin(dlon/2)**2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return R * c


# -------------------------
# Root endpoint
# -------------------------
@app.get("/")
def home():
    return {"message": "Location App API running"}


# -------------------------
# Get all users
# -------------------------
@app.get("/users")
def get_users():
    return load_users()


# -------------------------
# Get user profile
# -------------------------
@app.get("/profile/{user_id}")
def get_profile(user_id: int):

    users = load_users()

    for user in users:
        if user["id"] == user_id:
            return user

    return {"error": "User not found"}


# -------------------------
# Nearby users (GET version)
# -------------------------
@app.get("/nearby-users")
def nearby_users(lat: float, lon: float, interest: str | None = None):

    users = load_users()
    nearby = []

    for user in users:

        user_lat = user.get("latitude") or user.get("lat")
        user_lon = user.get("longitude") or user.get("lon")

        dist = distance_miles(lat, lon, user_lat, user_lon)

        if dist <= 5:

            if interest:
                if interest.lower() not in [i.lower() for i in user["interests"]]:
                    continue

            nearby.append({
                "id": user["id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "age": user["age"],
                "gender": user["gender"],
                "bio": user.get("bio", ""),
                "interests": user["interests"],
                "city": user.get("city", ""),
                "lat": user_lat,
                "lon": user_lon,
                "photo": user.get("photo", ""),
                "distance": round(dist, 2)
            })

    return nearby


# -------------------------
# Nearby users (POST version)
# Used by new JS code
# -------------------------
@app.post("/users-nearby")
def users_nearby(location: dict):

    lat = location.get("lat")
    lon = location.get("lon")

    users = load_users()
    nearby = []

    for user in users:

        user_lat = user.get("latitude") or user.get("lat")
        user_lon = user.get("longitude") or user.get("lon")

        dist = distance_miles(lat, lon, user_lat, user_lon)

        if dist <= 5:

            nearby.append({
                "id": user["id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "age": user["age"],
                "gender": user["gender"],
                "bio": user.get("bio", ""),
                "interests": user["interests"],
                "city": user.get("city", ""),
                "lat": user_lat,
                "lon": user_lon,
                "photo": user.get("photo", ""),
                "distance": round(dist, 2)
            })

    return nearby


# -------------------------
# Signup endpoint
# -------------------------
@app.post("/signup")
def signup(user: dict):

    users = load_users()

    if users:
        new_id = max(u["id"] for u in users) + 1
    else:
        new_id = 1

    user["id"] = new_id

    users.append(user)

    save_users(users)

    return {"message": "User created", "user_id": new_id}


# -------------------------
# Simple login
# -------------------------
@app.post("/login")
def login(email: str):

    users = load_users()

    for user in users:
        if user.get("email") == email:
            return {"user_id": user["id"]}

    return {"error": "User not found"}