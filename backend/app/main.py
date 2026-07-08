from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.core.database import connect_to_database, close_database_connection

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle events."""
    # ── Startup ──
    await connect_to_database()
    yield
    # ── Shutdown ──
    await close_database_connection()


app = FastAPI(
    title=settings.APP_NAME,
    description="Campus food ordering platform for KIIT University",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────
# Comma-separated list of allowed frontend origins, e.g.
# "https://kiiteats.vercel.app,http://localhost:5173"
_cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173")
_allowed_origins = [o.strip() for o in _cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ─────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


# ── Routers ───────────────────────────────────────────────────────────────
from app.routes import auth, vendors, foods, cart, orders, payments, group_orders, splits, admin, ws

app.include_router(auth.router)
app.include_router(vendors.router)
app.include_router(foods.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(group_orders.router)
app.include_router(splits.router)
app.include_router(admin.router)
app.include_router(ws.router)


# ── Serve React SPA (only in production / Docker) ────────────────────────
_static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.isdir(_static_dir):
    # Serve bundled JS/CSS/images from /assets
    _assets_dir = os.path.join(_static_dir, "assets")
    if os.path.isdir(_assets_dir):
        app.mount(
            "/assets",
            StaticFiles(directory=_assets_dir),
            name="static-assets",
        )

    # Serve public files (food/, logo.svg, header_img.png, etc.)
    _food_dir = os.path.join(_static_dir, "food")
    if os.path.isdir(_food_dir):
        app.mount(
            "/food",
            StaticFiles(directory=_food_dir),
            name="static-food",
        )

    # Catch-all: serve static files or index.html for client-side routing
    @app.get("/{rest_of_path:path}", include_in_schema=False)
    async def serve_spa(rest_of_path: str):
        # If the path points to a real file in static dir, serve it
        file_path = os.path.join(_static_dir, rest_of_path)
        if rest_of_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise serve index.html (React Router handles routing)
        return FileResponse(os.path.join(_static_dir, "index.html"))