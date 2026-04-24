import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import UPLOADS_DIR
from database import init_db
from routers import admin, assets, games, multiplayer, projects, users
from routers import auth as auth_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

app = FastAPI(
    title="Eagle Game Engine 2D – Backend API",
    description="REST + WebSocket API for Eagle Engine 2D game creation platform.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS – allow all origins for local development
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static file serving for uploaded assets
# ---------------------------------------------------------------------------
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(assets.router)
app.include_router(games.router)
app.include_router(admin.router)
app.include_router(multiplayer.router)


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
def startup():
    init_db()
    logging.getLogger("startup").info("Database initialized. Eagle Engine 2D backend is ready.")


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "service": "eagle-engine-2d-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
