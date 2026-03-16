from pydantic import BaseModel

class ExerciseLog(BaseModel):
    pass

class WorkoutSessionCreate(BaseModel):
    pass

class WorkoutSessionResponse(BaseModel):
    pass

class WorkoutPlanResponse(BaseModel):
    pass

class EquipmentScanResponse(BaseModel):
    pass

class EquipmentUpdateRequest(BaseModel):
    pass
