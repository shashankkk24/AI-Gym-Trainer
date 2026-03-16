from fastapi import APIRouter

router = APIRouter()

@router.get("/plan/{user_id}")
async def get_workout_plan(user_id: str):
    return {"plan": {}}

@router.post("/sessions")
async def create_session(session: dict):
    return {"success": True, "session_id": "123"}

@router.get("/history/{user_id}")
async def get_history(user_id: str):
    return {"sessions": []}

@router.websocket("/ws/exercise/{exercise_type}")
async def exercise_websocket(websocket, exercise_type: str):
    await websocket.accept()
    # Stub for websocket
