from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, status

from database.connection import db
from schemas.recovery_schema import InjuryCreate, PainLogCreate
from services import physio_engine


router = APIRouter(prefix="/api/recovery", tags=["Recovery"])


@router.post("/injuries")
async def create_injury(payload: InjuryCreate) -> dict[str, object]:
    try:
        user_id = ObjectId(payload.user_id)
    except InvalidId as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id provided.",
        ) from exc

    try:
        rehab_exercises = physio_engine.get_rehab_exercises(
            payload.body_part,
            payload.severity,
            week=1,
        )

        injury_document = {
            "user_id": user_id,
            "body_part": payload.body_part,
            "severity": payload.severity,
            "description": payload.description,
            "is_active": True,
            "declared_date": datetime.utcnow(),
            "recovery_date": None,
            "pain_logs": [],
            "rehab_exercises": rehab_exercises,
        }

        result = await db["injuries"].insert_one(injury_document)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create injury.",
        ) from exc

    return {"success": True, "injury_id": str(result.inserted_id)}


@router.get("/injuries/{user_id}")
async def get_injuries(user_id: str) -> dict[str, object]:
    try:
        uid = ObjectId(user_id)
    except InvalidId as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id provided.",
        ) from exc

    try:
        cursor = db["injuries"].find({"user_id": uid}).sort("declared_date", -1)
        documents = await cursor.to_list(length=200)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch injuries.",
        ) from exc

    injuries = []
    for doc in documents:
        injuries.append(
            {
                "id": str(doc["_id"]),
                "body_part": doc.get("body_part", ""),
                "severity": doc.get("severity", ""),
                "description": doc.get("description", ""),
                "is_active": doc.get("is_active", True),
                "declared_date": doc.get("declared_date"),
                "pain_logs": doc.get("pain_logs", []),
                "rehab_exercises": doc.get("rehab_exercises", []),
            }
        )

    return {"injuries": injuries}


@router.get("/rehab/{injury_id}")
async def get_rehab_exercises(injury_id: str, week: int = 1) -> dict[str, object]:
    try:
        iid = ObjectId(injury_id)
    except InvalidId as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid injury_id provided.",
        ) from exc

    try:
        injury = await db["injuries"].find_one({"_id": iid})
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch injury.",
        ) from exc

    if injury is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Injury not found.",
        )

    exercises = physio_engine.get_rehab_exercises(
        injury["body_part"],
        injury["severity"],
        week=week,
    )

    return {"exercises": exercises}


@router.post("/pain-log")
async def create_pain_log(payload: PainLogCreate) -> dict[str, object]:
    try:
        iid = ObjectId(payload.injury_id)
    except InvalidId as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid injury_id provided.",
        ) from exc

    pain_entry = {
        "date": datetime.utcnow(),
        "pain_score": payload.pain_score,
        "notes": payload.notes,
    }

    try:
        result = await db["injuries"].update_one(
            {"_id": iid},
            {"$push": {"pain_logs": pain_entry}},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log pain.",
        ) from exc

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Injury not found.",
        )

    return {"success": True}