from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router

# Create FastAPI app
app = FastAPI(title="Smart AI Memory Assistant")

# Enable CORS (important for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development (later restrict)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes
app.include_router(router)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Smart Memory Assistant API is running 🚀"}