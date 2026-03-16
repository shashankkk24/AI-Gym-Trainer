import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.recovery import router as recovery_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 FastAPI server starting...")
    yield
    # Shutdown
    print("⏹️ FastAPI server shutting down...")


app = FastAPI(
    title="GRIT Hackathon API",
    description="Fitness recovery system API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(recovery_router)


@app.get("/")
async def root():
    return {"message": "GRIT Hackathon API is running", "status": "healthy"}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "grit-hackathon-api"}


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
    )