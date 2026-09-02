# pyright: reportMissingImports=false
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from routers import cv, analyze, pdf, history, profile

settings = get_settings()

app = FastAPI(
    title="CVMatch Pro API",
    description="AI-powered CV optimizer backend — Python/FastAPI/ReportLab",
    version="1.0.0",
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(cv.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(pdf.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(profile.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "service": "CVMatch Pro API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
