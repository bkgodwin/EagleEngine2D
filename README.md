# Eagle Game Engine 2D

A classroom-friendly, professional 2D game engine and level editor that runs entirely in the browser. Build, play, and share side-scrolling and top-down games with strong emphasis on gameplay systems and design thinking.

## Features

- **Full Level Editor** – Grid-based tilemap editing with Phaser.js, multi-layer support, object placement, and undo/redo
- **Rich Tile Library** – Terrain, platforms, hazards, backgrounds, and decorative elements
- **Object System** – Player (side-scroller / top-down), 8 enemy archetypes, traps, moving platforms, triggers
- **Visual Event System** – No-code Condition → Action behavior configuration
- **Multiplayer** – Real-time co-op/PvP via WebSockets (2–6 players)
- **Game Browser** – Discover, search, and play games published by other users
- **Asset Manager** – Upload images and audio with per-user storage quotas
- **Admin Panel** – User management, content moderation, system settings
- **Built-in Docs** – Tutorials and guides accessible directly in the app

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Phaser.js 3 |
| Backend | Python FastAPI |
| Database | SQLite (upgradeable to PostgreSQL) |
| Auth | JWT with bcrypt |
| Real-time | WebSockets |

## Quick Start

```bash
# Clone and launch (installs all prerequisites automatically)
bash start.sh
```

The script will:
1. Verify Python 3.10+ and Node.js 18+ are installed
2. Create a Python virtual environment and install backend dependencies
3. Install frontend npm dependencies
4. Start the FastAPI backend on **http://localhost:8000**
5. Start the Vite dev server on **http://localhost:5173**
6. Display admin credentials in the terminal

## Admin Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `EagleAdmin2024!` |

## URLs

| Service | URL |
|---------|-----|
| App (Frontend) | http://localhost:5173 |
| API (Backend) | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/api/docs |

## Project Structure

```
EagleEngine2D/
├── backend/               # FastAPI backend
│   ├── main.py            # App entry point
│   ├── models.py          # SQLAlchemy ORM models
│   ├── schemas.py         # Pydantic schemas
│   ├── auth.py            # JWT authentication
│   ├── config.py          # Configuration
│   ├── database.py        # Database setup + seeding
│   ├── websocket_manager.py  # Multiplayer WebSocket manager
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py        # /api/auth/*
│       ├── users.py       # /api/users/*
│       ├── projects.py    # /api/projects/*
│       ├── assets.py      # /api/assets/*
│       ├── games.py       # /api/games/*
│       ├── admin.py       # /api/admin/*
│       └── multiplayer.py # /api/sessions/* + WebSocket
├── frontend/              # React + Phaser.js frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/           # Axios API clients
│   │   ├── components/    # React components
│   │   │   ├── Dashboard/
│   │   │   ├── Editor/
│   │   │   ├── GameBrowser/
│   │   │   ├── GamePlayer/
│   │   │   ├── Admin/
│   │   │   ├── Auth/
│   │   │   ├── Profile/
│   │   │   ├── Settings/
│   │   │   ├── Docs/
│   │   │   └── Common/
│   │   ├── game/          # Phaser scenes and registries
│   │   └── store/         # React contexts
│   ├── package.json
│   └── vite.config.js
├── start.sh               # One-command startup script
└── README.md
```

## Deployment (Proxmox LXC)

The application is designed to run on a local network from a Proxmox LXC container. No external services are required. Run `bash start.sh` from the repo root to start both services.

To expose to your local network, set `VITE_API_URL` environment variable to your container's IP before running, and access the app via `http://<container-ip>:5173`.

## Controls (Play Mode)

| Action | Keys |
|--------|------|
| Move | WASD / Arrow Keys |
| Jump | Space |
| Attack | Mouse Click / Z |
| Sprint | Shift |