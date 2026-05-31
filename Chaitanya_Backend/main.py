from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.analyze import router

app = FastAPI(
    title="Civic Scam Shield API",
    description="AI-powered scam detection for Indian citizens",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {"status": "Civic Scam Shield API is running", "docs": "/docs"}
