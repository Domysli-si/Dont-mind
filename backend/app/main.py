from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import get_pool, close_pool
from app.api.routes import moods, journal, analytics, recommendations, preferences, sync


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()


app = FastAPI(
    title="dont-worry API",
    description="Mental well-being tracking API",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(moods.router)
app.include_router(journal.router)
app.include_router(analytics.router)
app.include_router(recommendations.router)
app.include_router(preferences.router)
app.include_router(sync.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
