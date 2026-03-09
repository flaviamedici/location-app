# location-app
Location-Based Social Discovery App

A full-stack location-based social discovery application where users can sign up, discover nearby people within a 5-mile radius, view profiles, and communicate through real-time private messaging.

This project demonstrates a modern web architecture using a Python backend and a JavaScript frontend, with geolocation services and live messaging.

Features
User Features

User signup and login

Discover nearby users within 5 miles

View profiles with interests and personal details

Map visualization of nearby users

Filter users by interests

Real-time private messaging

Modern responsive UI

Technical Features

Location detection using browser Geolocation API

Distance filtering using geographic calculations

Interactive map visualization

Real-time messaging using WebSockets

REST API backend

JSON-based data storage (no database required for prototype)

### Tech Stack
#### Frontend

HTML5

CSS3

JavaScript (Vanilla)

Leaflet for map rendering

#### Backend

FastAPI

Uvicorn

WebSocket for real-time messaging

#### Data Storage

JSON file storage (users.json)

```
location-app

backend/
    main.py

frontend/
    index.html
    dashboard.html
    script.js
    styles.css

data/
    users.json

```
