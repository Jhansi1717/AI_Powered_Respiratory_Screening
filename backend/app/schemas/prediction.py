from pydantic import BaseModel

class PredictionRequest(BaseModel):
    dummy_input: str

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float