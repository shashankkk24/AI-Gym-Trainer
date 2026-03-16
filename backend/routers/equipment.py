from fastapi import APIRouter

router = APIRouter()

@router.post("/scan")
async def scan_equipment():
    return {"equipment": [], "available_exercises": []}

@router.put("/{user_id}")
async def update_equipment(user_id: str, equipment: dict):
    return {"success": True}
