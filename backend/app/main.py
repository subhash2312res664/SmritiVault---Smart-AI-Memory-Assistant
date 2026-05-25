from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.auth_routes import auth_router

app = FastAPI(
    title="Smart AI Memory Assistant",
    description="Never forget where you put things 🧠",
    version="1.0.0",
)

# CORS — restrict origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)   # /auth/register, /auth/login
app.include_router(router)        # /log_item, /search_item, etc.


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Smart Memory Assistant API is running 🚀"}
