from fastapi import FastAPI, HTTPException, UploadFile, File
import donut_service
from pydantic import BaseModel
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import joblib
import uvicorn
import os

app = FastAPI(title="Transaction Categorization Service")

# --- Configuration ---
MODEL_DIR = './'
BERT_PATH = f'{MODEL_DIR}distilbert_transaction_model'
LABEL_ENCODER_PATH = f'{MODEL_DIR}distilbert_label_encoder.pkl'

# --- Global Variables ---
model = None
tokenizer = None
label_encoder = None

# --- Data Models ---
class TransactionRequest(BaseModel):
    description: str

class TransactionResponse(BaseModel):
    category: str
    confidence: float

# --- Startup Event ---
@app.on_event("startup")
async def load_model():
    global model, tokenizer, label_encoder
    try:
        print("Loading DistilBERT model...")
        tokenizer = DistilBertTokenizer.from_pretrained(BERT_PATH)
        model = DistilBertForSequenceClassification.from_pretrained(BERT_PATH)
        model.eval() # Set to evaluation mode
        
        print("Loading Label Encoder...")
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")
        raise RuntimeError("Failed to load model artifacts")

# --- Prediction Endpoint ---
@app.post("/predict", response_model=TransactionResponse)
async def predict_category(request: TransactionRequest):
    if not model or not tokenizer or not label_encoder:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        inputs = tokenizer(request.description, return_tensors="pt", truncation=True, padding=True, max_length=64)
        
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=1)
            
        confidence, predicted_class_idx = torch.max(probabilities, dim=1)
        predicted_category = label_encoder.inverse_transform([predicted_class_idx.item()])[0]
        
        return TransactionResponse(
            category=predicted_category,
            confidence=float(confidence.item())
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# --- OCR Endpoint ---
@app.post("/extract/receipt")
async def extract_receipt(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        # Use Donut Model instead of EasyOCR
        data = donut_service.extract_with_donut(contents)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Health Check ---
@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}


# --- Goal Prediction Models ---
class TransactionItem(BaseModel):
    date: str
    amount: float
    type: str # 'Credit' or 'Debit'
    category: str

class GoalRequest(BaseModel):
    transactions: list[TransactionItem]
    goal_target: float
    goal_current: float
    goal_deadline: str
    goal_created_at: str | None = None

# --- Goal Prediction Endpoint ---
import goal_prediction

@app.post("/predict_goal_completion")
async def predict_goal(request: GoalRequest):
    try:
        # Convert Pydantic models to list of dicts for the service
        history = [t.dict() for t in request.transactions]
        
        result = goal_prediction.predict_goal_completion(
            history,
            request.goal_target,
            request.goal_current,
            request.goal_deadline,
            goal_created_at=request.goal_created_at
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
